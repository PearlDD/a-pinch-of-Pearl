import { chromium, type Browser } from 'playwright-core';
import { validateSourceUrl } from './recipeImportFetch';
import { ImportError, IMPORT_TEXT_LIMIT } from './recipeImport';
import { createPublicBrowserProxy } from './recipeImportProxy';

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36';
export type RenderedRecipeSource = { text: string; html: string; sourceUrl: string; videoUrl: string; captionUrl: string; isVideo: boolean };

async function launchBrowser(proxy?: string): Promise<Browser> {
  const options = { headless: true, ...(proxy ? { proxy: { server: proxy }, args: ['--proxy-bypass-list=<-loopback>', '--force-webrtc-ip-handling-policy=disable_non_proxied_udp'] } : {}) };
  try {
    if (process.env.RECIPE_BROWSER_EXECUTABLE_PATH) return await chromium.launch({ ...options, executablePath: process.env.RECIPE_BROWSER_EXECUTABLE_PATH });
    if (process.platform === 'linux') {
      const { default: serverChromium } = await import('@sparticuz/chromium');
      return await chromium.launch({ ...options, executablePath: await serverChromium.executablePath(), args: [...serverChromium.args, ...(options.args || [])] });
    }
    return await chromium.launch(options);
  } catch {
    throw new ImportError('The page reader could not start. Install Chromium locally or configure RECIPE_BROWSER_EXECUTABLE_PATH. On Linux the bundled browser is used.', 503);
  }
}

export function needsBrowser(input: string): boolean {
  const host = validateSourceUrl(input).hostname;
  return /(^|\.)(rednote\.com|xiaohongshu\.com|xhslink\.com|chatgpt\.com)$/.test(host);
}

export function normalizeVideoUrl(input: string): string {
  if (!input || input.startsWith('blob:')) return input;
  const url = new URL(input);
  // Rednote's metadata may contain HTTP CDN URLs even though HTTPS is served.
  if (url.protocol === 'http:' && /(^|\.)rednotecdn\.com$/.test(url.hostname)) url.protocol = 'https:';
  return validateSourceUrl(url.href).href;
}

export async function renderRecipeSource(input: string): Promise<RenderedRecipeSource> {
  validateSourceUrl(input);
  const proxy = await createPublicBrowserProxy();
  let browser: Browser | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    browser = await launchBrowser(proxy.url);
    timer = setTimeout(() => { void browser?.close(); }, 35000);
    const context = await browser.newContext({ userAgent: USER_AGENT, serviceWorkers: 'block', acceptDownloads: false });
    let requests = 0;
    // HTTP(S) traffic goes through the IP-pinned CONNECT proxy, including
    // redirects and subresources. Media is downloaded separately with a bound.
    await context.route('**/*', async route => {
      const req = route.request();
      const url = new URL(req.url());
      const readPost = req.method() === 'POST' && /(^|\.)rednote\.com$/.test(url.hostname) && url.pathname === '/api/sns/web/racing_get';
      if (++requests > 150 || url.protocol !== 'https:' || (req.method() !== 'GET' && !readPost) || ['image', 'media', 'font'].includes(req.resourceType())) {
        await route.abort(); return;
      }
      await route.continue();
    });
    await context.routeWebSocket('**/*', socket => socket.close());
    const page = await context.newPage();
    await page.goto(input, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForFunction(() => {
      const state = (window as unknown as { __INITIAL_STATE__?: { note?: { noteDetailMap?: Record<string, { note?: { desc?: string } }> } } }).__INITIAL_STATE__;
      return Object.values(state?.note?.noteDetailMap || {}).some(item => item.note?.desc) ||
        Array.from(document.querySelectorAll('[data-message-author-role="assistant"]')).some(node => (node.textContent || '').trim().length > 30);
    }, undefined, { timeout: 12000 }).catch(() => {});
    const extracted = await page.evaluate(() => {
      type VideoStream = { masterUrl?: string; backupUrls?: string[] };
      type Note = { title?: string; desc?: string; type?: string; video?: { media?: { stream?: { h264?: VideoStream[] } } } };
      const state = (window as unknown as { __INITIAL_STATE__?: { note?: { noteDetailMap?: Record<string, { note?: Note }> } } }).__INITIAL_STATE__;
      const id = location.pathname.split('/').filter(Boolean).pop();
      const entries = state?.note?.noteDetailMap || {};
      const note = (id && entries[id]?.note) || Object.values(entries).find(item => item.note?.desc)?.note;
      const video = document.querySelector('video');
      const caption = video?.querySelector('track[kind="captions"],track[kind="subtitles"]');
      const assistants = Array.from(document.querySelectorAll('[data-message-author-role="assistant"]')).map(node => (node as HTMLElement).innerText.trim()).filter(Boolean);
      const chatShare = location.hostname === 'chatgpt.com';
      // Do not mix comments, related recipes, login dialogs or the user's prompt
      // into a recipe. For shared chats use the last assistant answer only.
      const text = note ? [note.title, note.desc].filter(Boolean).join('\n\n') :
        chatShare ? assistants.slice(-1).join('\n\n') :
          ((document.querySelector('article, main') as HTMLElement | null)?.innerText || document.body.innerText);
      return {
        text,
        videoUrl: note?.video?.media?.stream?.h264?.[0]?.masterUrl || video?.currentSrc || video?.src || '',
        captionUrl: caption?.getAttribute('src') ? (caption as HTMLTrackElement).src : '',
        isVideo: note?.type === 'video' || !!video,
      };
    });
    return { ...extracted, videoUrl: normalizeVideoUrl(extracted.videoUrl), text: extracted.text.slice(0, IMPORT_TEXT_LIMIT), html: await page.content(), sourceUrl: page.url() };
  } finally { clearTimeout(timer); try { await browser?.close(); } finally { await proxy.close(); } }
}

export async function prepareVideoMedia(body: Buffer, contentType: string): Promise<{ images: string[]; audio: Buffer | null }> {
  const browser = await launchBrowser();
  const timer = setTimeout(() => { void browser.close(); }, 30000);
  try {
    const context = await browser.newContext({ serviceWorkers: 'block', acceptDownloads: false, viewport: { width: 480, height: 854 } });
    await context.route('**/*', route => route.abort());
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    await page.setContent('<video muted playsinline style="width:480px;height:854px;object-fit:contain;background:black"></video>');
    const dataUrl = `data:${contentType.split(';')[0]};base64,${body.toString('base64')}`;
    const duration = await page.evaluate(async src => {
      const video = document.querySelector('video')!;
      return await new Promise<number>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Video metadata timeout')), 8000);
        video.onloadedmetadata = () => { clearTimeout(timer); resolve(video.duration); };
        video.onerror = () => { clearTimeout(timer); reject(new Error('Unsupported video')); };
        video.src = src;
      });
    }, dataUrl);
    if (!Number.isFinite(duration) || duration <= 0 || duration > 300) throw new ImportError('Automatic video import supports clips up to five minutes. Paste a transcript for longer videos.');
    const images: string[] = [];
    const count = Math.min(12, Math.max(4, Math.ceil(duration / 6)));
    for (let i = 0; i < count; i++) {
      const fraction = (i + 0.5) / count;
      await page.evaluate(async time => {
        const video = document.querySelector('video')!;
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('Video seek timeout')), 5000);
          video.onseeked = () => { clearTimeout(timer); resolve(); };
          video.currentTime = time;
        });
      }, Math.min(duration * fraction, duration - 0.01));
      const image = await page.evaluate(() => {
        const video = document.querySelector('video')!;
        const canvas = document.createElement('canvas');
        const scale = Math.min(480 / video.videoWidth, 854 / video.videoHeight);
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale)); canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.65);
      });
      images.push(image);
    }
    const audioBase64 = await page.evaluate(async () => {
      return await Promise.race([extractAudio(), new Promise<string>(resolve => setTimeout(() => resolve(''), 12000))]);
      async function extractAudio() {
      const src = document.querySelector('video')!.src;
      // 12 kHz mono PCM8 keeps a five-minute speech clip below the host's
      // request/response size limit, including base64 and sampled frames.
      const decoded = await new OfflineAudioContext(1, 1, 12000).decodeAudioData(await (await fetch(src)).arrayBuffer());
      const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * 12000), 12000);
      const source = offline.createBufferSource(); source.buffer = decoded; source.connect(offline.destination); source.start();
      const mono = (await offline.startRendering()).getChannelData(0);
      const wav = new Uint8Array(44 + mono.length); const view = new DataView(wav.buffer);
      const write = (offset: number, value: string) => { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)); };
      write(0, 'RIFF'); view.setUint32(4, 36 + mono.length, true); write(8, 'WAVE'); write(12, 'fmt ');
      view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
      view.setUint32(24, 12000, true); view.setUint32(28, 12000, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true);
      write(36, 'data'); view.setUint32(40, mono.length, true);
      for (let i = 0; i < mono.length; i++) { const sample = Math.max(-1, Math.min(1, mono[i])); view.setUint8(44 + i, Math.round((sample + 1) * 127.5)); }
      let binary = ''; for (let i = 0; i < wav.length; i += 32768) binary += String.fromCharCode(...wav.subarray(i, i + 32768));
      return btoa(binary);
      }
    }).catch(() => '');
    // Keep the complete JSON payload below Netlify's buffered payload limit.
    let selected = images;
    while (selected.reduce((size, image) => size + image.length, 0) > 650000 && selected.length > 1) selected = selected.filter((_, i) => i % 2 === 0);
    return { images: selected, audio: audioBase64 ? Buffer.from(audioBase64, 'base64') : null };
  } finally { clearTimeout(timer); await browser.close(); }
}

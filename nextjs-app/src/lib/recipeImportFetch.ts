import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import ipaddr from 'ipaddr.js';
import { ImportError } from './recipeImport';

export type PublicResource = { body: Buffer; contentType: string; url: string; status: number; location?: string };
type FetchOptions = { maxBytes?: number; timeoutMs?: number; userAgent?: string; signal?: AbortSignal };

export function validateSourceUrl(input: string): URL {
  let url: URL;
  try { url = new URL(input); } catch { throw new ImportError('Enter a valid https:// link.', 400); }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) {
    throw new ImportError('Use a public HTTPS link without credentials or a custom port.', 400);
  }
  return url;
}

export function isPublicAddress(address: string): boolean {
  try {
    const parsed = ipaddr.process(address);
    return parsed.range() === 'unicast';
  } catch { return false; }
}

async function fetchOnce(url: URL, signal: AbortSignal, options: FetchOptions): Promise<PublicResource> {
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = await lookup(hostname, { all: true });
  if (!addresses.length || addresses.some(item => !isPublicAddress(item.address))) {
    throw new ImportError('This link does not point to a public website.', 400);
  }
  const pinned = addresses[0];
  return new Promise((resolve, reject) => {
    // Pin the validated DNS answer to the connection to prevent DNS rebinding.
    const req = request(url, {
      signal,
      agent: false,
      family: pinned.family,
      lookup: (_hostname, _options, callback) => callback(null, pinned.address, pinned.family),
      headers: { 'User-Agent': options.userAgent || 'APinchOfPearl-RecipeImporter/1.0', Accept: '*/*', 'Accept-Encoding': 'identity' },
    }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode || 0) && res.headers.location) {
        const location = res.headers.location;
        res.destroy(); resolve({ body: Buffer.alloc(0), contentType: '', url: url.href, status: res.statusCode!, location }); return;
      }
      if (res.statusCode !== 200) {
        res.destroy(); reject(new ImportError('This website could not be read. Paste the post text or video transcript instead.')); return;
      }
      let size = 0;
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > (options.maxBytes || 3 * 1024 * 1024)) res.destroy(new ImportError('This resource is too large to import. Paste the recipe text or transcript instead.'));
        else chunks.push(chunk);
      });
      res.on('end', () => resolve({ body: Buffer.concat(chunks), contentType: res.headers['content-type'] || '', url: url.href, status: res.statusCode! }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

export async function fetchPublicResource(input: string, options: FetchOptions = {}): Promise<PublicResource> {
  const signal = options.signal || AbortSignal.timeout(options.timeoutMs || 15000);
  let url = validateSourceUrl(input);
  for (let redirects = 0; redirects <= 4; redirects++) {
    const response = await fetchOnce(url, signal, options);
    if (!response.location) return response;
    url = validateSourceUrl(new URL(response.location, url).href);
  }
  throw new ImportError('This link redirects too many times. Paste the recipe text instead.');
}

export async function fetchRecipePage(input: string): Promise<{ html: string; url: string }> {
  const response = await fetchPublicResource(input);
  if (!/text\/html|application\/xhtml\+xml/i.test(response.contentType)) {
    throw new ImportError('This link is not a readable web page. Paste the recipe text or video transcript instead.');
  }
  return { html: response.body.toString('utf8'), url: response.url };
}

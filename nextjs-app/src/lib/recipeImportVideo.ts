import { fetchPublicResource, validateSourceUrl } from './recipeImportFetch';
import { ImportError, IMPORT_TEXT_LIMIT } from './recipeImport';
import { prepareVideoMedia } from './recipeImportBrowser';
import { openAIImportError } from './recipeImportAPIError';
import { getRecipeAIConfig } from './recipeAIConfig';
import { transcribeWithGemini } from './recipeImportGemini';

export async function transcribeVideo(body: Buffer, contentType: string): Promise<string> {
  const config = getRecipeAIConfig();
  if (config.provider === 'gemini') return transcribeWithGemini(config, body, contentType);
  const form = new FormData();
  const extension = /wav/i.test(contentType) ? 'wav' : /webm/i.test(contentType) ? 'webm' : /audio\/mpeg/i.test(contentType) ? 'mp3' : 'mp4';
  form.append('file', new Blob([new Uint8Array(body)], { type: contentType.split(';')[0] }), `recipe.${extension}`);
  form.append('model', config.transcriptionModel);
  form.append('response_format', 'json');
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST', headers: { Authorization: `Bearer ${config.key}` }, body: form, signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw await openAIImportError(response, 'Video speech could not be transcribed. Try pasting the subtitles or transcript.');
  const result = await response.json();
  return typeof result.text === 'string' ? result.text.trim().slice(0, IMPORT_TEXT_LIMIT) : '';
}

export function cleanCaptions(input: string): string {
  const lines = input.replace(/<[^>]*>/g, '').split('\n').map(line => line.trim()).filter(line => line && !/^WEBVTT|^NOTE|^\d+$|-->|^Kind:|^Language:/i.test(line));
  return lines.filter((line, i) => i === 0 || line !== lines[i - 1]).join('\n').slice(0, IMPORT_TEXT_LIMIT);
}

export async function prepareRecipeVideo(videoUrl: string, captionUrl: string): Promise<{ transcript: string; images: string[]; audioBase64: string; warnings: string[] }> {
  const warnings: string[] = [];
  let transcript = '';
  if (captionUrl) {
    try {
      const captions = await fetchPublicResource(captionUrl, { maxBytes: 512000, timeoutMs: 5000 });
      if (/text\/(?:vtt|plain)|application\/x-subrip/i.test(captions.contentType)) transcript = cleanCaptions(captions.body.toString('utf8'));
    } catch { warnings.push('The subtitle file could not be read.'); }
  }
  if (!videoUrl || videoUrl.startsWith('blob:')) {
    if (transcript) return { transcript, images: [], audioBase64: '', warnings };
    throw new ImportError('This video does not expose a readable media file or subtitle track. Paste its transcript instead.');
  }
  getRecipeAIConfig();
  validateSourceUrl(videoUrl);
  const media = await fetchPublicResource(videoUrl, { maxBytes: 80 * 1024 * 1024, timeoutMs: 12000 });
  if (!/^video\/(?:mp4|webm)/i.test(media.contentType)) {
    throw new ImportError('This video format is not supported yet. Paste the subtitles or transcript instead.');
  }
  const prepared = /video\//i.test(media.contentType) ? await prepareVideoMedia(media.body, media.contentType).catch(error => {
    if (error instanceof ImportError && error.status === 422) throw error;
    warnings.push('Video frames could not be read; this import uses speech or subtitles only.'); return { images: [], audio: null };
  }) : { images: [], audio: null };
  const { images, audio } = prepared;
  if (!transcript && !audio && !images.length) throw new ImportError('No speech, subtitles or readable video frames were found. Paste the recipe text instead.');
  if (!transcript && !audio) warnings.push('No audio track could be extracted; this import uses sampled frames only.');
  warnings.push(`Video import uses ${images.length} sampled frames. Check for missed ingredients, captions and steps.`);
  return { transcript, images, audioBase64: transcript ? '' : audio?.toString('base64') || '', warnings };
}

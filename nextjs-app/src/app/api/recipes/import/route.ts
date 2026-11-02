import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { extractPage, ImportError, IMPORT_TEXT_LIMIT, parseRecipeText } from '@/lib/recipeImport';
import { fetchRecipePage, validateSourceUrl } from '@/lib/recipeImportFetch';
import { extractRecipeWithAI } from '@/lib/recipeImportAI';
import { needsBrowser, renderRecipeSource } from '@/lib/recipeImportBrowser';
import { prepareRecipeVideo, transcribeVideo } from '@/lib/recipeImportVideo';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function readInput(request: NextRequest): Promise<Record<string, unknown>> {
  if (!request.body) throw new ImportError('Enter a link or paste the recipe text.', 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 5800000) { await reader.cancel(); throw new ImportError('The import payload is too large.', 413); }
    chunks.push(value);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new ImportError('Invalid import request.', 400); }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/)?.[1];
    if (!token) throw new ImportError('Sign in as the site owner to import recipes.', 401);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) throw new ImportError('Your session has expired. Sign in again.', 401);
    if (!process.env.NEXT_PUBLIC_ADMIN_UID || data.user.id !== process.env.NEXT_PUBLIC_ADMIN_UID) {
      throw new ImportError('Only the site owner can import recipes.', 403);
    }
    const input = await readInput(request);
    if (input.action === 'prepare-video') {
      if (typeof input.videoUrl !== 'string' || typeof input.captionUrl !== 'string' || input.videoUrl.length > 4000 || input.captionUrl.length > 4000) throw new ImportError('Invalid video source.', 400);
      const prepared = await prepareRecipeVideo(input.videoUrl, input.captionUrl);
      return NextResponse.json(prepared);
    }
    if (input.action === 'transcribe') {
      if (typeof input.audioBase64 !== 'string' || input.audioBase64.length > 4900000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(input.audioBase64)) throw new ImportError('Invalid audio payload.', 400);
      const audio = Buffer.from(input.audioBase64, 'base64');
      if (audio.length > 3650000 || audio.toString('ascii', 0, 4) !== 'RIFF' || audio.toString('ascii', 8, 12) !== 'WAVE') throw new ImportError('Invalid WAV audio.', 400);
      return NextResponse.json({ transcript: await transcribeVideo(audio, 'audio/wav') });
    }
    if (input.action !== undefined && input.action !== 'extract') throw new ImportError('Invalid import action.', 400);
    const mode = input.mode;
    if (mode !== 'url' && mode !== 'text') throw new ImportError('Choose link or text import.', 400);
    if (typeof input.value !== 'string' || !input.value.trim()) throw new ImportError('Enter a link or paste the recipe text.', 400);
    const value = input.value.trim();
    if (value.length > (mode === 'url' ? 4000 : IMPORT_TEXT_LIMIT)) throw new ImportError('The import is too long. Paste only the recipe text.', 413);
    let sourceUrl = '';
    let text = value;
    let images: string[] = [];
    const warnings: string[] = [];
    if (input.action === 'extract' && input.images !== undefined) {
      if (!Array.isArray(input.images) || input.images.length > 12 || input.images.some(image => typeof image !== 'string' || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(image)) || JSON.stringify(input.images).length > 660000) throw new ImportError('Invalid video frame payload.', 400);
      images = input.images;
    }
    let rendered = false;
    if (mode === 'url') {
      const dynamicSource = needsBrowser(value);
      if (!dynamicSource) {
        const page = await fetchRecipePage(value);
        sourceUrl = page.url;
        const extracted = extractPage(page.html, sourceUrl);
        if (extracted.recipe) return NextResponse.json({ recipe: extracted.recipe, method: 'structured', warnings: reviewWarnings(extracted.recipe) });
        text = extracted.text;
      }
      if (dynamicSource || text.length < 80) {
        const page = await renderRecipeSource(value);
        rendered = true;
        sourceUrl = page.sourceUrl;
        const extracted = extractPage(page.html, sourceUrl);
        if (extracted.recipe && !page.isVideo) return NextResponse.json({ recipe: extracted.recipe, method: 'browser', warnings: reviewWarnings(extracted.recipe) });
        text = page.text;
        if (page.isVideo && input.includeVideo !== false) {
          return NextResponse.json({ next: 'video', sourceUrl, text, videoUrl: page.videoUrl, captionUrl: page.captionUrl });
        } else if (page.isVideo) {
          warnings.push('Video analysis was disabled. Only the post text was used; ingredients and steps from the video may be missing.');
        }
      }
      if (!images.length && text.length < 30) throw new ImportError('The page loaded, but no recipe answer or post content was found. Try sharing the completed answer or paste the text.');
    } else if (typeof input.sourceUrl === 'string' && input.sourceUrl.trim()) {
      sourceUrl = validateSourceUrl(input.sourceUrl.trim()).href;
    }
    const labelled = images.length ? null : parseRecipeText(text, sourceUrl);
    const recipe = labelled || await extractRecipeWithAI(text, sourceUrl, images);
    return NextResponse.json({ recipe, method: images.length ? 'video' : rendered ? 'browser' : labelled ? 'text' : 'ai', warnings: [...reviewWarnings(recipe), ...warnings] });
  } catch (error) {
    if (error instanceof ImportError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    // Never expose URLs, security tokens, page contents or API errors to logs / callers.
    return NextResponse.json({ error: 'Import could not complete. The site may require login or block access. Paste the recipe text or video transcript instead.' }, { status: 502 });
  }
}

function reviewWarnings(recipe: { ingredients: string[]; instructions: string[] }) {
  const warnings = ['Review quantities, temperatures and steps before saving. Missing information is left blank.'];
  if (!recipe.ingredients.length) warnings.push('No ingredients were found. Add them before saving.');
  if (!recipe.instructions.length) warnings.push('No instructions were found. Add them before saving.');
  return warnings;
}

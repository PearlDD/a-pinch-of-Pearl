import { emptyImportedRecipe, ImportError, validateImportedRecipe } from './recipeImport';
import { openAIImportError } from './recipeImportAPIError';
import { getRecipeAIConfig } from './recipeAIConfig';
import { extractRecipeWithGemini } from './recipeImportGemini';
import { recipeExtractionInstructions, recipeImportSchema } from './recipeImportPrompt';

export async function extractRecipeWithAI(text: string, sourceUrl: string, images: string[] = []) {
  const config = getRecipeAIConfig();
  if (config.provider === 'gemini') return extractRecipeWithGemini(config, text, sourceUrl, images);
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.key}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(45000),
    body: JSON.stringify({
      model: config.extractionModel,
      store: false,
      max_output_tokens: 6000,
      instructions: recipeExtractionInstructions,
      input: images.length ? [{ role: 'user', content: [
        { type: 'input_text', text },
        ...images.map(image_url => ({ type: 'input_image', image_url, detail: 'high' })),
      ] }] : text,
      text: { format: { type: 'json_schema', name: 'recipe_import', strict: true, schema: recipeImportSchema } },
    }),
  });
  if (!response.ok) throw await openAIImportError(response, 'The AI service is unavailable. Check its configuration or try again later.');
  const body = await response.json();
  if (body.status !== 'completed') throw new ImportError('The AI could not finish extracting this recipe. Try a shorter recipe text.');
  const output = (body.output || []).flatMap((item: { content?: { type: string; text?: string }[] }) => item.content || [])
    .filter((item: { type: string }) => item.type === 'output_text')
    .map((item: { text?: string }) => item.text || '').join('');
  let parsed: ReturnType<typeof emptyImportedRecipe>;
  try { parsed = JSON.parse(output); } catch { throw new ImportError('The AI returned an unreadable result. Please try again.', 502); }
  return validateImportedRecipe(parsed, sourceUrl);
}

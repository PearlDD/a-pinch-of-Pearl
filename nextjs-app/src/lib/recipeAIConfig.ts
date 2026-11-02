import { ImportError } from './recipeImport';

export type RecipeAIConfig = { provider: 'openai' | 'gemini'; key: string; extractionModel: string; transcriptionModel: string };

export function getRecipeAIConfig(): RecipeAIConfig {
  const googleKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const provider = process.env.RECIPE_AI_PROVIDER || (googleKey ? 'gemini' : 'openai');
  if (provider !== 'gemini' && provider !== 'openai') throw new ImportError('RECIPE_AI_PROVIDER must be gemini or openai.', 503, 'AI_NOT_CONFIGURED');
  const key = provider === 'gemini' ? googleKey : process.env.OPENAI_API_KEY;
  if (!key) throw new ImportError(`AI import is not configured for ${provider === 'gemini' ? 'Gemini' : 'OpenAI'}. Set the server-side ${provider === 'gemini' ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY'}, or paste a recipe with Ingredients and Instructions headings.`, 503, 'AI_NOT_CONFIGURED');
  return provider === 'gemini' ? {
    provider, key, extractionModel: process.env.GEMINI_RECIPE_MODEL || 'gemini-3.5-flash-lite',
    transcriptionModel: process.env.GEMINI_TRANSCRIPTION_MODEL || process.env.GEMINI_RECIPE_MODEL || 'gemini-3.5-flash-lite',
  } : {
    provider, key, extractionModel: process.env.RECIPE_IMPORT_MODEL || 'gpt-4o-mini',
    transcriptionModel: process.env.RECIPE_TRANSCRIPTION_MODEL || 'whisper-1',
  };
}

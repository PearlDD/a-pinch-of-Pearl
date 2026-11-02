import { ImportError } from './recipeImport';

export async function openAIImportError(response: Response, fallback: string): Promise<ImportError> {
  let error: { code?: string; type?: string } = {};
  try { error = (await response.json()).error || {}; } catch { /* Never show raw provider messages or credentials. */ }
  if (error.type === 'insufficient_quota' || ['credit_balance_exhausted', 'insufficient_quota', 'organization_spend_limit_exceeded', 'project_spend_limit_exceeded', 'organization_usage_limit_exceeded'].includes(error.code || '')) {
    return new ImportError('OpenAI API credits or usage quota are exhausted. The site owner needs to check the API project billing and limits before importing again.', 402, 'AI_QUOTA_EXHAUSTED');
  }
  if (response.status === 401 || response.status === 403) {
    return new ImportError('The OpenAI API key or its model permissions need to be checked by the site owner.', 503, 'AI_ACCESS_ERROR');
  }
  if (response.status === 429) return new ImportError('The OpenAI API is rate limited. Please wait and try again later.', 429, 'AI_RATE_LIMITED');
  return new ImportError(fallback, 502);
}

export async function geminiImportError(response: Response): Promise<ImportError> {
  let error: { status?: string; details?: { reason?: string }[] } = {};
  try { error = (await response.json()).error || {}; } catch { /* Do not expose raw Google errors or credentials. */ }
  if (response.status === 429 || error.status === 'RESOURCE_EXHAUSTED') return new ImportError('Gemini quota or rate limit reached. Check the Google AI Studio usage and limits before trying again.', 429, 'AI_RATE_LIMITED');
  if (response.status === 401 || response.status === 403 || error.details?.some(item => item.reason === 'API_KEY_INVALID')) return new ImportError('The Gemini API key or its permissions need to be checked by the site owner.', 503, 'AI_ACCESS_ERROR');
  if (response.status === 404) return new ImportError('The configured Gemini model is unavailable. Check GEMINI_RECIPE_MODEL and GEMINI_TRANSCRIPTION_MODEL.', 503, 'AI_NOT_CONFIGURED');
  return new ImportError('Gemini is unavailable or could not read this content. Please try again later.', 502);
}

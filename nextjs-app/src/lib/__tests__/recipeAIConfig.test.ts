/** @jest-environment node */
import { getRecipeAIConfig } from '../recipeAIConfig';

const keys = ['RECIPE_AI_PROVIDER', 'OPENAI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_RECIPE_MODEL', 'GEMINI_TRANSCRIPTION_MODEL', 'RECIPE_IMPORT_MODEL', 'RECIPE_TRANSCRIPTION_MODEL'] as const;
describe('recipe AI provider selection', () => {
  const original = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  beforeEach(() => { for (const key of keys) delete process.env[key]; });
  afterAll(() => { for (const key of keys) { if (original[key] === undefined) delete process.env[key]; else process.env[key] = original[key]; } });
  it('keeps OpenAI compatibility for an existing installation', () => {
    process.env.OPENAI_API_KEY = 'openai-test';
    expect(getRecipeAIConfig()).toEqual({ provider: 'openai', key: 'openai-test', extractionModel: 'gpt-4o-mini', transcriptionModel: 'whisper-1' });
  });
  it('uses Gemini for both tasks when explicitly selected, even if OpenAI is also configured', () => {
    process.env.RECIPE_AI_PROVIDER = 'gemini'; process.env.OPENAI_API_KEY = 'openai-test'; process.env.GEMINI_API_KEY = 'gemini-test';
    expect(getRecipeAIConfig()).toEqual({ provider: 'gemini', key: 'gemini-test', extractionModel: 'gemini-3.5-flash-lite', transcriptionModel: 'gemini-3.5-flash-lite' });
  });
  it('accepts the standard GOOGLE_API_KEY alias and per-provider model overrides', () => {
    process.env.GOOGLE_API_KEY = 'google-test'; process.env.GEMINI_RECIPE_MODEL = 'recipe-model'; process.env.GEMINI_TRANSCRIPTION_MODEL = 'audio-model';
    expect(getRecipeAIConfig()).toMatchObject({ provider: 'gemini', key: 'google-test', extractionModel: 'recipe-model', transcriptionModel: 'audio-model' });
  });
  it('does not silently switch providers when the selected key is missing', () => {
    process.env.RECIPE_AI_PROVIDER = 'gemini'; process.env.OPENAI_API_KEY = 'openai-test';
    expect(() => getRecipeAIConfig()).toThrow('GEMINI_API_KEY');
  });
  it('rejects unsupported providers', () => {
    process.env.RECIPE_AI_PROVIDER = 'unknown';
    expect(() => getRecipeAIConfig()).toThrow('gemini or openai');
  });
});

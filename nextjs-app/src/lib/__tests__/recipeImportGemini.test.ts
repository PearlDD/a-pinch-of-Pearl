/** @jest-environment node */
import { extractRecipeWithAI } from '../recipeImportAI';
import { transcribeVideo } from '../recipeImportVideo';

describe('Gemini recipe import', () => {
  const keys = ['RECIPE_AI_PROVIDER', 'GEMINI_API_KEY', 'GEMINI_RECIPE_MODEL', 'GEMINI_TRANSCRIPTION_MODEL'] as const;
  const original = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const originalFetch = global.fetch;
  const mockFetch = jest.fn();
  const reply = (value: unknown) => ({ ok: true, json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(value) }] } }] }) });
  beforeEach(() => {
    mockFetch.mockReset(); global.fetch = mockFetch;
    for (const key of keys) delete process.env[key];
    process.env.RECIPE_AI_PROVIDER = 'gemini'; process.env.GEMINI_API_KEY = 'gemini-test';
  });
  afterAll(() => {
    global.fetch = originalFetch;
    for (const key of keys) { if (original[key] === undefined) delete process.env[key]; else process.env[key] = original[key]; }
  });
  it('extracts a structured recipe with text and video images using only Google', async () => {
    mockFetch.mockResolvedValue(reply({ name: '汤', ingredients: ['胡萝卜'], instructions: ['煮熟'] }));
    const recipe = await extractRecipeWithAI('Recipe source', 'https://example.com', ['data:image/jpeg;base64,dGVzdA==']);
    expect(recipe).toMatchObject({ name: '汤', ingredients: ['胡萝卜'], calories: '', source_url: 'https://example.com' });
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
    expect(url).not.toContain('gemini-test');
    expect(options.headers['x-goog-api-key']).toBe('gemini-test');
    const body = JSON.parse(options.body);
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.generationConfig.responseJsonSchema.required).toContain('ingredients');
    expect(body.contents[0].parts).toContainEqual({ inlineData: { mimeType: 'image/jpeg', data: 'dGVzdA==' } });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
  it('transcribes the video WAV with Gemini rather than OpenAI Whisper', async () => {
    mockFetch.mockResolvedValue(reply({ text: 'Boil the pasta. 加入金枪鱼。' }));
    expect(await transcribeVideo(Buffer.from('wav'), 'audio/wav')).toBe('Boil the pasta. 加入金枪鱼。');
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(JSON.parse(options.body).contents[0].parts).toContainEqual({ inlineData: { mimeType: 'audio/wav', data: Buffer.from('wav').toString('base64') } });
  });
  it('reports Gemini quota limits without calling a different paid provider', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: { status: 'RESOURCE_EXHAUSTED' } }) });
    await expect(extractRecipeWithAI('Recipe', '')).rejects.toMatchObject({ code: 'AI_RATE_LIMITED' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
  it('identifies invalid Google keys without exposing the provider message', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: { message: 'private key detail', details: [{ reason: 'API_KEY_INVALID' }] } }) });
    await expect(extractRecipeWithAI('Recipe', '')).rejects.toMatchObject({ code: 'AI_ACCESS_ERROR' });
  });
  it('rejects incomplete or non-recipe output', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ candidates: [{ finishReason: 'MAX_TOKENS' }] }) });
    await expect(extractRecipeWithAI('Recipe', '')).rejects.toThrow('could not finish');
    mockFetch.mockResolvedValueOnce(reply({ name: 'Login page' }));
    await expect(extractRecipeWithAI('Recipe', '')).rejects.toThrow('No recipe');
  });
});

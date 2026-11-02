/** @jest-environment node */
import { extractRecipeWithAI } from '../recipeImportAI';

describe('AI recipe extraction', () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalProvider = process.env.RECIPE_AI_PROVIDER;
  const originalFetch = global.fetch;
  const mockFetch = jest.fn();
  beforeEach(() => { process.env.RECIPE_AI_PROVIDER = 'openai'; mockFetch.mockReset(); global.fetch = mockFetch; process.env.OPENAI_API_KEY = 'test-key'; });
  afterAll(() => {
    if (originalProvider === undefined) delete process.env.RECIPE_AI_PROVIDER;
    else process.env.RECIPE_AI_PROVIDER = originalProvider;
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  });
  it('fails clearly when no server key is configured', async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(extractRecipeWithAI('some text', '')).rejects.toThrow('not configured');
    expect(mockFetch).not.toHaveBeenCalled();
  });
  it('requests a strict schema without storing content and validates the result', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ name: 'Soup', ingredients: ['Carrots'], instructions: ['Boil.'] }) }] }] }) });
    const recipe = await extractRecipeWithAI('Unstructured recipe text', 'https://example.com');
    expect(recipe).toMatchObject({ name: 'Soup', ingredients: ['Carrots'], calories: '', source_url: 'https://example.com' });
    const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(payload.store).toBe(false);
    expect(payload.text.format.strict).toBe(true);
    expect(payload.text.format.schema.additionalProperties).toBe(false);
    expect(payload.input).toBe('Unstructured recipe text');
  });
  it('does not return partial, refused or non-recipe AI results', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'incomplete' }) });
    await expect(extractRecipeWithAI('text', '')).rejects.toThrow('could not finish');
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'completed', output: [{ content: [{ type: 'output_text', text: '{"name":"Login"}' }] }] }) });
    await expect(extractRecipeWithAI('text', '')).rejects.toThrow('No recipe');
  });
});

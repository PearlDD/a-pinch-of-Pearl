/** @jest-environment node */
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { supabase } from '@/lib/supabase';
import { fetchRecipePage } from '@/lib/recipeImportFetch';
import { extractRecipeWithAI } from '@/lib/recipeImportAI';
import { renderRecipeSource } from '@/lib/recipeImportBrowser';
import { prepareRecipeVideo, transcribeVideo } from '@/lib/recipeImportVideo';

jest.mock('@/lib/recipeImportFetch', () => ({
  ...jest.requireActual('@/lib/recipeImportFetch'),
  fetchRecipePage: jest.fn(),
}));
jest.mock('@/lib/recipeImportAI', () => ({ extractRecipeWithAI: jest.fn() }));
jest.mock('@/lib/recipeImportBrowser', () => ({ needsBrowser: (value: string) => /rednote\.com|chatgpt\.com/.test(value), renderRecipeSource: jest.fn() }));
jest.mock('@/lib/recipeImportVideo', () => ({ prepareRecipeVideo: jest.fn(), transcribeVideo: jest.fn() }));

const getUser = jest.fn();
const fetchPage = fetchRecipePage as jest.Mock;
const ai = extractRecipeWithAI as jest.Mock;
function request(body: unknown, token = 'admin-token') {
  return new NextRequest('http://localhost/api/recipes/import', {
    method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: JSON.stringify(body),
  });
}

describe('recipe import endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_ADMIN_UID = 'admin';
    supabase.auth.getUser = getUser;
    getUser.mockResolvedValue({ data: { user: { id: 'admin' } }, error: null });
  });
  it('rejects anonymous requests before fetching URLs or calling AI', async () => {
    const response = await POST(request({ mode: 'url', value: 'https://example.com' }, ''));
    expect(response.status).toBe(401);
    expect(fetchPage).not.toHaveBeenCalled();
    expect(ai).not.toHaveBeenCalled();
  });
  it('rejects a valid session belonging to another user', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'other' } }, error: null });
    expect((await POST(request({ mode: 'url', value: 'https://example.com' }))).status).toBe(403);
    expect(fetchPage).not.toHaveBeenCalled();
  });
  it('rejects expired tokens and missing admin configuration', async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('expired') });
    expect((await POST(request({ mode: 'text', value: 'Soup' }))).status).toBe(401);
    delete process.env.NEXT_PUBLIC_ADMIN_UID;
    expect((await POST(request({ mode: 'text', value: 'Soup' }))).status).toBe(403);
  });
  it('imports structured recipes without using AI or writing to the database', async () => {
    fetchPage.mockResolvedValue({ url: 'https://example.com/soup', html: '<script type="application/ld+json">{"@type":"Recipe","name":"Soup","recipeIngredient":["Carrots"],"recipeInstructions":["Boil."]}</script>' });
    const response = await POST(request({ mode: 'url', value: 'https://example.com/soup' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ method: 'structured', recipe: { name: 'Soup', source_url: 'https://example.com/soup' } });
    expect(ai).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });
  it('imports pasted Chinese text and preserves its optional original source', async () => {
    const response = await POST(request({ mode: 'text', value: '番茄汤\n食材\n番茄\n步骤\n煮熟', sourceUrl: 'https://example.com/post' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ method: 'text', recipe: { name: '番茄汤', ingredients: ['番茄'], source_url: 'https://example.com/post' } });
    expect(fetchPage).not.toHaveBeenCalled();
  });
  it('validates input lengths and modes before any external call', async () => {
    expect((await POST(request({ mode: 'video', value: 'test' }))).status).toBe(400);
    expect((await POST(request({ mode: 'text', value: 'x'.repeat(40001) }))).status).toBe(413);
    expect(fetchPage).not.toHaveBeenCalled();
    expect(ai).not.toHaveBeenCalled();
  });
  it('splits browser, media preparation and extraction into independently authenticated requests', async () => {
    (renderRecipeSource as jest.Mock).mockResolvedValue({ sourceUrl: 'https://www.rednote.com/discovery/item/test', html: '<html></html>', text: 'Tuna pasta', isVideo: true, videoUrl: 'https://cdn.example.com/video.mp4', captionUrl: '' });
    (prepareRecipeVideo as jest.Mock).mockResolvedValue({ transcript: 'Cook the pasta, then mix with tuna.', images: ['data:image/jpeg;base64,dGVzdA=='], audioBase64: '', warnings: ['Check sampled video content.'] });
    ai.mockResolvedValue({ name: 'Tuna pasta', ingredients: ['Pasta', 'Tuna'], instructions: ['Cook the pasta.'], tips: [] });
    const response = await POST(request({ mode: 'url', value: 'https://www.rednote.com/discovery/item/test' }));
    expect(response.status).toBe(200);
    expect(fetchPage).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({ next: 'video', text: 'Tuna pasta', videoUrl: 'https://cdn.example.com/video.mp4' });
    expect(prepareRecipeVideo).not.toHaveBeenCalled();
    const prepared = await POST(request({ action: 'prepare-video', videoUrl: 'https://cdn.example.com/video.mp4', captionUrl: '' }));
    expect(prepared.status).toBe(200);
    expect(prepareRecipeVideo).toHaveBeenCalledWith('https://cdn.example.com/video.mp4', '');
    const extracted = await POST(request({ action: 'extract', mode: 'text', value: 'Cook the pasta, then mix with tuna.', sourceUrl: 'https://www.rednote.com/discovery/item/test', images: ['data:image/jpeg;base64,dGVzdA=='] }));
    expect(ai).toHaveBeenCalledWith('Cook the pasta, then mix with tuna.', 'https://www.rednote.com/discovery/item/test', ['data:image/jpeg;base64,dGVzdA==']);
    expect(await extracted.json()).toMatchObject({ method: 'video', recipe: { name: 'Tuna pasta' } });
  });
  it('does not analyze video when the user disables it', async () => {
    (renderRecipeSource as jest.Mock).mockResolvedValue({ sourceUrl: 'https://rednote.com/discovery/item/test', html: '', text: 'Soup\nIngredients\nCarrots\nInstructions\nBoil.', isVideo: true, videoUrl: 'https://cdn.example.com/video.mp4', captionUrl: '' });
    const response = await POST(request({ mode: 'url', value: 'https://rednote.com/discovery/item/test', includeVideo: false }));
    expect(response.status).toBe(200);
    expect(prepareRecipeVideo).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({ warnings: expect.arrayContaining([expect.stringContaining('Video analysis was disabled')]) });
  });
  it('does not infer a recipe when a rendered shared chat has no assistant answer', async () => {
    (renderRecipeSource as jest.Mock).mockResolvedValue({ sourceUrl: 'https://chatgpt.com/share/test', html: '', text: '', isVideo: false });
    const response = await POST(request({ mode: 'url', value: 'https://chatgpt.com/share/test' }));
    expect(response.status).toBe(422);
    expect(ai).not.toHaveBeenCalled();
  });
  it('authenticates every video phase and rejects malformed audio / images', async () => {
    expect((await POST(request({ action: 'prepare-video', videoUrl: 'https://cdn.example.com/video.mp4', captionUrl: '' }, ''))).status).toBe(401);
    expect((await POST(request({ action: 'transcribe', audioBase64: 'not a wav' }))).status).toBe(400);
    expect((await POST(request({ action: 'extract', mode: 'text', value: 'Recipe', images: ['https://example.com/image.jpg'] }))).status).toBe(400);
    expect(transcribeVideo).not.toHaveBeenCalled();
  });
});

/** @jest-environment node */
import RecipeDetailPage, { generateMetadata } from '../[id]/page';

jest.mock('@/lib/logger', () => ({ __esModule: true, default: { info: jest.fn() } }));

it('renders the current saved nutrition and metadata on the next public request after an edit', async () => {
  const originalFetch = global.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://preview.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'preview-anon';
  const old = { id: 'recipe-1', name: 'Before edit', description: 'Before', category: 'Main Dish', photo_url: '', calories: '~659 kcal', protein: '81g', carbs: '45g', fat: '17g', fiber: '11g' };
  let saved = old;
  global.fetch = jest.fn(async (_input, init) => new Response(JSON.stringify(init?.cache === 'no-store' ? saved : old), { status: 200, headers: { 'Content-Type': 'application/json' } })) as typeof fetch;
  try {
    const before = await RecipeDetailPage({ params: { id: 'recipe-1' } });
    expect(before.props.recipe).toMatchObject(old);
    saved = { ...old, name: 'After edit', description: 'After', calories: '~308 kcal', protein: '18.5g', carbs: '49.7g', fat: '3.9g', fiber: '4.2g' };
    const after = await RecipeDetailPage({ params: { id: 'recipe-1' } });
    expect(after.props.recipe).toMatchObject(saved);
    const metadata = await generateMetadata({ params: { id: 'recipe-1' } });
    expect(metadata.title).toBe('After edit — A Pinch of Pearl');
    expect(metadata.description).toBe('After');
  } finally {
    global.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
  }
});

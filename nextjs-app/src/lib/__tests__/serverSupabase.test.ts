/** @jest-environment node */
import { createServerSupabase } from '../serverSupabase';

const originalFetch = global.fetch;
const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
afterEach(() => {
  global.fetch = originalFetch;
  if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
});

it('reads saved nutrition afresh on repeated public queries instead of returning a cached old record', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://preview.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'preview-anon';
  let stored = { id: 'recipe-1', calories: '~659 kcal', protein: '81g' };
  const cached = { ...stored };
  const fetchMock = jest.fn(async (_input: unknown, init?: RequestInit) => new Response(JSON.stringify(init?.cache === 'no-store' ? stored : cached), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  global.fetch = fetchMock as typeof fetch;
  const client = createServerSupabase();
  const before = await client.from('recipes').select('*').eq('id', 'recipe-1').single();
  expect(before.data).toMatchObject(cached);
  stored = { ...stored, calories: '~308 kcal', protein: '18.5g' };
  const after = await createServerSupabase().from('recipes').select('*').eq('id', 'recipe-1').single();
  expect(after.error).toBeNull();
  expect(after.data).toMatchObject(stored);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  for (const [, init] of fetchMock.mock.calls) expect(init?.cache).toBe('no-store');
});

it('does not turn a failed fresh read into an old success', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://preview.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'preview-anon';
  global.fetch = jest.fn(async () => new Response(JSON.stringify({ message: 'Read failed' }), { status: 503 })) as typeof fetch;
  const result = await createServerSupabase().from('recipes').select('*').eq('id', 'recipe-1').single();
  expect(result.data).toBeNull();
  expect(result.error).not.toBeNull();
});

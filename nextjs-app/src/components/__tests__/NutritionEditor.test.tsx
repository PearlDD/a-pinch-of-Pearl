import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddRecipePage from '@/app/admin/recipes/new/page';
import EditRecipePage from '@/app/admin/recipes/[id]/edit/page';
import { mockSupabase } from '@/__tests__/mocks/supabase';
import { useAuth } from '@/hooks/useAuth';

jest.mock('@/hooks/useAuth', () => {
  const user = { id: 'admin' };
  return { useAuth: jest.fn(() => ({ user, loading: false })) };
});
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'recipe-1' }),
  useRouter: () => ({ push: jest.fn() }),
}));

describe.each([['new', AddRecipePage], ['edit', EditRecipePage]] as const)('%s recipe nutrition', (mode, Page) => {
  let query: ReturnType<typeof mockSupabase.from>;
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'admin' }, loading: false });
    query = { ...mockSupabase.from(),
      single: jest.fn().mockResolvedValue({ data: { name: 'Test recipe', category: 'Main Dish', ingredients: '100g flour', servings: '1' }, error: null }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockReturnThis(),
    };
    mockSupabase.from.mockReturnValue(query);
  });
  async function seed() {
    const user = userEvent.setup(); render(<Page />);
    await screen.findByRole('button', { name: 'Auto-calculate Nutrition' });
    await user.click(screen.getByRole('checkbox', { name: /Estimate unclear amounts/ }));
    if (mode === 'new') await user.type(screen.getByRole('textbox', { name: 'New ingredient' }), '100g flour{Enter}');
    await user.clear(screen.getByLabelText('Servings'));
    await user.type(screen.getByLabelText('Servings'), '1');
    return user;
  }
  async function calculate(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'Auto-calculate Nutrition' }));
  }
  it('calculates the latest visible edit after blur and replaces all values', async () => {
    const user = await seed(); await calculate(user);
    expect(screen.getByLabelText('Calories')).toHaveValue('~364 kcal');
    expect(screen.getByLabelText('Protein')).toHaveValue('10.3g');
    await user.click(screen.getByText('100g flour', { selector: 'span[title="Click to edit"]' }));
    await user.clear(screen.getByLabelText('Edit ingredient 1'));
    await user.type(screen.getByLabelText('Edit ingredient 1'), '200g flour');
    expect(screen.getByText(/Ingredients or servings changed/)).toBeVisible();
    await calculate(user);
    expect(screen.getByLabelText('Calories')).toHaveValue('~728 kcal');
    expect(screen.getByLabelText('Protein')).toHaveValue('20.6g');
    expect(screen.getByLabelText('Carbohydrates')).toHaveValue('152.6g');
    expect(screen.getByLabelText('Fat')).toHaveValue('2g');
    expect(screen.getByLabelText('Fiber')).toHaveValue('5.4g');
    expect(screen.queryByText(/Ingredients or servings changed/)).not.toBeInTheDocument();
  });
  it('reads an uncommitted edit even when the click does not dispatch blur first', async () => {
    await seed();
    fireEvent.click(screen.getByText('100g flour', { selector: 'span[title="Click to edit"]' }));
    fireEvent.change(screen.getByLabelText('Edit ingredient 1'), { target: { value: '200g flour' } });
    fireEvent.click(screen.getByRole('button', { name: 'Auto-calculate Nutrition' }));
    expect(screen.getByLabelText('Calories')).toHaveValue('~728 kcal');
    expect(screen.getByText('200g flour', { selector: 'span[title="Click to edit"]' })).toBeVisible();
  });
  it('includes a pending addition, then refreshes after reordering, removing and repeated clicks', async () => {
    const user = await seed(); await calculate(user);
    await user.type(screen.getByRole('textbox', { name: 'New ingredient' }), '100g honey');
    await calculate(user);
    expect(screen.getByLabelText('Calories')).toHaveValue('~668 kcal');
    expect(screen.getByText(/2\/2 foods identified/)).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'New ingredient' })).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Move ingredient 2 up' }));
    await calculate(user);
    expect(screen.getByLabelText('Calories')).toHaveValue('~668 kcal');
    await user.click(screen.getByRole('button', { name: 'Remove ingredient 2' }));
    await calculate(user);
    expect(screen.getByLabelText('Calories')).toHaveValue('~304 kcal');
    expect(screen.getByText(/1\/1 foods identified/)).toBeVisible();
    await calculate(user);
    expect(screen.getByLabelText('Calories')).toHaveValue('~304 kcal');
  });
  it('preserves an in-progress edit while moving its row', async () => {
    const user = await seed();
    await user.type(screen.getByRole('textbox', { name: 'New ingredient' }), '100g honey{Enter}');
    await user.click(screen.getByText('100g honey', { selector: 'span[title="Click to edit"]' }));
    await user.clear(screen.getByLabelText('Edit ingredient 2'));
    await user.type(screen.getByLabelText('Edit ingredient 2'), '200g honey');
    await user.click(screen.getByRole('button', { name: 'Move ingredient 2 up' }));
    expect(screen.getByLabelText('Edit ingredient 1')).toHaveValue('200g honey');
    await calculate(user);
    expect(screen.getByLabelText('Calories')).toHaveValue('~972 kcal');
  });
  it('separates food matching from unresolved quantities and clears stale values on failure', async () => {
    const user = await seed(); await calculate(user);
    await user.click(screen.getByText('100g flour', { selector: 'span[title="Click to edit"]' }));
    await user.clear(screen.getByLabelText('Edit ingredient 1'));
    await user.type(screen.getByLabelText('Edit ingredient 1'), '¼ can tuna');
    await calculate(user);
    for (const name of ['Calories', 'Protein', 'Carbohydrates', 'Fat', 'Fiber']) expect(screen.getByLabelText(name)).toHaveValue('');
    expect(screen.getByRole('alert')).toHaveTextContent('Previous values have been cleared');
    expect(screen.getByText(/1\/1 foods identified/)).toHaveTextContent('0/1 amounts resolved');
    expect(screen.getByText(/Package sizes vary/)).toBeVisible();
    await user.click(screen.getByText('¼ can tuna', { selector: 'span[title="Click to edit"]' }));
    await user.clear(screen.getByLabelText('Edit ingredient 1'));
    await user.type(screen.getByLabelText('Edit ingredient 1'), '¼ can (113g drained) tuna');
    await calculate(user);
    expect(screen.getByLabelText('Protein')).toHaveValue('7.2g');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('updates fractional servings and shows invalid servings as an error instead of keeping old numbers', async () => {
    const user = await seed(); await calculate(user);
    await user.clear(screen.getByLabelText('Servings'));
    await user.type(screen.getByLabelText('Servings'), '0.5');
    await calculate(user);
    expect(screen.getByLabelText('Calories')).toHaveValue('~728 kcal');
    await user.clear(screen.getByLabelText('Servings'));
    await user.type(screen.getByLabelText('Servings'), '2-4');
    await calculate(user);
    expect(screen.getByRole('alert')).toHaveTextContent('positive serving count');
    expect(screen.getByLabelText('Calories')).toHaveValue('');
  });
  it('allows recalculation after removing everything and includes the first pending item', async () => {
    const user = await seed(); await calculate(user);
    await user.click(screen.getByRole('button', { name: 'Remove ingredient 1' }));
    await calculate(user);
    expect(screen.getByRole('alert')).toHaveTextContent('Add at least one ingredient');
    expect(screen.getByLabelText('Calories')).toHaveValue('');
    await user.type(screen.getByRole('textbox', { name: 'New ingredient' }), '100g flour');
    await calculate(user);
    expect(screen.getByLabelText('Calories')).toHaveValue('~364 kcal');
  });
  it('preserves Escape cancellation and saves the current list including pending additions', async () => {
    const user = await seed();
    await user.click(screen.getByText('100g flour', { selector: 'span[title="Click to edit"]' }));
    await user.clear(screen.getByLabelText('Edit ingredient 1'));
    await user.type(screen.getByLabelText('Edit ingredient 1'), '900g flour{Escape}');
    await calculate(user);
    expect(screen.getByLabelText('Calories')).toHaveValue('~364 kcal');
    await user.type(screen.getByRole('textbox', { name: 'New ingredient' }), '100g honey');
    if (mode === 'new') await user.type(screen.getByPlaceholderText("e.g. Grandma's Chicken Soup"), 'Test recipe');
    await user.click(screen.getByRole('button', { name: /Save Recipe|Update Recipe/ }));
    await waitFor(() => expect(mode === 'new' ? query.insert : query.update).toHaveBeenCalledWith(expect.objectContaining({ ingredients: '100g flour\n100g honey' })));
  });
});

it('does not reload stale saved ingredients when the same admin session refreshes', async () => {
  const query = { ...mockSupabase.from(), single: jest.fn().mockResolvedValue({ data: { name: 'Saved recipe', category: 'Main Dish', ingredients: '100g flour', servings: '1' }, error: null }) };
  mockSupabase.from.mockReturnValue(query);
  (useAuth as jest.Mock).mockReturnValue({ user: { id: 'admin' }, loading: false });
  const user = userEvent.setup();
  const { rerender } = render(<EditRecipePage />);
  await screen.findByText('100g flour', { selector: 'span[title="Click to edit"]' });
  await user.click(screen.getByText('100g flour', { selector: 'span[title="Click to edit"]' }));
  await user.clear(screen.getByLabelText('Edit ingredient 1'));
  await user.type(screen.getByLabelText('Edit ingredient 1'), '200g flour');
  (useAuth as jest.Mock).mockReturnValue({ user: { id: 'admin', refreshed: true }, loading: false });
  rerender(<EditRecipePage />);
  await user.click(screen.getByRole('button', { name: 'Auto-calculate Nutrition' }));
  expect(query.single).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Calories')).toHaveValue('~728 kcal');
});

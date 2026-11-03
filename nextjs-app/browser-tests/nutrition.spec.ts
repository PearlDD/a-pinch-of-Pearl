import soup from '../src/lib/__tests__/fixtures/lemonOrzoSoup.json';
import recipes from '../src/lib/__tests__/fixtures/publishedRecipes.json';
import { test, expect } from '@playwright/test';

// A real layout is essential: textarea blur can move the calculation button
// between pointer-down and pointer-up. JSDOM alone cannot catch that regression.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const expires_at = Math.floor(Date.now() / 1000) + 3600;
    const access_token = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) + '.' + btoa(JSON.stringify({ sub: 'preview-admin', exp: expires_at })) + '.preview';
    localStorage.setItem('sb-preview-auth-token', JSON.stringify({
      access_token, refresh_token: 'preview', expires_at, expires_in: 3600, token_type: 'bearer',
      user: { id: 'preview-admin', email: 'preview@example.com', aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
    }));
  });
  await page.route('https://preview.supabase.co/**', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: route.request().url().includes('/rest/v1/recipes') ? JSON.stringify({ id: 'recipe-1', name: 'Test recipe', category: 'Main Dish', servings: '1', ingredients: '100g flour', calories: '999 kcal', protein: '999g' }) : '[]',
  }));
});

for (const mode of ['new', 'edit']) {
  test(`${mode}: native clicks calculate the visible draft and refresh the entire list`, async ({ page, isMobile }) => {
    await page.goto(mode === 'new' ? '/admin/recipes/new' : '/admin/recipes/recipe-1/edit');
    const button = page.getByRole('button', { name: 'Auto-calculate Nutrition' });
    const calculate = () => isMobile ? button.tap() : button.click();
    const calories = page.getByLabel('Calories', { exact: true });
    const pending = page.getByRole('textbox', { name: 'New ingredient', exact: true });
    const row = (text: string) => page.locator('span[title="Click to edit"]').filter({ hasText: text });
    await expect(button).toBeVisible();
    await page.getByRole('checkbox', { name: /Estimate unclear amounts/ }).uncheck();
    await page.getByLabel('Servings', { exact: true }).fill('1');
    if (mode === 'new') { await pending.fill('100g flour'); await pending.press('Enter'); }
    await calculate();
    await expect(calories).toHaveValue('~364 kcal');

    await row('100g flour').click();
    await page.getByLabel('Edit ingredient 1', { exact: true }).fill('200g flour');
    await calculate(); // deliberately no Enter or blur before this native click
    await expect(calories).toHaveValue('~728 kcal');
    await expect(page.getByText(/Ingredients or servings changed/)).toHaveCount(0);
    await pending.fill('100g honey');
    await calculate();
    await expect(calories).toHaveValue('~1032 kcal');
    await expect(page.getByText(/2\/2 foods identified/)).toBeVisible();
    await page.getByRole('button', { name: 'Move ingredient 2 up', exact: true }).click();
    await calculate();
    await expect(calories).toHaveValue('~1032 kcal');
    await page.getByRole('button', { name: 'Remove ingredient 1', exact: true }).click();
    await calculate();
    await expect(calories).toHaveValue('~728 kcal');
    await calculate();
    await expect(calories).toHaveValue('~728 kcal');

    await row('200g flour').click();
    await page.getByLabel('Edit ingredient 1', { exact: true }).fill('¼ can tuna');
    await calculate();
    await expect(page.locator('p[role="alert"]')).toContainText('Existing nutrition values were kept');
    await expect(calories).toHaveValue('~728 kcal');
    await expect(page.getByText(/1\/1 foods identified/)).toContainText('0/1 amounts resolved');
  });
}


test('default estimates handle the exact published tuna recipe and strict mode can be restored', async ({ page, isMobile }) => {
  const recipe = recipes.find(item => item.name === 'Spaghetti with Tuna')!;
  await page.goto('/admin/recipes/new');
  const button = page.getByRole('button', { name: 'Auto-calculate Nutrition' });
  const calculate = () => isMobile ? button.tap() : button.click();
  const policy = page.getByRole('checkbox', { name: /Estimate unclear amounts/ });
  await expect(policy).toBeChecked();
  await page.getByLabel('Servings', { exact: true }).fill('1');
  const pending = page.getByRole('textbox', { name: 'New ingredient', exact: true });
  for (const line of recipe.ingredients.split('\n')) { await pending.fill(line); await pending.press('Enter'); }
  await calculate();
  await expect(page.getByText(/9\/9 foods identified/)).toContainText('9 estimated');
  const protein = page.getByLabel('Protein', { exact: true });
  const original = await protein.inputValue();
  expect(parseFloat(original)).toBeGreaterThan(0);
  expect(parseFloat(original)).toBeLessThan(30);
  await page.getByText('Review ingredient amounts and assumptions', { exact: true }).click();
  await expect(page.getByText(/Standard portion estimate: 55 g/)).toBeVisible();
  await expect(page.getByText(/Package estimate: assuming 113 g/)).toBeVisible();
  await policy.uncheck(); await calculate();
  await expect(protein).toHaveValue(original);
  await expect(page.locator('p[role="alert"]')).toContainText('have not been updated');
  await policy.check(); await calculate();
  await expect(protein).toHaveValue(original);
  await page.locator('span[title="Click to edit"]').filter({ hasText: '1 portion of spaghetti' }).click();
  await page.getByLabel('Edit ingredient 1', { exact: true }).fill('110g dry spaghetti');
  await calculate();
  expect(parseFloat(await protein.inputValue())).toBeGreaterThan(parseFloat(original));
});


test('the screenshot soup calculates all 14 rows and refreshes estimates per serving', async ({ page, isMobile }) => {
  await page.goto('/admin/recipes/new');
  const button = page.getByRole('button', { name: 'Auto-calculate Nutrition' });
  const calculate = () => isMobile ? button.tap() : button.click();
  await expect(button).toBeVisible();
  await page.getByLabel('Servings', { exact: true }).fill('6');
  const pending = page.getByRole('textbox', { name: 'New ingredient', exact: true });
  for (const line of soup.ingredients) { await pending.fill(line); await pending.press('Enter'); }
  await calculate();
  await expect(page.getByText(/14\/14 foods identified/)).toContainText('14/14 amounts resolved');
  await expect(page.locator('p[role="alert"]')).toHaveCount(0);
  for (const name of ['Calories', 'Carbohydrates', 'Protein', 'Fat', 'Fiber']) await expect(page.getByLabel(name, { exact: true })).not.toHaveValue('');
  const carbs = page.getByLabel('Carbohydrates', { exact: true });
  const original = parseFloat(await carbs.inputValue());
  await page.locator('span[title="Click to edit"]').filter({ hasText: '1.5 cup uncooked orzo' }).click();
  await page.getByLabel('Edit ingredient 11', { exact: true }).fill('2 cups uncooked orzo');
  await calculate();
  const changed = parseFloat(await carbs.inputValue()); expect(changed).toBeGreaterThan(original);
  await page.getByLabel('Servings', { exact: true }).fill('3'); await calculate();
  expect(Math.abs(parseFloat(await carbs.inputValue()) - changed * 2)).toBeLessThan(0.2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

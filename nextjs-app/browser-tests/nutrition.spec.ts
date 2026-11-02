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
    await expect(page.locator('p[role="alert"]')).toContainText('Previous values have been cleared');
    await expect(calories).toHaveValue('');
    await expect(page.getByText(/1\/1 foods identified/)).toContainText('0/1 amounts resolved');
  });
}

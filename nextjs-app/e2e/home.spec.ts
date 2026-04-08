import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('loads and displays the header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'A Pinch of Pearl' })).toBeVisible();
  });

  test('displays the footer', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });
});

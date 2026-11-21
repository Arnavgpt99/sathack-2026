import { test, expect } from '@playwright/test';

test('home page renders without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  expect(errors).toEqual([]);
});

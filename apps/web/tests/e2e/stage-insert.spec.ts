import { test, expect } from '@playwright/test';

test('clicking $limit inserts stage into Monaco editor', async ({ page }) => {
  const base = process.env.WEB_BASE_URL || 'http://localhost:5173';
  await page.goto(`${base}/builder`);

  // Click the $limit stage button (it renders the button text exactly "$limit")
  await page.getByRole('button', { name: '$limit' }).click();

  // Monaco renders lines in .view-lines span[role="presentation"] divs. Assert stage appears.
  // We search for the token "$limit" somewhere in the editor content area.
  const editorLocator = page.locator('.monaco-editor');
  await expect(editorLocator).toBeVisible();

  // Look for limit token inside the editor DOM (monaco paints text in .view-lines)
  const containsLimit = await page.locator('.monaco-editor .view-lines').filter({ hasText: '"$limit"' }).count();
  expect(containsLimit).toBeGreaterThan(0);
});



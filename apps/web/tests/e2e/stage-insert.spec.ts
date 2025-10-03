import { expect, test } from '@playwright/test';

const base = process.env.WEB_BASE_URL || 'http://localhost:5173';

const allStages = [
  '$match',
  '$project', 
  '$group',
  '$sort',
  '$limit',
  '$skip',
  '$lookup',
  '$unwind',
  '$addFields',
  '$replaceRoot'
];

test.describe('Pipeline stage insertion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${base}/builder`);
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for Monaco editor to be ready
    await expect(page.locator('.monaco-editor')).toBeVisible();
    
    // Wait a bit more for Svelte component to be fully hydrated
    await page.waitForTimeout(1000);
  });

  test('clicking $limit inserts stage into Monaco editor', async ({ page }) => {
    // Click the $limit stage button
    await page.getByRole('button', { name: '$limit' }).click();

    // Wait for the editor content to update
    await page.waitForTimeout(1000);

    // Look for limit token inside the editor DOM
    const containsLimit = await page.locator('.monaco-editor .view-lines').filter({ hasText: '"$limit"' }).count();
    expect(containsLimit).toBeGreaterThan(0);
  });

  test('all stage buttons are visible', async ({ page }) => {
    // Check that all stage buttons are visible
    for (const stage of allStages) {
      const button = page.getByRole('button', { name: stage });
      await expect(button).toBeVisible();
    }
  });

  test('multiple stage insertions work in sequence', async ({ page }) => {
    const stagesToTest = ['$match', '$project', '$group'];
    
    for (const stage of stagesToTest) {
      // Click the stage button
      await page.getByRole('button', { name: stage }).click();
      
      // Wait for the editor content to update
      await page.waitForTimeout(500);
      
      // Check that the stage was inserted
      const containsStage = await page.locator('.monaco-editor .view-lines').filter({ hasText: `"${stage}"` }).count();
      expect(containsStage).toBeGreaterThan(0);
    }
  });
});



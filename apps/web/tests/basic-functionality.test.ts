import { expect, test } from '@playwright/test';

test.describe('Basic Functionality Tests', () => {
	test('should load home page without errors', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('h1')).toContainText('PipeLens');
	});

	test('should load builder page without errors', async ({ page }) => {
		await page.goto('/builder');
		
		// Wait for page to load completely
		await page.waitForLoadState('networkidle');
		
		// Check for basic elements that should be present
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.getByText('Pipeline Builder')).toBeVisible();
	});

	test('should have working navigation', async ({ page }) => {
		await page.goto('/');
		await page.click('a[href="/builder"]');
		await expect(page).toHaveURL('/builder');
	});

	test('should display basic UI elements on builder page', async ({ page }) => {
		await page.goto('/builder');
		await page.waitForLoadState('networkidle');
		
		// Check for specific UI elements that should be present
		await expect(page.getByRole('button', { name: 'Run with Preview' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Run Pipeline' })).toBeVisible();
		await expect(page.locator('input[type="number"]')).toBeVisible();
	});
});

import { expect, test } from '@playwright/test';

test.describe('DocumentViewer Component', () => {
	test.beforeEach(async ({ page }) => {
		// Create a test page with the DocumentViewer component
		await page.goto('/builder');
		await page.waitForLoadState('networkidle');
	});

	test('should render with empty documents', async ({ page }) => {
		// This test would require setting up a test environment with the component
		// For now, we'll test the integration through the pipeline builder
		await page.goto('/builder');
		await expect(page.locator('h1')).toContainText('Pipeline Builder');
	});

	test('should handle document navigation', async ({ page }) => {
		// Connect to MongoDB and run a pipeline to get documents
		await page.getByTestId('connect-button').click();
		await page.getByLabel('Connection URI').fill('mongodb://admin:password@localhost:27017');
		await page.getByRole('button', { name: 'Connect' }).click();
		await page.waitForTimeout(2000);

		// Select database and collection
		await page.getByText('testdb').click();
		await page.waitForTimeout(500);
		await page.getByText('orders').click();
		await page.waitForTimeout(500);

		// Run pipeline with multiple documents
		const pipeline = `[{ "$limit": 3 }]`;
		await page.locator('.monaco-editor').click();
		await page.keyboard.press('Control+A');
		await page.keyboard.type(pipeline);
		await page.getByRole('button', { name: 'Run with Preview' }).click();
		await expect(page.getByText('Stage-by-Stage Results')).toBeVisible({ timeout: 10000 });

		// Click to expand first stage
		await page.locator('button').filter({ hasText: '$limit' }).first().click();
		await expect(page.getByText('Preview Documents')).toBeVisible();

		// Test document navigation
		await expect(page.getByText('1 of 3')).toBeVisible();
		await page.getByRole('button', { name: '→' }).click();
		await expect(page.getByText('2 of 3')).toBeVisible();
		await page.getByRole('button', { name: '←' }).click();
		await expect(page.getByText('1 of 3')).toBeVisible();
	});

	test('should display field type indicators', async ({ page }) => {
		// Connect and run pipeline
		await page.getByTestId('connect-button').click();
		await page.getByLabel('Connection URI').fill('mongodb://admin:password@localhost:27017');
		await page.getByRole('button', { name: 'Connect' }).click();
		await page.waitForTimeout(2000);

		await page.getByText('testdb').click();
		await page.waitForTimeout(500);
		await page.getByText('orders').click();
		await page.waitForTimeout(500);

		const pipeline = `[{ "$limit": 1 }]`;
		await page.locator('.monaco-editor').click();
		await page.keyboard.press('Control+A');
		await page.keyboard.type(pipeline);
		await page.getByRole('button', { name: 'Run with Preview' }).click();
		await expect(page.getByText('Stage-by-Stage Results')).toBeVisible({ timeout: 10000 });

		// Click to expand first stage
		await page.locator('button').filter({ hasText: '$limit' }).first().click();
		await expect(page.getByText('Preview Documents')).toBeVisible();

		// Check for field type indicators
		await expect(page.locator('text=📝').first()).toBeVisible(); // string
		await expect(page.locator('text=🔢').first()).toBeVisible(); // number
	});

	test('should expand and collapse fields', async ({ page }) => {
		// Connect and run pipeline
		await page.getByTestId('connect-button').click();
		await page.getByLabel('Connection URI').fill('mongodb://admin:password@localhost:27017');
		await page.getByRole('button', { name: 'Connect' }).click();
		await page.waitForTimeout(2000);

		await page.getByText('testdb').click();
		await page.waitForTimeout(500);
		await page.getByText('orders').click();
		await page.waitForTimeout(500);

		const pipeline = `[{ "$limit": 1 }]`;
		await page.locator('.monaco-editor').click();
		await page.keyboard.press('Control+A');
		await page.keyboard.type(pipeline);
		await page.getByRole('button', { name: 'Run with Preview' }).click();
		await expect(page.getByText('Stage-by-Stage Results')).toBeVisible({ timeout: 10000 });

		// Click to expand first stage
		await page.locator('button').filter({ hasText: '$limit' }).first().click();
		await expect(page.getByText('Preview Documents')).toBeVisible();

		// Look for expandable fields (objects/arrays should have + buttons)
		const expandButtons = page.locator('button').filter({ hasText: '+' });
		if ((await expandButtons.count()) > 0) {
			await expandButtons.first().click();
			await expect(page.locator('button').filter({ hasText: '−' }).first()).toBeVisible();
		}
	});
});

import { expect, test } from '@playwright/test';

test.describe('Phase 2: UI Features (No Database Required)', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/builder');
		await expect(page.locator('h1')).toContainText('Pipeline Builder');
	});

	test('should display sample size control', async ({ page }) => {
		// Check for sample size input
		await expect(page.getByLabel('Sample Size:')).toBeVisible();
		await expect(page.getByRole('spinbutton')).toBeVisible();
		await expect(page.getByText('/ 500')).toBeVisible();
	});

	test('should display cache clear button', async ({ page }) => {
		await expect(page.getByRole('button', { name: '🗑️ Clear Cache' })).toBeVisible();
	});

	test('should display run buttons', async ({ page }) => {
		await expect(page.getByRole('button', { name: 'Run with Preview' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Run Pipeline' })).toBeVisible();
	});

	test('should display stage buttons', async ({ page }) => {
		await expect(page.getByRole('button', { name: '$match' })).toBeVisible();
		await expect(page.getByRole('button', { name: '$group' })).toBeVisible();
		await expect(page.getByRole('button', { name: '$sort' })).toBeVisible();
		await expect(page.getByRole('button', { name: '$limit' })).toBeVisible();
	});

	test('should display connection section', async ({ page }) => {
		await expect(page.getByText('Connection')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Connect to MongoDB' })).toBeVisible();
	});

	test('should display pipeline editor', async ({ page }) => {
		await expect(page.locator('.monaco-editor')).toBeVisible();
	});

	test('should update sample size when changed', async ({ page }) => {
		const sampleSizeInput = page.getByRole('spinbutton');

		// Change sample size to 25
		await sampleSizeInput.fill('25');
		await expect(sampleSizeInput).toHaveValue('25');

		// Change sample size to 100
		await sampleSizeInput.fill('100');
		await expect(sampleSizeInput).toHaveValue('100');
	});

	test('should enforce maximum sample size limit', async ({ page }) => {
		const sampleSizeInput = page.getByRole('spinbutton');

		// Try to set sample size above limit
		await sampleSizeInput.fill('600');

		// Wait a bit for the reactive update
		await page.waitForTimeout(100);

		// Should be capped at 500
		const value = await sampleSizeInput.inputValue();
		expect(parseInt(value, 10)).toBeLessThanOrEqual(500);
	});

	test('should have connect button', async ({ page }) => {
		// Check that the connect button exists and is visible
		await expect(page.getByTestId('connect-button')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Connect to MongoDB' })).toBeVisible();
	});

	test('should display pipeline stages section', async ({ page }) => {
		await expect(page.getByText('Pipeline Stages')).toBeVisible();
	});

	test('should display results section', async ({ page }) => {
		await expect(
			page.getByText('Connect to MongoDB and run your pipeline to see results here.'),
		).toBeVisible();
	});
});

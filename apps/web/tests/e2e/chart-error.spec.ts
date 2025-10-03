import { expect, test } from '@playwright/test';

test.describe('Chart Error Reproduction', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the builder page
		await page.goto('http://localhost:5173/builder');

		// Wait for the page to load
		await page.waitForLoadState('networkidle');
	});

	test('should not cause effect_update_depth_exceeded error when clicking chart view', async ({
		page,
	}) => {
		// Listen for console errors
		const errors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				errors.push(msg.text());
			}
		});

		// Listen for page errors
		page.on('pageerror', (error) => {
			errors.push(`Page error: ${error.message}`);
		});

		// First, we need to have some data to visualize
		// Let's connect to a database and run a simple pipeline
		await page.getByRole('button', { name: 'Connect Database' }).click();

		// Fill in connection details
		await page.fill('[data-testid="connection-name"]', 'Test Connection');
		await page.fill('[data-testid="connection-uri"]', 'mongodb://localhost:27017/pipe-lens');

		// Click connect
		await page.getByRole('button', { name: 'Connect' }).click();

		// Wait for connection to complete
		await page.waitForTimeout(2000);

		// Select a database and collection (if needed)
		// This might require additional steps depending on your UI

		// Now let's create a simple pipeline
		const editor = page.locator('.monaco-editor');
		await editor.click();

		// Clear and add a simple pipeline
		await page.keyboard.press('Control+A');
		await page.keyboard.type('[\n  { "$match": {} },\n  { "$limit": 10 }\n]');

		// Execute the pipeline
		await page.getByRole('button', { name: 'Execute Pipeline' }).click();

		// Wait for results
		await page.waitForTimeout(3000);

		// Now click on the chart view
		await page.getByRole('button', { name: 'Chart' }).click();

		// Wait a bit to see if the error occurs
		await page.waitForTimeout(2000);

		// Check for the specific error
		const hasEffectError = errors.some(
			(error) =>
				error.includes('effect_update_depth_exceeded') ||
				error.includes('Maximum update depth exceeded'),
		);

		expect(hasEffectError).toBe(false);

		// Also check that the chart view is actually displayed
		const chartViewer = page.locator('.chart-viewer');
		await expect(chartViewer).toBeVisible();
	});

	test('should handle chart data changes without infinite loops', async ({ page }) => {
		// This test will simulate rapid data changes to trigger the effect loop
		const errors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				errors.push(msg.text());
			}
		});

		page.on('pageerror', (error) => {
			errors.push(`Page error: ${error.message}`);
		});

		// Navigate to builder and set up basic data
		await page.goto('http://localhost:5173/builder');
		await page.waitForLoadState('networkidle');

		// Create a simple pipeline with some data
		const editor = page.locator('.monaco-editor');
		await editor.click();
		await page.keyboard.press('Control+A');
		await page.keyboard.type('[\n  { "$match": {} },\n  { "$limit": 5 }\n]');

		// Execute pipeline
		await page.getByRole('button', { name: 'Execute Pipeline' }).click();
		await page.waitForTimeout(2000);

		// Switch to chart view
		await page.getByRole('button', { name: 'Chart' }).click();
		await page.waitForTimeout(1000);

		// Try to change chart type multiple times rapidly
		const chartSelector = page.locator('[data-testid="chart-selector"]');
		if (await chartSelector.isVisible()) {
			// Click different chart types rapidly
			await page.getByRole('button', { name: 'Bar Chart' }).click();
			await page.waitForTimeout(100);
			await page.getByRole('button', { name: 'Line Chart' }).click();
			await page.waitForTimeout(100);
			await page.getByRole('button', { name: 'Table' }).click();
			await page.waitForTimeout(100);
		}

		// Check for infinite loop errors
		const hasEffectError = errors.some(
			(error) =>
				error.includes('effect_update_depth_exceeded') ||
				error.includes('Maximum update depth exceeded'),
		);

		expect(hasEffectError).toBe(false);
	});
});

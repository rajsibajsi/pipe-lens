import { expect, test } from '@playwright/test';

test.describe('Chart Real Flow Test', () => {
	test('should reproduce the exact error when running pipeline and clicking chart', async ({
		page,
	}) => {
		// Listen for console errors and logs
		const consoleLogs: string[] = [];
		const errors: string[] = [];

		page.on('console', (msg) => {
			consoleLogs.push(msg.text());
		});

		page.on('pageerror', (error) => {
			errors.push(`Page error: ${error.message}`);
		});

		// Navigate to the builder page
		await page.goto('http://localhost:5173/builder');
		await page.waitForLoadState('networkidle');

		// Step 1: Try to connect to MongoDB using the actual UI
		await page.getByRole('button', { name: 'Connect Database' }).click();

		// Wait for modal to appear
		await page.waitForTimeout(1000);

		// Fill connection details using the actual form fields
		await page.fill(
			'input[placeholder*="name" i], input[placeholder*="Name" i]',
			'Test Connection',
		);
		await page.fill(
			'input[placeholder*="uri" i], input[placeholder*="URI" i], input[placeholder*="connection" i]',
			'mongodb://localhost:27017/pipe-lens',
		);

		// Click connect
		await page.getByRole('button', { name: 'Connect' }).click();

		// Wait for connection to complete
		await page.waitForTimeout(3000);

		// Step 2: Create a simple pipeline in the editor
		const editor = page.locator('.monaco-editor');
		await editor.click();
		await page.keyboard.press('Control+A');
		await page.keyboard.type('[\n  { "$match": {} },\n  { "$limit": 5 }\n]');

		// Step 3: Execute the pipeline
		await page.getByRole('button', { name: 'Run Pipeline' }).click();

		// Wait for pipeline execution to complete
		await page.waitForTimeout(5000);

		// Step 4: Click on Chart view (this is where the error should occur)
		console.log('About to click Chart button...');
		await page.getByRole('button', { name: 'Chart' }).click();

		// Wait for chart to load and any effects to run
		await page.waitForTimeout(3000);

		// Check for the specific error
		const hasEffectError = errors.some(
			(error) =>
				error.includes('effect_update_depth_exceeded') ||
				error.includes('Maximum update depth exceeded'),
		);

		// Log all errors and console messages for debugging
		console.log('=== ERRORS CAPTURED ===');
		errors.forEach((error, index) => {
			console.log(`${index + 1}. ${error}`);
		});

		console.log('=== CONSOLE LOGS ===');
		consoleLogs.forEach((log, index) => {
			console.log(`${index + 1}. ${log}`);
		});

		// Check if chart view is actually displayed
		const chartViewer = page.locator('.chart-viewer');
		const isChartVisible = await chartViewer.isVisible();
		console.log('Chart viewer visible:', isChartVisible);

		// The test should pass if no infinite loop error occurs
		expect(hasEffectError).toBe(false);

		// Also verify that the chart view is displayed
		expect(isChartVisible).toBe(true);
	});

	test('should handle chart view with empty results', async ({ page }) => {
		const errors: string[] = [];

		page.on('pageerror', (error) => {
			errors.push(`Page error: ${error.message}`);
		});

		await page.goto('http://localhost:5173/builder');
		await page.waitForLoadState('networkidle');

		// Connect to database
		await page.getByRole('button', { name: 'Connect Database' }).click();
		await page.waitForTimeout(1000);
		await page.fill(
			'input[placeholder*="name" i], input[placeholder*="Name" i]',
			'Test Connection',
		);
		await page.fill(
			'input[placeholder*="uri" i], input[placeholder*="URI" i], input[placeholder*="connection" i]',
			'mongodb://localhost:27017/pipe-lens',
		);
		await page.getByRole('button', { name: 'Connect' }).click();
		await page.waitForTimeout(3000);

		// Create a pipeline that returns no results
		const editor = page.locator('.monaco-editor');
		await editor.click();
		await page.keyboard.press('Control+A');
		await page.keyboard.type('[\n  { "$match": { "nonexistent": true } },\n  { "$limit": 5 }\n]');

		// Execute pipeline
		await page.getByRole('button', { name: 'Run Pipeline' }).click();
		await page.waitForTimeout(3000);

		// Try to view chart with empty results
		await page.getByRole('button', { name: 'Chart' }).click();
		await page.waitForTimeout(2000);

		// Check for errors
		const hasEffectError = errors.some(
			(error) =>
				error.includes('effect_update_depth_exceeded') ||
				error.includes('Maximum update depth exceeded'),
		);

		console.log('Errors with empty results:', errors);
		expect(hasEffectError).toBe(false);
	});
});

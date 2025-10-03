import { expect, test } from '@playwright/test';

test.describe('Chart Pipeline Flow Test', () => {
	test('should not cause effect_update_depth_exceeded when running pipeline and viewing chart', async ({
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

		// Step 1: Connect to MongoDB
		await page.getByRole('button', { name: 'Connect Database' }).click();
		await page.fill('[data-testid="connection-name"]', 'Test Connection');
		await page.fill('[data-testid="connection-uri"]', 'mongodb://localhost:27017/pipe-lens');
		await page.getByRole('button', { name: 'Connect' }).click();

		// Wait for connection to complete
		await page.waitForTimeout(2000);

		// Step 2: Select database and collection
		// Look for database selector and select one
		const dbSelector = page.locator('[data-testid="database-selector"]');
		if (await dbSelector.isVisible()) {
			await dbSelector.click();
			await page.getByText('test').first().click();
			await page.waitForTimeout(1000);
		}

		// Look for collection selector and select one
		const collectionSelector = page.locator('[data-testid="collection-selector"]');
		if (await collectionSelector.isVisible()) {
			await collectionSelector.click();
			await page.getByText('users').first().click();
			await page.waitForTimeout(1000);
		}

		// Step 3: Create a simple pipeline
		const editor = page.locator('.monaco-editor');
		await editor.click();
		await page.keyboard.press('Control+A');
		await page.keyboard.type('[\n  { "$match": {} },\n  { "$limit": 5 }\n]');

		// Step 4: Execute the pipeline
		await page.getByRole('button', { name: 'Run Pipeline' }).click();

		// Wait for pipeline execution to complete
		await page.waitForTimeout(3000);

		// Step 5: Click on Chart view (this is where the error occurs)
		await page.getByRole('button', { name: 'Chart' }).click();

		// Wait for chart to load and any effects to run
		await page.waitForTimeout(2000);

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

	test('should handle chart view with different data types', async ({ page }) => {
		const errors: string[] = [];

		page.on('pageerror', (error) => {
			errors.push(`Page error: ${error.message}`);
		});

		await page.goto('http://localhost:5173/builder');
		await page.waitForLoadState('networkidle');

		// Connect to database
		await page.getByRole('button', { name: 'Connect Database' }).click();
		await page.fill('[data-testid="connection-name"]', 'Test Connection');
		await page.fill('[data-testid="connection-uri"]', 'mongodb://localhost:27017/pipe-lens');
		await page.getByRole('button', { name: 'Connect' }).click();
		await page.waitForTimeout(2000);

		// Try different pipeline types that might cause issues
		const pipelines = [
			'[\n  { "$match": {} },\n  { "$group": { "_id": "$category", "count": { "$sum": 1 } } }\n]',
			'[\n  { "$match": {} },\n  { "$project": { "name": 1, "age": 1 } },\n  { "$limit": 10 }\n]',
			'[\n  { "$match": {} },\n  { "$sort": { "age": -1 } },\n  { "$limit": 5 }\n]',
		];

		for (const pipeline of pipelines) {
			console.log(`Testing pipeline: ${pipeline}`);

			// Clear editor and add pipeline
			const editor = page.locator('.monaco-editor');
			await editor.click();
			await page.keyboard.press('Control+A');
			await page.keyboard.type(pipeline);

			// Execute pipeline
			await page.getByRole('button', { name: 'Run Pipeline' }).click();
			await page.waitForTimeout(2000);

			// Try to view chart
			await page.getByRole('button', { name: 'Chart' }).click();
			await page.waitForTimeout(1000);

			// Check for errors
			const hasEffectError = errors.some(
				(error) =>
					error.includes('effect_update_depth_exceeded') ||
					error.includes('Maximum update depth exceeded'),
			);

			if (hasEffectError) {
				console.log(`Error occurred with pipeline: ${pipeline}`);
				break;
			}

			// Go back to results view for next iteration
			await page.getByRole('button', { name: 'Results' }).click();
			await page.waitForTimeout(500);
		}

		// Final check
		const hasEffectError = errors.some(
			(error) =>
				error.includes('effect_update_depth_exceeded') ||
				error.includes('Maximum update depth exceeded'),
		);

		console.log('Final errors:', errors);
		expect(hasEffectError).toBe(false);
	});
});

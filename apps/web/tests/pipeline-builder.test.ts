import { expect, test } from '@playwright/test';

// Helper function to connect to MongoDB
async function connectToMongoDB(page: any, connectionName = 'Local MongoDB') {
	await page.waitForLoadState('networkidle');
	await page.getByTestId('connect-button').click();
	await page.waitForTimeout(200);

	if (connectionName !== 'Local MongoDB') {
		await page.getByLabel('Connection Name').fill(connectionName);
	}
	await page.getByLabel('Connection URI').fill('mongodb://admin:password@localhost:27017');
	await page.getByRole('button', { name: 'Connect', exact: true }).click();
	await expect(page.getByText(connectionName)).toBeVisible({ timeout: 15000 });
}

// Helper function to select database and collection
async function selectDatabaseAndCollection(
	page: any,
	database = 'testdb',
	collection = 'orders',
) {
	await page.getByText('Select database...').click();
	await page.getByText(database).click();
	await page.waitForTimeout(500);

	await page.getByText('Select collection...').click();
	await page.getByText(collection).click();
	await page.waitForTimeout(500);
}

test.describe('Pipeline Builder - Stage Preview', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the builder page
		await page.goto('/builder');
		await expect(page.locator('h1')).toContainText('Pipeline Builder');
	});

	test('should display builder UI elements', async ({ page }) => {
		// Check for key UI elements
		await expect(page.getByText('Pipeline Stages')).toBeVisible();
		await expect(page.getByText('Connection')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Connect to MongoDB' })).toBeVisible();

		// Check for stage buttons
		await expect(page.getByRole('button', { name: '$match' })).toBeVisible();
		await expect(page.getByRole('button', { name: '$group' })).toBeVisible();
		await expect(page.getByRole('button', { name: '$sort' })).toBeVisible();
	});

	test('should open connection modal', async ({ page }) => {
		// Wait for page to be fully loaded
		await page.waitForLoadState('networkidle');

		// Click connect button
		await page.getByTestId('connect-button').click();

		// Wait a bit for Svelte reactivity
		await page.waitForTimeout(100);

		// Modal should appear
		await expect(page.getByLabel('Connection Name')).toBeVisible({ timeout: 5000 });
		await expect(page.getByLabel('Connection URI')).toBeVisible();

		// Close modal
		await page.getByRole('button', { name: 'Cancel' }).click();
		await expect(page.getByLabel('Connection Name')).not.toBeVisible();
	});

	test('should connect to MongoDB and select database', async ({ page }) => {
		// Wait for page to be fully loaded
		await page.waitForLoadState('networkidle');

		// Open connection modal
		await page.getByTestId('connect-button').click();

		// Wait for modal to appear
		await page.waitForTimeout(200);

		// Fill in connection details
		await page.getByLabel('Connection Name').fill('Test Connection');
		await page.getByLabel('Connection URI').fill('mongodb://admin:password@localhost:27017');

		// Connect (use exact match and filter for the modal button)
		await page.getByRole('button', { name: 'Connect', exact: true }).click();

		// Wait for connection to succeed
		await expect(page.getByText('Test Connection')).toBeVisible({ timeout: 15000 });

		// Database dropdown should be available
		await expect(page.getByText('Select database...')).toBeVisible();

		// Click database dropdown
		await page.getByText('Select database...').click();

		// Should show testdb in dropdown
		await expect(page.getByText('testdb')).toBeVisible();
	});

	test('should run pipeline with stage preview', async ({ page }) => {
		// Connect to MongoDB and select database/collection
		await connectToMongoDB(page);
		await selectDatabaseAndCollection(page);

		// Update pipeline in Monaco editor
		const pipeline = `[
  {
    "$match": {
      "status": "shipped"
    }
  },
  {
    "$group": {
      "_id": "$category",
      "count": { "$sum": 1 }
    }
  }
]`;

		// Find Monaco editor and set value
		await page.locator('.monaco-editor').click();
		await page.keyboard.press('Control+A');
		await page.keyboard.type(pipeline);

		// Click "Run with Preview"
		await page.getByRole('button', { name: 'Run with Preview' }).click();

		// Wait for results
		await expect(page.getByText('Stage-by-Stage Results')).toBeVisible({ timeout: 10000 });

		// Check for stage indicators
		await expect(page.getByText('$match')).toBeVisible();
		await expect(page.getByText('documents').first()).toBeVisible();

		// Click to expand first stage
		await page.locator('button').filter({ hasText: '$match' }).first().click();

		// Check for stage details
		await expect(page.getByText('Stage Definition')).toBeVisible();
		await expect(page.getByText('Preview')).toBeVisible();
	});

	test('should toggle between results and stage preview modes', async ({ page }) => {
		// Connect and select database/collection
		await connectToMongoDB(page);
		await selectDatabaseAndCollection(page);

		// Simple pipeline
		const pipeline = `[{ "$limit": 5 }]`;
		await page.locator('.monaco-editor').click();
		await page.keyboard.press('Control+A');
		await page.keyboard.type(pipeline);

		// Run regular pipeline
		await page.getByRole('button', { name: /^Run Pipeline$/ }).click();
		await expect(page.getByText('Pipeline Results')).toBeVisible({ timeout: 10000 });

		// Run with preview
		await page.getByRole('button', { name: 'Run with Preview' }).click();
		await expect(page.getByText('Stage-by-Stage Results')).toBeVisible({ timeout: 10000 });
	});

	test('should show execution time for each stage', async ({ page }) => {
		// Setup connection
		await connectToMongoDB(page);
		await selectDatabaseAndCollection(page);

		// Pipeline with multiple stages
		const pipeline = `[
  { "$match": { "status": "shipped" } },
  { "$group": { "_id": "$category", "count": { "$sum": 1 } } },
  { "$sort": { "count": -1 } }
]`;

		await page.locator('.monaco-editor').click();
		await page.keyboard.press('Control+A');
		await page.keyboard.type(pipeline);

		// Run with preview
		await page.getByRole('button', { name: 'Run with Preview' }).click();
		await expect(page.getByText('Stage-by-Stage Results')).toBeVisible({ timeout: 10000 });

		// Check for execution times (should show ms or s)
		const timeText = await page.getByText(/\d+(ms|s)/).first().textContent();
		expect(timeText).toMatch(/\d+(ms|s)/);
	});

	test('should display error for invalid pipeline', async ({ page }) => {
		// Setup connection
		await connectToMongoDB(page);
		await selectDatabaseAndCollection(page);

		// Invalid pipeline
		const invalidPipeline = `[{ "invalid": "operator" }]`;

		await page.locator('.monaco-editor').click();
		await page.keyboard.press('Control+A');
		await page.keyboard.type(invalidPipeline);

		// Try to run
		await page.getByRole('button', { name: 'Run with Preview' }).click();

		// Should show error
		await expect(page.getByText(/invalid operators/i)).toBeVisible({ timeout: 5000 });
	});

	test('should show document count changes across stages', async ({ page }) => {
		// Setup connection
		await connectToMongoDB(page);
		await selectDatabaseAndCollection(page);

		// Pipeline that reduces document count
		const pipeline = `[
  { "$match": { "category": "Electronics" } },
  { "$limit": 2 }
]`;

		await page.locator('.monaco-editor').click();
		await page.keyboard.press('Control+A');
		await page.keyboard.type(pipeline);

		// Run with preview
		await page.getByRole('button', { name: 'Run with Preview' }).click();
		await expect(page.getByText('Stage-by-Stage Results')).toBeVisible({ timeout: 10000 });

		// Should show document counts for both stages
		const stages = await page.locator('[style*="background: #1f2937"]').all();
		expect(stages.length).toBeGreaterThanOrEqual(2);

		// Each stage should show document count
		await expect(page.getByText(/\d+ documents/).first()).toBeVisible();
	});
});
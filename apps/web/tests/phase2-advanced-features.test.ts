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
	await page.getByText(database).click();
	await page.waitForTimeout(500);
	await page.getByText(collection).click();
	await page.waitForTimeout(500);
}

// Helper function to run pipeline with preview
async function runPipelineWithPreview(page: any, pipeline: string) {
	await page.locator('.monaco-editor').click();
	await page.keyboard.press('Control+A');
	await page.keyboard.type(pipeline);
	await page.getByRole('button', { name: 'Run with Preview' }).click();
	await expect(page.getByText('Stage-by-Stage Results')).toBeVisible({ timeout: 10000 });
}

test.describe('Phase 2: Advanced Stage Preview Features', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/builder');
		await expect(page.locator('h1')).toContainText('Pipeline Builder');
		await connectToMongoDB(page);
		await selectDatabaseAndCollection(page);
	});

	test.describe('Document Viewer Component', () => {
		test('should display expandable/collapsible fields', async ({ page }) => {
			const pipeline = `[{ "$limit": 1 }]`;
			await runPipelineWithPreview(page, pipeline);

			// Click to expand first stage
			await page.locator('button').filter({ hasText: '$limit' }).first().click();
			await expect(page.getByText('Preview Documents')).toBeVisible();

			// Check for expandable fields (should have + buttons for objects/arrays)
			const expandButtons = page.locator('button').filter({ hasText: '+' });
			await expect(expandButtons.first()).toBeVisible();

			// Click to expand a field
			await expandButtons.first().click();
			await expect(page.locator('button').filter({ hasText: '−' }).first()).toBeVisible();
		});

		test('should show field type indicators', async ({ page }) => {
			const pipeline = `[{ "$limit": 1 }]`;
			await runPipelineWithPreview(page, pipeline);

			// Click to expand first stage
			await page.locator('button').filter({ hasText: '$limit' }).first().click();
			await expect(page.getByText('Preview Documents')).toBeVisible();

			// Check for field type icons (emojis)
			await expect(page.locator('text=📝').first()).toBeVisible(); // string type
			await expect(page.locator('text=🔢').first()).toBeVisible(); // number type
		});

		test('should navigate between documents', async ({ page }) => {
			const pipeline = `[{ "$limit": 3 }]`;
			await runPipelineWithPreview(page, pipeline);

			// Click to expand first stage
			await page.locator('button').filter({ hasText: '$limit' }).first().click();
			await expect(page.getByText('Preview Documents')).toBeVisible();

			// Check for document navigation controls
			await expect(page.getByText('1 of 3')).toBeVisible();
			await expect(page.getByRole('button', { name: '→' })).toBeVisible();

			// Navigate to next document
			await page.getByRole('button', { name: '→' }).click();
			await expect(page.getByText('2 of 3')).toBeVisible();

			// Navigate to previous document
			await page.getByRole('button', { name: '←' }).click();
			await expect(page.getByText('1 of 3')).toBeVisible();
		});

		test('should show field count for each document', async ({ page }) => {
			const pipeline = `[{ "$limit": 1 }]`;
			await runPipelineWithPreview(page, pipeline);

			// Click to expand first stage
			await page.locator('button').filter({ hasText: '$limit' }).first().click();
			await expect(page.getByText('Preview Documents')).toBeVisible();

			// Check for field count display
			await expect(page.getByText(/\d+ fields/)).toBeVisible();
		});
	});

	test.describe('Side-by-Side View', () => {
		test('should toggle between preview and side-by-side modes', async ({ page }) => {
			const pipeline = `[
				{ "$match": { "status": "shipped" } },
				{ "$group": { "_id": "$category", "count": { "$sum": 1 } } }
			]`;
			await runPipelineWithPreview(page, pipeline);

			// Click to expand second stage (has previous stage to compare)
			await page.locator('button').filter({ hasText: '$group' }).first().click();
			await expect(page.getByText('Stage Definition')).toBeVisible();

			// Check for view mode toggle
			await expect(page.getByText('View Mode:')).toBeVisible();
			await expect(page.getByRole('button', { name: 'Preview' })).toBeVisible();
			await expect(page.getByRole('button', { name: 'Side-by-Side' })).toBeVisible();

			// Switch to side-by-side view
			await page.getByRole('button', { name: 'Side-by-Side' }).click();
			await expect(page.getByText('Before (Previous Stage)')).toBeVisible();
			await expect(page.getByText('After (Current Stage)')).toBeVisible();
		});

		test('should highlight field changes in side-by-side view', async ({ page }) => {
			const pipeline = `[
				{ "$match": { "status": "shipped" } },
				{ "$group": { "_id": "$category", "count": { "$sum": 1 } } }
			]`;
			await runPipelineWithPreview(page, pipeline);

			// Click to expand second stage
			await page.locator('button').filter({ hasText: '$group' }).first().click();
			
			// Switch to side-by-side view
			await page.getByRole('button', { name: 'Side-by-Side' }).click();
			
			// Check for change indicators (yellow highlighting)
			const changedFields = page.locator('[style*="color: var(--color-warning)"]');
			await expect(changedFields.first()).toBeVisible();
		});
	});

	test.describe('Sample Size Configuration', () => {
		test('should display sample size control', async ({ page }) => {
			// Check for sample size input
			await expect(page.getByLabel('Sample Size:')).toBeVisible();
			await expect(page.getByRole('spinbutton')).toBeVisible();
			await expect(page.getByText('/ 500')).toBeVisible();
		});

		test('should update sample size and affect results', async ({ page }) => {
			// Change sample size to 2
			await page.getByRole('spinbutton').fill('2');
			
			const pipeline = `[{ "$limit": 5 }]`;
			await runPipelineWithPreview(page, pipeline);

			// Click to expand first stage
			await page.locator('button').filter({ hasText: '$limit' }).first().click();
			await expect(page.getByText('Preview (2 of 5 documents)')).toBeVisible();
		});

		test('should enforce maximum sample size limit', async ({ page }) => {
			// Try to set sample size above limit
			await page.getByRole('spinbutton').fill('600');
			
			// Should be capped at 500
			const value = await page.getByRole('spinbutton').inputValue();
			expect(parseInt(value)).toBeLessThanOrEqual(500);
		});
	});

	test.describe('Navigation Controls', () => {
		test('should navigate between stages', async ({ page }) => {
			const pipeline = `[
				{ "$match": { "status": "shipped" } },
				{ "$group": { "_id": "$category", "count": { "$sum": 1 } } },
				{ "$sort": { "count": -1 } }
			]`;
			await runPipelineWithPreview(page, pipeline);

			// Check for navigation controls
			await expect(page.getByText('Select a stage')).toBeVisible();
			await expect(page.getByRole('button', { name: '← Previous Stage' })).toBeVisible();
			await expect(page.getByRole('button', { name: 'Next Stage →' })).toBeVisible();

			// Navigate to next stage
			await page.getByRole('button', { name: 'Next Stage →' }).click();
			await expect(page.getByText('2 of 3')).toBeVisible();

			// Navigate to previous stage
			await page.getByRole('button', { name: '← Previous Stage' }).click();
			await expect(page.getByText('1 of 3')).toBeVisible();
		});

		test('should disable navigation buttons at boundaries', async ({ page }) => {
			const pipeline = `[
				{ "$match": { "status": "shipped" } },
				{ "$group": { "_id": "$category", "count": { "$sum": 1 } } }
			]`;
			await runPipelineWithPreview(page, pipeline);

			// Previous button should be disabled at first stage
			await expect(page.getByRole('button', { name: '← Previous Stage' })).toBeDisabled();

			// Navigate to last stage
			await page.getByRole('button', { name: 'Next Stage →' }).click();
			
			// Next button should be disabled at last stage
			await expect(page.getByRole('button', { name: 'Next Stage →' })).toBeDisabled();
		});
	});

	test.describe('Result Caching', () => {
		test('should display cache clear button', async ({ page }) => {
			await expect(page.getByRole('button', { name: '🗑️ Clear Cache' })).toBeVisible();
		});

		test('should cache results for repeated queries', async ({ page }) => {
			const pipeline = `[{ "$limit": 2 }]`;
			
			// First execution
			await runPipelineWithPreview(page, pipeline);
			await expect(page.getByText('Stage-by-Stage Results')).toBeVisible();

			// Clear and run again
			await page.getByRole('button', { name: '🗑️ Clear Cache' }).click();
			await runPipelineWithPreview(page, pipeline);
			await expect(page.getByText('Stage-by-Stage Results')).toBeVisible();
		});
	});

	test.describe('Error Handling', () => {
		test('should handle MongoDB connection errors gracefully', async ({ page }) => {
			// Try to connect with invalid URI
			await page.getByTestId('connect-button').click();
			await page.getByLabel('Connection URI').fill('mongodb://invalid:invalid@localhost:9999');
			await page.getByRole('button', { name: 'Connect' }).click();

			// Should show error message
			await expect(page.getByText(/Failed to connect/i)).toBeVisible({ timeout: 10000 });
		});

		test('should handle invalid pipeline syntax', async ({ page }) => {
			const invalidPipeline = `[{ "invalid": "operator" }]`;
			await page.locator('.monaco-editor').click();
			await page.keyboard.press('Control+A');
			await page.keyboard.type(invalidPipeline);
			await page.getByRole('button', { name: 'Run with Preview' }).click();

			// Should show validation error
			await expect(page.getByText(/invalid operators/i)).toBeVisible({ timeout: 5000 });
		});

		test('should handle empty pipeline', async ({ page }) => {
			const emptyPipeline = `[]`;
			await page.locator('.monaco-editor').click();
			await page.keyboard.press('Control+A');
			await page.keyboard.type(emptyPipeline);
			await page.getByRole('button', { name: 'Run with Preview' }).click();

			// Should show validation error
			await expect(page.getByText(/Pipeline cannot be empty/i)).toBeVisible({ timeout: 5000 });
		});
	});

	test.describe('Performance and Execution Timing', () => {
		test('should display execution time for each stage', async ({ page }) => {
			const pipeline = `[
				{ "$match": { "status": "shipped" } },
				{ "$group": { "_id": "$category", "count": { "$sum": 1 } } }
			]`;
			await runPipelineWithPreview(page, pipeline);

			// Check for execution time display
			const timeElements = page.locator('text=ms').or(page.locator('text=s'));
			await expect(timeElements.first()).toBeVisible();

			// Should show reasonable execution times
			const timeText = await timeElements.first().textContent();
			expect(timeText).toMatch(/\d+(ms|s)/);
		});

		test('should show document count changes through pipeline', async ({ page }) => {
			const pipeline = `[
				{ "$match": { "category": "Electronics" } },
				{ "$limit": 2 }
			]`;
			await runPipelineWithPreview(page, pipeline);

			// Should show different document counts for each stage
			const documentCounts = page.locator('text=/\\d+ documents/');
			const counts = await documentCounts.allTextContents();
			
			// First stage should have more documents than second stage
			const firstCount = parseInt(counts[0].match(/\d+/)?.[0] || '0');
			const secondCount = parseInt(counts[1].match(/\d+/)?.[0] || '0');
			
			expect(firstCount).toBeGreaterThan(secondCount);
		});
	});

	test.describe('UI Responsiveness', () => {
		test('should handle different screen sizes', async ({ page }) => {
			// Test on mobile viewport
			await page.setViewportSize({ width: 375, height: 667 });
			
			const pipeline = `[{ "$limit": 1 }]`;
			await runPipelineWithPreview(page, pipeline);

			// UI should still be functional
			await expect(page.getByText('Stage-by-Stage Results')).toBeVisible();
			
			// Click to expand stage
			await page.locator('button').filter({ hasText: '$limit' }).first().click();
			await expect(page.getByText('Preview Documents')).toBeVisible();
		});

		test('should maintain state during view mode switches', async ({ page }) => {
			const pipeline = `[
				{ "$match": { "status": "shipped" } },
				{ "$group": { "_id": "$category", "count": { "$sum": 1 } } }
			]`;
			await runPipelineWithPreview(page, pipeline);

			// Click to expand second stage
			await page.locator('button').filter({ hasText: '$group' }).first().click();
			
			// Switch between view modes
			await page.getByRole('button', { name: 'Side-by-Side' }).click();
			await expect(page.getByText('Before (Previous Stage)')).toBeVisible();
			
			await page.getByRole('button', { name: 'Preview' }).click();
			await expect(page.getByText('Preview Documents')).toBeVisible();
		});
	});
});

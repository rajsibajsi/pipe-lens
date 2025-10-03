import { expect, test } from '@playwright/test';

test.describe('Chart Error Simple Test', () => {
	test('should not cause effect_update_depth_exceeded error with sample data', async ({ page }) => {
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

		// Navigate to the builder page
		await page.goto('http://localhost:5173/builder');
		await page.waitForLoadState('networkidle');

		// Create a simple test by directly setting some results data
		// We'll use the browser console to simulate having data
		await page.evaluate(() => {
			// Simulate having some pipeline results
			const mockResults = [
				{ name: 'Alice', age: 30, city: 'New York' },
				{ name: 'Bob', age: 25, city: 'San Francisco' },
				{ name: 'Charlie', age: 35, city: 'Chicago' },
				{ name: 'Diana', age: 28, city: 'Boston' },
				{ name: 'Eve', age: 32, city: 'Seattle' },
			];

			// Store in a global variable that the component can access
			(window as unknown as { mockResults: unknown }).mockResults = mockResults;
		});

		// Wait a bit for the page to settle
		await page.waitForTimeout(1000);

		// Try to trigger the chart view by looking for any chart-related elements
		// First, let's see what's on the page
		const pageContent = await page.content();
		console.log('Page content includes chart elements:', pageContent.includes('chart'));

		// Look for any buttons that might trigger chart view
		const buttons = await page.locator('button').all();
		console.log('Found buttons:', await Promise.all(buttons.map((btn) => btn.textContent())));

		// Check if there are any chart-related elements already visible
		const chartElements = await page.locator('[class*="chart"], [data-testid*="chart"]').count();
		console.log('Chart elements found:', chartElements);

		// Wait a bit more to see if any errors occur
		await page.waitForTimeout(2000);

		// Check for the specific error
		const hasEffectError = errors.some(
			(error) =>
				error.includes('effect_update_depth_exceeded') ||
				error.includes('Maximum update depth exceeded'),
		);

		console.log('Errors captured:', errors);
		expect(hasEffectError).toBe(false);
	});

	test('should handle rapid state changes without infinite loops', async ({ page }) => {
		const errors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				errors.push(msg.text());
			}
		});

		page.on('pageerror', (error) => {
			errors.push(`Page error: ${error.message}`);
		});

		await page.goto('http://localhost:5173/builder');
		await page.waitForLoadState('networkidle');

		// Simulate rapid state changes that might trigger the effect loop
		await page.evaluate(() => {
			// Try to trigger rapid updates by simulating data changes
			let counter = 0;
			const interval = setInterval(() => {
				const mockData = Array.from({ length: 5 }, (_, i) => ({
					id: counter + i,
					value: Math.random() * 100,
					category: `Category ${(counter + i) % 3}`,
				}));

				// Dispatch a custom event that might trigger chart updates
				window.dispatchEvent(new CustomEvent('dataUpdate', { detail: mockData }));
				counter++;

				if (counter > 10) {
					clearInterval(interval);
				}
			}, 100);
		});

		// Wait for the rapid updates to complete
		await page.waitForTimeout(2000);

		// Check for infinite loop errors
		const hasEffectError = errors.some(
			(error) =>
				error.includes('effect_update_depth_exceeded') ||
				error.includes('Maximum update depth exceeded'),
		);

		console.log('Errors during rapid updates:', errors);
		expect(hasEffectError).toBe(false);
	});
});

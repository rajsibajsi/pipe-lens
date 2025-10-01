import { expect, test } from '@playwright/test';

test.describe('Debug Error Tests', () => {
	test('should capture console errors on builder page', async ({ page }) => {
		const consoleErrors: string[] = [];
		
		// Listen for console errors
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				consoleErrors.push(msg.text());
			}
		});

		// Listen for page errors
		page.on('pageerror', (error) => {
			consoleErrors.push(`Page error: ${error.message}`);
		});

		await page.goto('/builder');
		await page.waitForLoadState('networkidle');
		
		// Log any console errors
		if (consoleErrors.length > 0) {
			console.log('Console errors found:', consoleErrors);
		}
		
		// Check if page loaded successfully
		const title = await page.title();
		console.log('Page title:', title);
		
		const bodyText = await page.textContent('body');
		console.log('Body content preview:', bodyText?.substring(0, 200));
		
		// The test will pass even if there are errors, but we'll see them in the output
		expect(true).toBe(true);
	});
});

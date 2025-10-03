import { expect, test } from '@playwright/test';

test.describe('Chart Direct Test', () => {
  test('should not cause effect_update_depth_exceeded when viewing chart with mock data', async ({ page }) => {
    // Listen for console errors and logs
    const consoleLogs: string[] = [];
    const errors: string[] = [];
    
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    page.on('pageerror', error => {
      errors.push(`Page error: ${error.message}`);
    });

    // Navigate to the builder page
    await page.goto('http://localhost:5173/builder');
    await page.waitForLoadState('networkidle');

    // Simulate having pipeline results by directly setting them in the store
    await page.evaluate(() => {
      // Mock some pipeline results
      const mockResults = [
        { _id: '507f1f77bcf86cd799439011', name: 'Alice', age: 30, city: 'New York', salary: 75000 },
        { _id: '507f1f77bcf86cd799439012', name: 'Bob', age: 25, city: 'San Francisco', salary: 85000 },
        { _id: '507f1f77bcf86cd799439013', name: 'Charlie', age: 35, city: 'Chicago', salary: 70000 },
        { _id: '507f1f77bcf86cd799439014', name: 'Diana', age: 28, city: 'Boston', salary: 80000 },
        { _id: '507f1f77bcf86cd799439015', name: 'Eve', age: 32, city: 'Seattle', salary: 90000 }
      ];

      // Try to access the pipeline store and set results
      if (window.pipelineStore) {
        window.pipelineStore.setResults(mockResults);
      } else {
        // If store is not available, try to trigger the chart view directly
        window.dispatchEvent(new CustomEvent('setResults', { detail: mockResults }));
      }
    });

    // Wait a bit for the data to be processed
    await page.waitForTimeout(1000);

    // Try to click on Chart view
    const chartButton = page.getByRole('button', { name: 'Chart' });
    if (await chartButton.isVisible()) {
      await chartButton.click();
      console.log('Clicked Chart button');
    } else {
      console.log('Chart button not visible, trying alternative approach');
      
      // Try to find any button that might trigger chart view
      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        const text = await button.textContent();
        if (text && text.toLowerCase().includes('chart')) {
          await button.click();
          console.log(`Clicked button with text: ${text}`);
          break;
        }
      }
    }

    // Wait for chart to load and any effects to run
    await page.waitForTimeout(2000);

    // Check for the specific error
    const hasEffectError = errors.some(error => 
      error.includes('effect_update_depth_exceeded') || 
      error.includes('Maximum update depth exceeded')
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
  });

  test('should handle rapid chart view switching without infinite loops', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', error => {
      errors.push(`Page error: ${error.message}`);
    });

    await page.goto('http://localhost:5173/builder');
    await page.waitForLoadState('networkidle');

    // Set up mock data
    await page.evaluate(() => {
      const mockResults = [
        { _id: '1', name: 'Test', value: 100 },
        { _id: '2', name: 'Test2', value: 200 }
      ];
      
      if (window.pipelineStore) {
        window.pipelineStore.setResults(mockResults);
      }
    });

    await page.waitForTimeout(1000);

    // Try rapid switching between different views
    const viewButtons = ['Results', 'Stages', 'Chart'];
    
    for (let i = 0; i < 3; i++) {
      for (const view of viewButtons) {
        const button = page.getByRole('button', { name: view });
        if (await button.isVisible()) {
          await button.click();
          console.log(`Switched to ${view} view`);
          await page.waitForTimeout(200);
        }
      }
    }

    // Check for infinite loop errors
    const hasEffectError = errors.some(error => 
      error.includes('effect_update_depth_exceeded') || 
      error.includes('Maximum update depth exceeded')
    );

    console.log('Errors after rapid switching:', errors);
    expect(hasEffectError).toBe(false);
  });
});

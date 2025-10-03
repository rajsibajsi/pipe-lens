import { expect, test } from '@playwright/test';

test.describe('Chart Debug Test', () => {
  test('should debug chart effect runs', async ({ page }) => {
    // Listen for console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    // Listen for page errors
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(`Page error: ${error.message}`);
    });

    // Navigate to the builder page
    await page.goto('http://localhost:5173/builder');
    await page.waitForLoadState('networkidle');

    // Simulate having some data by setting it in the browser
    await page.evaluate(() => {
      // Create some mock pipeline results
      const mockResults = [
        { _id: '1', name: 'Alice', age: 30, city: 'New York' },
        { _id: '2', name: 'Bob', age: 25, city: 'San Francisco' },
        { _id: '3', name: 'Charlie', age: 35, city: 'Chicago' }
      ];
      
      // Try to trigger the chart view by simulating a view mode change
      // This might trigger the chart component to load
      window.dispatchEvent(new CustomEvent('viewModeChange', { detail: 'chart' }));
      
      // Store mock data globally
      (window as any).mockResults = mockResults;
    });

    // Wait for any effects to run
    await page.waitForTimeout(2000);

    // Check console logs for effect runs
    const effectLogs = consoleLogs.filter(log => log.includes('ChartViewer effect triggered'));
    console.log('Effect run logs:', effectLogs);
    console.log('Total effect runs:', effectLogs.length);

    // Check for infinite loop errors
    const hasEffectError = errors.some(error => 
      error.includes('effect_update_depth_exceeded') || 
      error.includes('Maximum update depth exceeded')
    );

    console.log('Errors captured:', errors);
    expect(hasEffectError).toBe(false);
    
    // Check that effect doesn't run too many times
    expect(effectLogs.length).toBeLessThan(10);
  });
});

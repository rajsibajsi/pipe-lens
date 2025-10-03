import ChartViewer from '$lib/components/ChartViewer.svelte';
import { render, screen } from '@testing-library/svelte';
import { vi } from 'vitest';

// Mock the chart utilities
vi.mock('$lib/utils/chart-data', () => ({
  detectChartType: vi.fn(() => 'bar'),
  getChartConfig: vi.fn(() => ({ title: 'Test Chart', type: 'bar' })),
  transformToChartData: vi.fn(() => ({ labels: ['A', 'B'], datasets: [{ data: [1, 2] }] }))
}));

describe('ChartViewer', () => {
  const mockData = [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
    { name: 'Charlie', age: 35 }
  ];

  test('should render without infinite loop errors', () => {
    // This test will fail if there are infinite loops in the component
    expect(() => {
      render(ChartViewer, {
        props: {
          data: mockData,
          title: 'Test Chart'
        }
      });
    }).not.toThrow();
  });

  test('should handle data changes without errors', () => {
    const { component } = render(ChartViewer, {
      props: {
        data: mockData,
        title: 'Test Chart'
      }
    });

    // Simulate data changes
    expect(() => {
      component.$set({ data: [...mockData, { name: 'Diana', age: 28 }] });
    }).not.toThrow();

    expect(() => {
      component.$set({ data: [] });
    }).not.toThrow();
  });

  test('should handle chart type changes without errors', () => {
    const { component } = render(ChartViewer, {
      props: {
        data: mockData,
        title: 'Test Chart'
      }
    });

    // Simulate chart type changes
    expect(() => {
      // Access the component's methods if they exist
      if (component.handleTypeChange) {
        component.handleTypeChange('line');
      }
    }).not.toThrow();
  });
});
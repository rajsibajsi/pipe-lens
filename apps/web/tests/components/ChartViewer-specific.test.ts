import ChartViewer from '$lib/components/ChartViewer.svelte';
import { render, screen } from '@testing-library/svelte';
import { vi } from 'vitest';

// Mock the chart utilities
vi.mock('$lib/utils/chart-data', () => ({
  detectChartType: vi.fn(() => 'bar'),
  getChartConfig: vi.fn(() => ({ 
    title: 'Test Chart', 
    type: 'bar',
    showLegend: true,
    showGrid: true,
    xAxisLabel: 'Category',
    yAxisLabel: 'Value'
  })),
  transformToChartData: vi.fn(() => ({ 
    labels: ['A', 'B', 'C'], 
    datasets: [{ 
      label: 'Test Data',
      data: [1, 2, 3],
      backgroundColor: '#3b82f6'
    }] 
  }))
}));

describe('ChartViewer with MongoDB Pipeline Results', () => {
  // Sample data that would come from MongoDB pipeline results
  const mongoPipelineResults = [
    { _id: '507f1f77bcf86cd799439011', name: 'Alice', age: 30, city: 'New York', salary: 75000 },
    { _id: '507f1f77bcf86cd799439012', name: 'Bob', age: 25, city: 'San Francisco', salary: 85000 },
    { _id: '507f1f77bcf86cd799439013', name: 'Charlie', age: 35, city: 'Chicago', salary: 70000 },
    { _id: '507f1f77bcf86cd799439014', name: 'Diana', age: 28, city: 'Boston', salary: 80000 },
    { _id: '507f1f77bcf86cd799439015', name: 'Eve', age: 32, city: 'Seattle', salary: 90000 }
  ];

  // Aggregation results that might cause issues
  const aggregationResults = [
    { _id: 'New York', count: 1, totalSalary: 75000, avgSalary: 75000 },
    { _id: 'San Francisco', count: 1, totalSalary: 85000, avgSalary: 85000 },
    { _id: 'Chicago', count: 1, totalSalary: 70000, avgSalary: 70000 },
    { _id: 'Boston', count: 1, totalSalary: 80000, avgSalary: 80000 },
    { _id: 'Seattle', count: 1, totalSalary: 90000, avgSalary: 90000 }
  ];

  // Empty results
  const emptyResults: any[] = [];

  // Single item results
  const singleItemResults = [
    { _id: '507f1f77bcf86cd799439011', name: 'Alice', age: 30 }
  ];

  test('should handle MongoDB pipeline results without infinite loops', () => {
    expect(() => {
      render(ChartViewer, {
        props: {
          data: mongoPipelineResults,
          title: 'MongoDB Pipeline Results'
        }
      });
    }).not.toThrow();
  });

  test('should handle aggregation results without infinite loops', () => {
    expect(() => {
      render(ChartViewer, {
        props: {
          data: aggregationResults,
          title: 'Aggregation Results'
        }
      });
    }).not.toThrow();
  });

  test('should handle empty results without infinite loops', () => {
    expect(() => {
      render(ChartViewer, {
        props: {
          data: emptyResults,
          title: 'Empty Results'
        }
      });
    }).not.toThrow();
  });

  test('should handle single item results without infinite loops', () => {
    expect(() => {
      render(ChartViewer, {
        props: {
          data: singleItemResults,
          title: 'Single Item Results'
        }
      });
    }).not.toThrow();
  });

  test('should handle rapid data changes without infinite loops', () => {
    const { component } = render(ChartViewer, {
      props: {
        data: mongoPipelineResults,
        title: 'Test Chart'
      }
    });

    // Simulate rapid data changes that might occur during pipeline execution
    expect(() => {
      component.$set({ data: emptyResults });
      component.$set({ data: singleItemResults });
      component.$set({ data: aggregationResults });
      component.$set({ data: mongoPipelineResults });
    }).not.toThrow();
  });

  test('should handle title changes without infinite loops', () => {
    const { component } = render(ChartViewer, {
      props: {
        data: mongoPipelineResults,
        title: 'Original Title'
      }
    });

    expect(() => {
      component.$set({ title: 'New Title' });
      component.$set({ title: 'Another Title' });
    }).not.toThrow();
  });

  test('should handle showControls changes without infinite loops', () => {
    const { component } = render(ChartViewer, {
      props: {
        data: mongoPipelineResults,
        showControls: true
      }
    });

    expect(() => {
      component.$set({ showControls: false });
      component.$set({ showControls: true });
    }).not.toThrow();
  });
});

import { describe, it, expect } from 'vitest';
import { 
	detectChartType, 
	transformToChartData, 
	getChartConfig,
	type ChartType 
} from '../chart-data';

describe('chart-data utilities', () => {
	describe('detectChartType', () => {
		it('should detect table type for empty data', () => {
			const data: unknown[] = [];
			expect(detectChartType(data)).toBe('table');
		});

		it('should detect table type for non-object data', () => {
			const data = ['string', 123, true];
			expect(detectChartType(data)).toBe('table');
		});

		it('should detect bar chart for aggregation data', () => {
			const data = [
				{ _id: 'category1', count: 10 },
				{ _id: 'category2', count: 20 }
			];
			expect(detectChartType(data)).toBe('bar');
		});

		it('should detect bar chart for categorical and numeric data', () => {
			const data = [
				{ category: 'A', value: 30 },
				{ category: 'B', value: 70 }
			];
			expect(detectChartType(data)).toBe('bar');
		});

		it('should detect line chart for time series data', () => {
			const data = [
				{ date: '2023-01-01', value: 100 },
				{ date: '2023-01-02', value: 150 }
			];
			expect(detectChartType(data)).toBe('line');
		});

		it('should detect bar chart for categorical and numeric data', () => {
			const data = [
				{ name: 'Product A', sales: 1000 },
				{ name: 'Product B', sales: 1500 }
			];
			expect(detectChartType(data)).toBe('bar');
		});
	});

	describe('transformToChartData', () => {
		it('should transform data to bar chart format', () => {
			const data = [
				{ category: 'A', value: 10 },
				{ category: 'B', value: 20 }
			];
			const result = transformToChartData(data, 'bar');
			
			expect(result).toHaveProperty('labels');
			expect(result).toHaveProperty('datasets');
			expect(result.labels).toEqual(['A', 'B']);
			expect(result.datasets).toHaveLength(1);
			expect(result.datasets[0].data).toEqual([10, 20]);
		});

		it('should transform data to pie chart format', () => {
			const data = [
				{ category: 'A', value: 30 },
				{ category: 'B', value: 70 }
			];
			const result = transformToChartData(data, 'pie');
			
			expect(result).toHaveProperty('labels');
			expect(result).toHaveProperty('datasets');
			expect(result.labels).toEqual(['A', 'B']);
			expect(result.datasets[0].data).toEqual([30, 70]);
		});

		it('should transform data to line chart format', () => {
			const data = [
				{ date: '2023-01-01', value: 100 },
				{ date: '2023-01-02', value: 150 }
			];
			const result = transformToChartData(data, 'line');
			
			expect(result).toHaveProperty('labels');
			expect(result).toHaveProperty('datasets');
			expect(result.labels).toEqual(['2023-01-01', '2023-01-02']);
			expect(result.datasets[0].data).toEqual([100, 150]);
		});

		it('should transform data to table format', () => {
			const data = [
				{ name: 'John', age: 30, city: 'New York' },
				{ name: 'Jane', age: 25, city: 'Boston' }
			];
			const result = transformToChartData(data, 'table');
			
			expect(result).toHaveProperty('columns');
			expect(result).toHaveProperty('rows');
			expect(result.columns).toEqual(['name', 'age', 'city']);
			expect(result.rows).toHaveLength(2);
			expect(result.rows[0]).toEqual(['John', '30', 'New York']);
		});

		it('should handle empty data gracefully', () => {
			const result = transformToChartData([], 'bar');
			
			expect(result).toHaveProperty('labels');
			expect(result).toHaveProperty('datasets');
			expect(result.labels).toEqual([]);
			expect(result.datasets).toEqual([]);
		});

		it('should handle fallback scenarios for bar chart', () => {
			const data = [
				{ value1: 10, value2: 20 },
				{ value1: 15, value2: 25 }
			];
			const result = transformToChartData(data, 'bar');
			
			expect(result).toHaveProperty('labels');
			expect(result).toHaveProperty('datasets');
			expect(result.labels).toHaveLength(2);
			expect(result.datasets).toHaveLength(1); // Fallback creates single dataset
		});
	});

	describe('getChartConfig', () => {
		it('should return bar chart configuration', () => {
			const config = getChartConfig([], 'bar', 'Test Chart');
			
			expect(config.type).toBe('bar');
			expect(config.title).toBe('Test Chart');
			expect(config.xAxisLabel).toBe('Category');
			expect(config.yAxisLabel).toBe('Value');
			expect(config.showLegend).toBe(true);
			expect(config.showGrid).toBe(true);
		});

		it('should return pie chart configuration', () => {
			const config = getChartConfig([], 'pie', 'Test Pie');
			
			expect(config.type).toBe('pie');
			expect(config.title).toBe('Test Pie');
			expect(config.showLegend).toBe(true);
			expect(config.showGrid).toBe(false);
		});

		it('should return line chart configuration', () => {
			const config = getChartConfig([], 'line', 'Test Line');
			
			expect(config.type).toBe('line');
			expect(config.title).toBe('Test Line');
			expect(config.xAxisLabel).toBe('Time');
			expect(config.yAxisLabel).toBe('Value');
			expect(config.showLegend).toBe(true);
			expect(config.showGrid).toBe(true);
		});

		it('should return table configuration', () => {
			const config = getChartConfig([], 'table', 'Test Table');
			
			expect(config.type).toBe('table');
			expect(config.title).toBe('Test Table');
			expect(config.showLegend).toBe(false);
			expect(config.showGrid).toBe(false);
		});

		it('should use default title when not provided', () => {
			const config = getChartConfig([], 'bar');
			
			expect(config.title).toBe('Bar Chart');
		});

		it('should include default colors', () => {
			const config = getChartConfig([], 'bar');
			
			expect(config.colors).toBeDefined();
			expect(Array.isArray(config.colors)).toBe(true);
			expect(config.colors!.length).toBeGreaterThan(0);
		});
	});

	describe('chart type detection edge cases', () => {
		it('should handle data with aggregation fields', () => {
			const data = [
				{ _id: 'cat1', _sum: 100, _avg: 50 },
				{ _id: 'cat2', _sum: 200, _avg: 75 }
			];
			expect(detectChartType(data)).toBe('bar');
		});

		it('should handle data with time fields', () => {
			const data = [
				{ timestamp: '2023-01-01', value: 100 },
				{ timestamp: '2023-01-02', value: 150 }
			];
			expect(detectChartType(data)).toBe('line');
		});

		it('should handle data with createdAt/updatedAt fields', () => {
			const data = [
				{ createdAt: '2023-01-01', count: 10 },
				{ createdAt: '2023-01-02', count: 15 }
			];
			expect(detectChartType(data)).toBe('line');
		});

		it('should fallback to table for complex data', () => {
			const data = [
				{ 
					complex: { nested: { value: 1 } }, 
					array: [1, 2, 3],
					boolean: true 
				}
			];
			expect(detectChartType(data)).toBe('table');
		});
	});
});

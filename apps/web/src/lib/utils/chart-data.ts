export interface ChartData {
	labels: string[];
	datasets: ChartDataset[];
}

export interface ChartDataset {
	label: string;
	data: number[];
	backgroundColor?: string | string[];
	borderColor?: string | string[];
	borderWidth?: number;
}

export interface ChartConfig {
	type: 'bar' | 'pie' | 'line' | 'table';
	title?: string;
	xAxisLabel?: string;
	yAxisLabel?: string;
	colors?: string[];
	showLegend?: boolean;
	showGrid?: boolean;
}

export interface TableData {
	columns: string[];
	rows: (string | number)[][];
}

export type ChartType = 'bar' | 'pie' | 'line' | 'table';

/**
 * Auto-detect chart type based on data structure
 */
export function detectChartType(data: unknown[]): ChartType {
	if (!data || data.length === 0) return 'table';

	const firstItem = data[0];
	if (!firstItem || typeof firstItem !== 'object') return 'table';

	const item = firstItem as Record<string, unknown>;
	const keys = Object.keys(item);

	// Check for aggregation patterns
	const hasAggregation = keys.some(key => 
		key.startsWith('_') || 
		key.includes('sum') || 
		key.includes('avg') || 
		key.includes('count') ||
		key.includes('min') ||
		key.includes('max')
	);

	// Check for time series data
	const hasTimeField = keys.some(key => 
		key.includes('date') || 
		key.includes('time') || 
		key.includes('timestamp') ||
		key === 'createdAt' ||
		key === 'updatedAt'
	);

	// Check for categorical data
	const hasCategoricalData = keys.some(key => {
		const value = item[key];
		return typeof value === 'string' && !hasTimeField;
	});

	// Check for numeric data
	const hasNumericData = keys.some(key => {
		const value = item[key];
		return typeof value === 'number';
	});

	// Decision logic
	if (hasTimeField && hasNumericData) {
		return 'line';
	} else if (hasAggregation && hasCategoricalData) {
		return 'bar';
	} else if (hasAggregation && keys.length <= 3) {
		return 'pie';
	} else if (hasCategoricalData && hasNumericData) {
		return 'bar';
	}

	return 'table';
}

/**
 * Transform MongoDB aggregation results to chart data
 */
export function transformToChartData(
	data: unknown[], 
	chartType: ChartType,
	config?: Partial<ChartConfig>
): ChartData | TableData {
	switch (chartType) {
		case 'bar':
			return transformToBarChart(data, config);
		case 'pie':
			return transformToPieChart(data, config);
		case 'line':
			return transformToLineChart(data, config);
		case 'table':
			return transformToTable(data);
		default:
			return transformToTable(data);
	}
}

/**
 * Transform data for bar chart
 */
function transformToBarChart(data: unknown[], config?: Partial<ChartConfig>): ChartData {
	if (!data || data.length === 0) {
		return { labels: [], datasets: [] };
	}

	const firstItem = data[0] as Record<string, unknown>;
	const keys = Object.keys(firstItem);

	// Find categorical and numeric fields
	const categoricalField = keys.find(key => {
		const value = firstItem[key];
		return typeof value === 'string' && !key.includes('date') && !key.includes('time');
	});

	const numericFields = keys.filter(key => {
		const value = firstItem[key];
		return typeof value === 'number';
	});

	if (!categoricalField || numericFields.length === 0) {
		// Fallback: use first field as labels, second as values
		const labels = data.map((item, index) => `Item ${index + 1}`);
		const values = data.map(item => {
			const obj = item as Record<string, unknown>;
			const firstNumeric = Object.values(obj).find(v => typeof v === 'number');
			return firstNumeric as number || 0;
		});

		return {
			labels,
			datasets: [{
				label: config?.yAxisLabel || 'Value',
				data: values,
				backgroundColor: config?.colors?.[0] || '#3b82f6',
				borderColor: config?.colors?.[0] || '#3b82f6',
				borderWidth: 1
			}]
		};
	}

	const labels = data.map(item => {
		const obj = item as Record<string, unknown>;
		return String(obj[categoricalField] || 'Unknown');
	});

	const datasets = numericFields.map((field, index) => ({
		label: field,
		data: data.map(item => {
			const obj = item as Record<string, unknown>;
			return obj[field] as number || 0;
		}),
		backgroundColor: config?.colors?.[index] || getDefaultColor(index),
		borderColor: config?.colors?.[index] || getDefaultColor(index),
		borderWidth: 1
	}));

	return { labels, datasets };
}

/**
 * Transform data for pie chart
 */
function transformToPieChart(data: unknown[], config?: Partial<ChartConfig>): ChartData {
	if (!data || data.length === 0) {
		return { labels: [], datasets: [] };
	}

	const firstItem = data[0] as Record<string, unknown>;
	const keys = Object.keys(firstItem);

	// Find categorical and numeric fields
	const categoricalField = keys.find(key => {
		const value = firstItem[key];
		return typeof value === 'string';
	});

	const numericField = keys.find(key => {
		const value = firstItem[key];
		return typeof value === 'number';
	});

	if (!categoricalField || !numericField) {
		// Fallback: use first field as labels, second as values
		const labels = data.map((item, index) => `Item ${index + 1}`);
		const values = data.map(item => {
			const obj = item as Record<string, unknown>;
			const firstNumeric = Object.values(obj).find(v => typeof v === 'number');
			return firstNumeric as number || 0;
		});

		return {
			labels,
			datasets: [{
				label: 'Value',
				data: values,
				backgroundColor: generateColors(data.length, config?.colors),
				borderColor: generateColors(data.length, config?.colors),
				borderWidth: 1
			}]
		};
	}

	const labels = data.map(item => {
		const obj = item as Record<string, unknown>;
		return String(obj[categoricalField] || 'Unknown');
	});

	const values = data.map(item => {
		const obj = item as Record<string, unknown>;
		return obj[numericField] as number || 0;
	});

	return {
		labels,
		datasets: [{
			label: numericField,
			data: values,
			backgroundColor: generateColors(data.length, config?.colors),
			borderColor: generateColors(data.length, config?.colors),
			borderWidth: 1
		}]
	};
}

/**
 * Transform data for line chart
 */
function transformToLineChart(data: unknown[], config?: Partial<ChartConfig>): ChartData {
	if (!data || data.length === 0) {
		return { labels: [], datasets: [] };
	}

	const firstItem = data[0] as Record<string, unknown>;
	const keys = Object.keys(firstItem);

	// Find time field and numeric fields
	const timeField = keys.find(key => 
		key.includes('date') || 
		key.includes('time') || 
		key.includes('timestamp') ||
		key === 'createdAt' ||
		key === 'updatedAt'
	);

	const numericFields = keys.filter(key => {
		const value = firstItem[key];
		return typeof value === 'number';
	});

	if (!timeField || numericFields.length === 0) {
		// Fallback: use index as x-axis
		const labels = data.map((_, index) => `Point ${index + 1}`);
		const values = data.map(item => {
			const obj = item as Record<string, unknown>;
			const firstNumeric = Object.values(obj).find(v => typeof v === 'number');
			return firstNumeric as number || 0;
		});

		return {
			labels,
			datasets: [{
				label: config?.yAxisLabel || 'Value',
				data: values,
				backgroundColor: config?.colors?.[0] || '#3b82f6',
				borderColor: config?.colors?.[0] || '#3b82f6',
				borderWidth: 2
			}]
		};
	}

	// Sort by time field
	const sortedData = [...data].sort((a, b) => {
		const aTime = (a as Record<string, unknown>)[timeField];
		const bTime = (b as Record<string, unknown>)[timeField];
		
		if (aTime instanceof Date && bTime instanceof Date) {
			return aTime.getTime() - bTime.getTime();
		}
		
		if (typeof aTime === 'string' && typeof bTime === 'string') {
			return aTime.localeCompare(bTime);
		}
		
		return 0;
	});

	const labels = sortedData.map(item => {
		const obj = item as Record<string, unknown>;
		const timeValue = obj[timeField];
		
		if (timeValue instanceof Date) {
			return timeValue.toLocaleDateString();
		}
		
		return String(timeValue);
	});

	const datasets = numericFields.map((field, index) => ({
		label: field,
		data: sortedData.map(item => {
			const obj = item as Record<string, unknown>;
			return obj[field] as number || 0;
		}),
		backgroundColor: config?.colors?.[index] || getDefaultColor(index),
		borderColor: config?.colors?.[index] || getDefaultColor(index),
		borderWidth: 2
	}));

	return { labels, datasets };
}

/**
 * Transform data for table view
 */
function transformToTable(data: unknown[]): TableData {
	if (!data || data.length === 0) {
		return { columns: [], rows: [] };
	}

	const firstItem = data[0] as Record<string, unknown>;
	const columns = Object.keys(firstItem);

	const rows = data.map(item => {
		const obj = item as Record<string, unknown>;
		return columns.map(column => {
			const value = obj[column];
			if (value === null || value === undefined) return '';
			if (typeof value === 'object') return JSON.stringify(value);
			return String(value);
		});
	});

	return { columns, rows };
}

/**
 * Get default color for dataset
 */
function getDefaultColor(index: number): string {
	const colors = [
		'#3b82f6', // blue
		'#ef4444', // red
		'#10b981', // green
		'#f59e0b', // yellow
		'#8b5cf6', // purple
		'#06b6d4', // cyan
		'#f97316', // orange
		'#84cc16', // lime
		'#ec4899', // pink
		'#6b7280'  // gray
	];
	return colors[index % colors.length];
}

/**
 * Generate colors for pie chart
 */
function generateColors(count: number, customColors?: string[]): string[] {
	if (customColors && customColors.length >= count) {
		return customColors.slice(0, count);
	}

	const colors: string[] = [];
	for (let i = 0; i < count; i++) {
		colors.push(getDefaultColor(i));
	}
	return colors;
}

/**
 * Get chart configuration based on data and type
 */
export function getChartConfig(
	data: unknown[], 
	chartType: ChartType,
	title?: string
): ChartConfig {
	const baseConfig: ChartConfig = {
		type: chartType,
		title: title || `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
		showLegend: true,
		showGrid: true,
		colors: [
			'#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
			'#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6b7280'
		]
	};

	switch (chartType) {
		case 'bar':
			return {
				...baseConfig,
				xAxisLabel: 'Category',
				yAxisLabel: 'Value'
			};
		case 'line':
			return {
				...baseConfig,
				xAxisLabel: 'Time',
				yAxisLabel: 'Value'
			};
		case 'pie':
			return {
				...baseConfig,
				showGrid: false
			};
		case 'table':
			return {
				...baseConfig,
				showLegend: false,
				showGrid: false
			};
		default:
			return baseConfig;
	}
}

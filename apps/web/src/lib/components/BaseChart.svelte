<script lang="ts">
	import type { ChartConfig, ChartData } from '$lib/utils/chart-data';
	import type { EChartsOption } from 'echarts';
	import { onDestroy, onMount } from 'svelte';

	interface Props {
		data: ChartData;
		config: ChartConfig;
		width?: string;
		height?: string;
	}

	const { data, config }: Props = $props();

	let chartContainer: HTMLDivElement;
	let chartInstance: unknown;
	let echarts: unknown;

	onMount(async () => {
		// Dynamically import ECharts
		const echartsModule = await import('echarts');
		echarts = echartsModule;

		if (chartContainer) {
			chartInstance = echarts.init(chartContainer);
			updateChart();
		}
	});

	onDestroy(() => {
		if (chartInstance) {
			chartInstance.dispose();
		}
	});

	// Update chart when data or config changes
	$effect(() => {
		if (chartInstance && data && config) {
			updateChart();
		}
	});

	function updateChart() {
		if (!chartInstance || !data || !config) return;

		const option = generateEChartsOption(data, config);
		chartInstance.setOption(option, true);
	}

	function generateEChartsOption(data: ChartData, config: ChartConfig): EChartsOption {
		const baseOption: EChartsOption = {
			title: {
				text: config.title,
				left: 'center',
				textStyle: {
					color: 'var(--color-text-primary)',
					fontSize: 16
				}
			},
			tooltip: {
				trigger: 'item',
				backgroundColor: 'var(--color-bg-secondary)',
				borderColor: 'var(--glass-border)',
				textStyle: {
					color: 'var(--color-text-primary)'
				}
			},
			legend: {
				show: config.showLegend,
				top: 'bottom',
				textStyle: {
					color: 'var(--color-text-secondary)'
				}
			},
			grid: {
				show: config.showGrid,
				borderColor: 'var(--glass-border)',
				backgroundColor: 'transparent'
			}
		};

		switch (config.type) {
			case 'bar':
				return generateBarChartOption(data, config, baseOption);
			case 'pie':
				return generatePieChartOption(data, config, baseOption);
			case 'line':
				return generateLineChartOption(data, config, baseOption);
			default:
				return baseOption;
		}
	}

	function generateBarChartOption(data: ChartData, config: ChartConfig, baseOption: EChartsOption): EChartsOption {
		return {
			...baseOption,
			xAxis: {
				type: 'category',
				data: data.labels,
				axisLabel: {
					color: 'var(--color-text-secondary)'
				},
				axisLine: {
					lineStyle: {
						color: 'var(--glass-border)'
					}
				},
				name: config.xAxisLabel,
				nameTextStyle: {
					color: 'var(--color-text-secondary)'
				}
			},
			yAxis: {
				type: 'value',
				axisLabel: {
					color: 'var(--color-text-secondary)'
				},
				axisLine: {
					lineStyle: {
						color: 'var(--glass-border)'
					}
				},
				name: config.yAxisLabel,
				nameTextStyle: {
					color: 'var(--color-text-secondary)'
				},
				splitLine: {
					lineStyle: {
						color: 'var(--glass-border)'
					}
				}
			},
			series: data.datasets.map(dataset => ({
				type: 'bar',
				name: dataset.label,
				data: dataset.data,
				itemStyle: {
					color: Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor
				},
				emphasis: {
					itemStyle: {
						shadowBlur: 10,
						shadowOffsetX: 0,
						shadowColor: 'rgba(0, 0, 0, 0.5)'
					}
				}
			}))
		};
	}

	function generatePieChartOption(data: ChartData, _config: ChartConfig, baseOption: EChartsOption): EChartsOption {
		return {
			...baseOption,
			series: [{
				type: 'pie',
				radius: '50%',
				data: data.labels.map((label, index) => ({
					name: label,
					value: data.datasets[0]?.data[index] || 0
				})),
				itemStyle: {
					color: (params: { dataIndex: number }) => {
						const colors = data.datasets[0]?.backgroundColor as string[];
						return colors?.[params.dataIndex] || getDefaultColor(params.dataIndex);
					}
				},
				emphasis: {
					itemStyle: {
						shadowBlur: 10,
						shadowOffsetX: 0,
						shadowColor: 'rgba(0, 0, 0, 0.5)'
					}
				},
				label: {
					show: true,
					formatter: '{b}: {c} ({d}%)',
					color: 'var(--color-text-primary)'
				}
			}]
		};
	}

	function generateLineChartOption(data: ChartData, config: ChartConfig, baseOption: EChartsOption): EChartsOption {
		return {
			...baseOption,
			xAxis: {
				type: 'category',
				data: data.labels,
				axisLabel: {
					color: 'var(--color-text-secondary)'
				},
				axisLine: {
					lineStyle: {
						color: 'var(--glass-border)'
					}
				},
				name: config.xAxisLabel,
				nameTextStyle: {
					color: 'var(--color-text-secondary)'
				}
			},
			yAxis: {
				type: 'value',
				axisLabel: {
					color: 'var(--color-text-secondary)'
				},
				axisLine: {
					lineStyle: {
						color: 'var(--glass-border)'
					}
				},
				name: config.yAxisLabel,
				nameTextStyle: {
					color: 'var(--color-text-secondary)'
				},
				splitLine: {
					lineStyle: {
						color: 'var(--glass-border)'
					}
				}
			},
			series: data.datasets.map(dataset => ({
				type: 'line',
				name: dataset.label,
				data: dataset.data,
				smooth: true,
				lineStyle: {
					color: Array.isArray(dataset.borderColor) ? dataset.borderColor[0] : dataset.borderColor,
					width: 2
				},
				itemStyle: {
					color: Array.isArray(dataset.borderColor) ? dataset.borderColor[0] : dataset.borderColor
				},
				areaStyle: {
					opacity: 0.1,
					color: Array.isArray(dataset.borderColor) ? dataset.borderColor[0] : dataset.borderColor
				}
			}))
		};
	}

	function getDefaultColor(index: number): string {
		const colors = [
			'#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
			'#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6b7280'
		];
		return colors[index % colors.length];
	}

	function _exportChart() {
		if (chartInstance) {
			const dataURL = chartInstance.getDataURL({
				type: 'png',
				pixelRatio: 2,
				backgroundColor: 'transparent'
			});
			
			const link = document.createElement('a');
			link.download = `${config.title || 'chart'}.png`;
			link.href = dataURL;
			link.click();
		}
	}
</script>

<div class="chart-container">
	<div class="chart-header">
		<h4 class="chart-title">{config.title}</h4>
		<button 
			class="btn btn-ghost btn-sm export-btn"
			onclick={exportChart}
			title="Export as PNG"
		>
			📊 Export
		</button>
	</div>
	<div 
		bind:this={chartContainer}
		class="chart-content"
		style="width: {width}; height: {height};"
	></div>
</div>

<style>
	.chart-container {
		display: flex;
		flex-direction: column;
		background: var(--color-bg-secondary);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.chart-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-md);
		border-bottom: 1px solid var(--glass-border);
		background: var(--color-bg-tertiary);
	}

	.chart-title {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0;
	}

	.export-btn {
		font-size: var(--text-xs);
		padding: var(--space-xs) var(--space-sm);
	}

	.chart-content {
		flex: 1;
		min-height: 200px;
	}
</style>

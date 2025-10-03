<script lang="ts">
import {
  detectChartType,
  getChartConfig,
  transformToChartData,
  type ChartConfig,
  type ChartData,
  type ChartType,
  type TableData
} from '$lib/utils/chart-data';
import BaseChart from './BaseChart.svelte';
import ChartSelector from './ChartSelector.svelte';
import DataTable from './DataTable.svelte';

	interface Props {
		data: unknown[];
		title?: string;
		showControls?: boolean;
		width?: string;
		height?: string;
	}

const { 
		data, 
		title = 'Data Visualization',
		showControls = true,
		width = '100%',
		height = '400px'
	}: Props = $props();

// Linter: acknowledge usage in template
const __use = (..._args: unknown[]) => {};
__use(showControls, width, height);

	let selectedChartType = $state<ChartType>('table');
	let chartConfig = $state<ChartConfig>(getChartConfig(data, 'table', title));
// biome-ignore lint/correctness/noUnusedVariables: used in template
let chartData = $state<ChartData | TableData | null>(null);

	// Single effect that only updates chartData, not the other state variables
	$effect(() => {
		if (data && data.length > 0) {
			// Use the current values without modifying them in the effect
			const currentType = selectedChartType;
			const currentConfig = chartConfig;
			
			// Only update chartData, don't modify selectedChartType or chartConfig
			chartData = transformToChartData(data, currentType, currentConfig);
		} else {
			chartData = null;
		}
	});

	// Separate effect for auto-detection when data changes
	$effect(() => {
		if (data && data.length > 0) {
			// Only auto-detect if we're still on the default table type
			if (selectedChartType === 'table') {
				const detectedType = detectChartType(data);
				selectedChartType = detectedType;
				chartConfig = getChartConfig(data, detectedType, title);
			}
		}
	});


// biome-ignore lint/correctness/noUnusedVariables: used in template
function handleTypeChange(type: ChartType) {
		selectedChartType = type;
		chartConfig = getChartConfig(data, type, title);
		// Update chart data immediately
		if (data && data.length > 0) {
			chartData = transformToChartData(data, type, chartConfig);
		}
	}

// biome-ignore lint/correctness/noUnusedVariables: used in template
function handleConfigChange(newConfig: Partial<ChartConfig>) {
		chartConfig = { ...chartConfig, ...newConfig };
		// Update chart data immediately
		if (data && data.length > 0) {
			chartData = transformToChartData(data, selectedChartType, chartConfig);
		}
	}

// biome-ignore lint/correctness/noUnusedVariables: used in template
function resetToAutoDetected() {
		if (data && data.length > 0) {
			const detectedType = detectChartType(data);
			selectedChartType = detectedType;
			chartConfig = getChartConfig(data, detectedType, title);
			// Update chart data immediately
			chartData = transformToChartData(data, detectedType, chartConfig);
		}
	}
</script>

<div class="chart-viewer">
	{#if showControls}
		<div class="chart-controls">
			<div class="controls-header">
				<h3 class="viewer-title">{title}</h3>
				<div class="controls-actions">
					<button
						class="btn btn-ghost btn-sm"
						onclick={resetToAutoDetected}
						title="Reset to auto-detected chart type"
					>
						🔄 Auto-detect
					</button>
				</div>
			</div>
			<ChartSelector
				selectedType={selectedChartType}
				config={chartConfig}
				onTypeChange={handleTypeChange}
				onConfigChange={handleConfigChange}
			/>
		</div>
	{/if}

	<div class="chart-display">
		{#if !data || data.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📊</div>
				<h4 class="empty-title">No Data to Visualize</h4>
				<p class="empty-description">
					Execute a pipeline to see your data visualized here.
				</p>
			</div>
		{:else if chartData}
			{#if selectedChartType === 'table'}
				<DataTable
					data={chartData as TableData}
					title={chartConfig.title}
					maxHeight={height}
					showExport={true}
				/>
			{:else}
				<BaseChart
					data={chartData as ChartData}
					config={chartConfig}
					{width}
					{height}
				/>
			{/if}
		{/if}
	</div>

	{#if data && data.length > 0}
		<div class="chart-info">
			<div class="info-item">
				<span class="info-label">Data Points:</span>
				<span class="info-value">{data.length}</span>
			</div>
			<div class="info-item">
				<span class="info-label">Chart Type:</span>
				<span class="info-value">{selectedChartType.charAt(0).toUpperCase() + selectedChartType.slice(1)}</span>
			</div>
			{#if selectedChartType !== 'table' && chartData && 'labels' in chartData}
				<div class="info-item">
					<span class="info-label">Categories:</span>
					<span class="info-value">{chartData.labels.length}</span>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.chart-viewer {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		background: var(--color-bg-primary);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.chart-controls {
		background: var(--color-bg-secondary);
		border-bottom: 1px solid var(--glass-border);
	}

	.controls-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-lg);
		border-bottom: 1px solid var(--glass-border);
	}

	.viewer-title {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0;
	}

	.controls-actions {
		display: flex;
		gap: var(--space-sm);
	}

	.chart-display {
		flex: 1;
		min-height: 300px;
		display: flex;
		flex-direction: column;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-xl);
		text-align: center;
		color: var(--color-text-tertiary);
		flex: 1;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: var(--space-md);
		opacity: 0.5;
	}

	.empty-title {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--color-text-secondary);
		margin: 0 0 var(--space-sm) 0;
	}

	.empty-description {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
		margin: 0;
		max-width: 400px;
	}

	.chart-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-md) var(--space-lg);
		background: var(--color-bg-tertiary);
		border-top: 1px solid var(--glass-border);
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.info-label {
		font-weight: 500;
		color: var(--color-text-primary);
	}

	.info-value {
		font-weight: 600;
		color: var(--color-primary);
	}

	@media (max-width: 768px) {
		.controls-header {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-sm);
		}

		.chart-info {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>

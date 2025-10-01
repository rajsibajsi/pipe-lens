<script lang="ts">
	import type { ChartType, ChartConfig } from '$lib/utils/chart-data';

	interface Props {
		selectedType: ChartType;
		config: ChartConfig;
		onTypeChange: (type: ChartType) => void;
		onConfigChange: (config: Partial<ChartConfig>) => void;
	}

	const { selectedType, config, onTypeChange, onConfigChange }: Props = $props();

	const chartTypes = [
		{ type: 'bar' as ChartType, label: 'Bar Chart', icon: '📊', description: 'Compare values across categories' },
		{ type: 'pie' as ChartType, label: 'Pie Chart', icon: '🥧', description: 'Show parts of a whole' },
		{ type: 'line' as ChartType, label: 'Line Chart', icon: '📈', description: 'Show trends over time' },
		{ type: 'table' as ChartType, label: 'Data Table', icon: '📋', description: 'View raw data in table format' }
	];

	const showAdvanced = $state(false);

	function handleTypeChange(type: ChartType) {
		onTypeChange(type);
	}

	function handleConfigChange(key: keyof ChartConfig, value: unknown) {
		onConfigChange({ [key]: value });
	}

	const colorPresets = [
		['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
		['#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899'],
		['#6b7280', '#374151', '#1f2937', '#111827', '#000000'],
		['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e']
	];
</script>

<div class="chart-selector">
	<div class="chart-type-selector">
		<h4 class="selector-title">Chart Type</h4>
		<div class="chart-type-grid">
			{#each chartTypes as chartType}
				<button
					class="chart-type-button {selectedType === chartType.type ? 'selected' : ''}"
					onclick={() => handleTypeChange(chartType.type)}
					title={chartType.description}
				>
					<span class="chart-icon">{chartType.icon}</span>
					<span class="chart-label">{chartType.label}</span>
				</button>
			{/each}
		</div>
	</div>

	<div class="chart-config">
		<div class="config-header">
			<h4 class="config-title">Configuration</h4>
			<button
				class="btn btn-ghost btn-sm"
				onclick={() => showAdvanced = !showAdvanced}
			>
				{showAdvanced ? 'Hide' : 'Show'} Advanced
			</button>
		</div>

		<div class="config-basic">
			<div class="config-field">
				<label for="chart-title" class="config-label">Title</label>
				<input
					id="chart-title"
					type="text"
					value={config.title || ''}
					oninput={(e) => handleConfigChange('title', (e.target as HTMLInputElement).value)}
					class="config-input"
					placeholder="Enter chart title"
				/>
			</div>

			{#if selectedType === 'bar' || selectedType === 'line'}
				<div class="config-field">
					<label for="x-axis-label" class="config-label">X-Axis Label</label>
					<input
						id="x-axis-label"
						type="text"
						value={config.xAxisLabel || ''}
						oninput={(e) => handleConfigChange('xAxisLabel', (e.target as HTMLInputElement).value)}
						class="config-input"
						placeholder="Enter X-axis label"
					/>
				</div>

				<div class="config-field">
					<label for="y-axis-label" class="config-label">Y-Axis Label</label>
					<input
						id="y-axis-label"
						type="text"
						value={config.yAxisLabel || ''}
						oninput={(e) => handleConfigChange('yAxisLabel', (e.target as HTMLInputElement).value)}
						class="config-input"
						placeholder="Enter Y-axis label"
					/>
				</div>
			{/if}
		</div>

		{#if showAdvanced}
			<div class="config-advanced">
				<div class="config-field">
					<label class="config-checkbox">
						<input
							type="checkbox"
							checked={config.showLegend ?? true}
							onchange={(e) => handleConfigChange('showLegend', (e.target as HTMLInputElement).checked)}
						/>
						<span>Show Legend</span>
					</label>
				</div>

				{#if selectedType !== 'pie' && selectedType !== 'table'}
					<div class="config-field">
						<label class="config-checkbox">
							<input
								type="checkbox"
								checked={config.showGrid ?? true}
								onchange={(e) => handleConfigChange('showGrid', (e.target as HTMLInputElement).checked)}
							/>
							<span>Show Grid</span>
						</label>
					</div>
				{/if}

				<div class="config-field">
					<label class="config-label">Color Scheme</label>
					<div class="color-presets">
						{#each colorPresets as preset, index}
							<button
								class="color-preset {config.colors?.join(',') === preset.join(',') ? 'selected' : ''}"
								onclick={() => handleConfigChange('colors', preset)}
								title="Color preset {index + 1}"
							>
								{#each preset as color}
									<span 
										class="color-swatch" 
										style="background-color: {color}"
									></span>
								{/each}
							</button>
						{/each}
					</div>
				</div>

				<div class="config-field">
					<label for="custom-colors" class="config-label">Custom Colors</label>
					<input
						id="custom-colors"
						type="text"
						value={config.colors?.join(',') || ''}
						oninput={(e) => {
							const colors = (e.target as HTMLInputElement).value
								.split(',')
								.map(c => c.trim())
								.filter(c => c);
							handleConfigChange('colors', colors);
						}}
						class="config-input"
						placeholder="Enter colors separated by commas (e.g., #ff0000, #00ff00, #0000ff)"
					/>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.chart-selector {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		background: var(--color-bg-secondary);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		padding: var(--space-lg);
	}

	.chart-type-selector {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.selector-title {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0;
	}

	.chart-type-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: var(--space-sm);
	}

	.chart-type-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-md);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-tertiary);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: center;
	}

	.chart-type-button:hover {
		background: var(--color-bg-primary);
		border-color: var(--color-primary);
		color: var(--color-text-primary);
	}

	.chart-type-button.selected {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: white;
	}

	.chart-icon {
		font-size: 1.5rem;
	}

	.chart-label {
		font-size: var(--text-xs);
		font-weight: 500;
	}

	.chart-config {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.config-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.config-title {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0;
	}

	.config-basic {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.config-advanced {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding-top: var(--space-md);
		border-top: 1px solid var(--glass-border);
	}

	.config-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.config-label {
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--color-text-primary);
	}

	.config-input {
		padding: var(--space-xs) var(--space-sm);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-primary);
		color: var(--color-text-primary);
		font-size: var(--text-xs);
	}

	.config-input:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.config-checkbox {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		cursor: pointer;
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
	}

	.config-checkbox input[type="checkbox"] {
		margin: 0;
	}

	.color-presets {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.color-preset {
		display: flex;
		gap: 2px;
		padding: var(--space-xs);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-tertiary);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.color-preset:hover {
		background: var(--color-bg-primary);
		border-color: var(--color-primary);
	}

	.color-preset.selected {
		background: var(--color-primary);
		border-color: var(--color-primary);
	}

	.color-swatch {
		width: 12px;
		height: 12px;
		border-radius: 2px;
		border: 1px solid var(--glass-border);
	}
</style>

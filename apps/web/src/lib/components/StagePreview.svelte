<script lang="ts">
	import type { StageResult } from '$lib/stores/pipeline.store';
	import DocumentViewer from './DocumentViewer.svelte';

	interface Props {
		stages: StageResult[];
		showFieldTypes?: boolean;
		highlightChanges?: boolean;
	}

	let { stages, showFieldTypes = true, highlightChanges = false }: Props = $props();
	let expandedStage = $state<number | null>(null);
	let viewMode = $state<'preview' | 'side-by-side'>('preview');

	function toggleStage(index: number) {
		expandedStage = expandedStage === index ? null : index;
	}

	function formatTime(ms: number): string {
		if (ms < 1000) return `${ms}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	}

	function getPreviousStageDocuments(index: number): unknown[] {
		if (index === 0) return [];
		return stages[index - 1]?.preview || [];
	}
</script>

<div style="padding: var(--space-lg);">
	<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-lg);">
		<h3 style="font-size: var(--text-sm); font-weight: 600; color: var(--color-text-primary); margin: 0;">
			Stage-by-Stage Results
		</h3>
		
		<!-- Navigation Controls -->
		{#if stages.length > 1}
			<div style="display: flex; align-items: center; gap: var(--space-sm);">
				<button
					onclick={() => expandedStage = expandedStage !== null ? Math.max(0, expandedStage - 1) : 0}
					disabled={expandedStage === 0}
					class="btn btn-ghost"
					style="padding: var(--space-xs) var(--space-sm); font-size: var(--text-xs);"
				>
					← Previous Stage
				</button>
				<span style="font-size: var(--text-xs); color: var(--color-text-tertiary);">
					{expandedStage !== null ? `${expandedStage + 1} of ${stages.length}` : 'Select a stage'}
				</span>
				<button
					onclick={() => expandedStage = expandedStage !== null ? Math.min(stages.length - 1, expandedStage + 1) : 0}
					disabled={expandedStage === stages.length - 1}
					class="btn btn-ghost"
					style="padding: var(--space-xs) var(--space-sm); font-size: var(--text-xs);"
				>
					Next Stage →
				</button>
			</div>
		{/if}
	</div>

	{#if stages.length === 0}
		<p style="font-size: var(--text-sm); color: var(--color-text-tertiary);">
			Run pipeline with preview to see stage-by-stage results.
		</p>
	{:else}
		<div style="display: flex; flex-direction: column; gap: var(--space-md);">
			{#each stages as stage, index}
				<div class="card" style="padding: 0; overflow: hidden;">
					<!-- Stage Header -->
					<button
						onclick={() => toggleStage(index)}
						style="width: 100%; padding: var(--space-md) var(--space-lg); display: flex; justify-content: space-between; align-items: center; background: transparent; border: none; cursor: pointer; text-align: left;"
					>
						<div style="flex: 1;">
							<div style="display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-xs);">
								<span
									style="display: inline-flex; width: 1.5rem; height: 1.5rem; background: var(--color-primary); border-radius: 50%; color: var(--color-secondary); font-size: var(--text-xs); font-weight: 600; align-items: center; justify-content: center;"
								>
									{index + 1}
								</span>
								<span style="font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-primary);">
									{Object.keys(stage.stage)[0]}
								</span>
							</div>
							<div style="display: flex; gap: var(--space-lg); font-size: var(--text-xs); color: var(--color-text-tertiary); margin-left: 2rem;">
								<span class="badge badge-info">{stage.count} documents</span>
								<span class="badge badge-success">{formatTime(stage.executionTime)}</span>
							</div>
						</div>
						<svg
							style="width: 1.25rem; height: 1.25rem; color: var(--color-text-tertiary); transform: {expandedStage === index
								? 'rotate(180deg)'
								: 'rotate(0deg)'}; transition: transform var(--transition-base);"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
							></path>
						</svg>
					</button>

					<!-- Stage Content (Expanded) -->
					{#if expandedStage === index}
						<div style="border-top: 1px solid var(--glass-border); padding: var(--space-lg);">
							<!-- Stage Definition -->
							<div style="margin-bottom: var(--space-lg);">
								<div style="font-size: var(--text-xs); font-weight: 600; color: var(--color-text-secondary); margin-bottom: var(--space-sm);">
									Stage Definition
								</div>
								<div class="code-block">
									<pre style="margin: 0; font-size: var(--text-xs); color: var(--color-text-secondary);">{JSON.stringify(stage.stage, null, 2)}</pre>
								</div>
							</div>

							<!-- View Mode Toggle -->
							<div style="display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-md);">
								<span style="font-size: var(--text-xs); font-weight: 600; color: var(--color-text-secondary);">
									View Mode:
								</span>
								<div style="display: flex; background: var(--color-bg-tertiary); border-radius: var(--radius-sm); padding: 2px;">
									<button
										onclick={() => (viewMode = 'preview')}
										class="btn btn-ghost"
										style="padding: var(--space-xs) var(--space-sm); font-size: var(--text-xs); background: {viewMode === 'preview' ? 'var(--color-primary)' : 'transparent'}; color: {viewMode === 'preview' ? 'white' : 'var(--color-text-secondary)'};"
									>
										Preview
									</button>
									<button
										onclick={() => (viewMode = 'side-by-side')}
										class="btn btn-ghost"
										style="padding: var(--space-xs) var(--space-sm); font-size: var(--text-xs); background: {viewMode === 'side-by-side' ? 'var(--color-primary)' : 'transparent'}; color: {viewMode === 'side-by-side' ? 'white' : 'var(--color-text-secondary)'};"
									>
										Side-by-Side
									</button>
								</div>
							</div>

							<!-- Document Viewer -->
							{#if viewMode === 'preview'}
								<DocumentViewer
									documents={stage.preview}
									title="Preview Documents"
									maxHeight="400px"
									showFieldTypes={showFieldTypes}
									highlightChanges={highlightChanges}
									previousDocuments={getPreviousStageDocuments(index)}
								/>
							{:else}
								<div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
									<div>
										<DocumentViewer
											documents={getPreviousStageDocuments(index)}
											title="Before (Previous Stage)"
											maxHeight="400px"
											showFieldTypes={showFieldTypes}
											highlightChanges={false}
										/>
									</div>
									<div>
										<DocumentViewer
											documents={stage.preview}
											title="After (Current Stage)"
											maxHeight="400px"
											showFieldTypes={showFieldTypes}
											highlightChanges={true}
											previousDocuments={getPreviousStageDocuments(index)}
										/>
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
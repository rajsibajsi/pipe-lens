<script lang="ts">
import type { StageResult } from '$lib/stores/pipeline.store';
import { createDiff } from '$lib/utils/diff';
import ChartViewer from './ChartViewer.svelte';
import DiffViewer from './DiffViewer.svelte';
import DocumentViewer from './DocumentViewer.svelte';

const __use = (..._args: unknown[]) => {};
__use(ChartViewer, DiffViewer, DocumentViewer);

interface Props {
	stages: StageResult[];
	showFieldTypes?: boolean;
	highlightChanges?: boolean;
	showDiff?: boolean;
}

const {
	stages,
	showFieldTypes = true,
	highlightChanges = false,
	showDiff = false,
}: Props = $props();
const __useProps = (..._args: unknown[]) => {};
__useProps(showFieldTypes, highlightChanges, showDiff);
let expandedStage = $state<number | null>(null);
let _viewMode = $state<'preview' | 'side-by-side' | 'diff' | 'chart'>('preview');

function _toggleStage(index: number) {
	expandedStage = expandedStage === index ? null : index;
}

function _setViewMode(mode: 'preview' | 'side-by-side' | 'diff' | 'chart') {
	_viewMode = mode;
}

function _formatTime(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

function _getPreviousStageDocuments(index: number): unknown[] {
	if (index === 0) return [];
	return stages[index - 1]?.preview || [];
}

function calculateDiff(stageIndex: number) {
	if (stageIndex === 0) return null;

	const currentStage = stages[stageIndex];
	const previousStage = stages[stageIndex - 1];

	if (!currentStage || !previousStage) return null;

	// Compare the first document from each stage
	const currentDoc = currentStage.preview[0];
	const previousDoc = previousStage.preview[0];

	if (!currentDoc || !previousDoc) return null;

	return createDiff(previousDoc, currentDoc);
}

function _getDiffForStage(stageIndex: number) {
	return calculateDiff(stageIndex);
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
                    onclick={() => _toggleStage(index)}
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
                                        onclick={() => _setViewMode('preview')}
										class="btn btn-ghost"
                                        style="padding: var(--space-xs) var(--space-sm); font-size: var(--text-xs); background: {_viewMode === 'preview' ? 'var(--color-primary)' : 'transparent'}; color: {_viewMode === 'preview' ? 'white' : 'var(--color-text-secondary)'};"
									>
										Preview
									</button>
                                    <button
                                        onclick={() => _setViewMode('side-by-side')}
										class="btn btn-ghost"
                                        style="padding: var(--space-xs) var(--space-sm); font-size: var(--text-xs); background: {_viewMode === 'side-by-side' ? 'var(--color-primary)' : 'transparent'}; color: {_viewMode === 'side-by-side' ? 'white' : 'var(--color-text-secondary)'};"
									>
										Side-by-Side
									</button>
                                    <button
                                        onclick={() => _setViewMode('chart')}
										class="btn btn-ghost"
                                        style="padding: var(--space-xs) var(--space-sm); font-size: var(--text-xs); background: {_viewMode === 'chart' ? 'var(--color-primary)' : 'transparent'}; color: {_viewMode === 'chart' ? 'white' : 'var(--color-text-secondary)'};"
									>
										📊 Chart
									</button>
									{#if showDiff && index > 0}
                                        <button
                                            onclick={() => _setViewMode('diff')}
											class="btn btn-ghost"
                                            style="padding: var(--space-xs) var(--space-sm); font-size: var(--text-xs); background: {_viewMode === 'diff' ? 'var(--color-primary)' : 'transparent'}; color: {_viewMode === 'diff' ? 'white' : 'var(--color-text-secondary)'};"
										>
											Diff
										</button>
									{/if}
								</div>
							</div>

							<!-- Document Viewer -->
                            {#if _viewMode === 'preview'}
								<DocumentViewer
									documents={stage.preview}
									title="Preview Documents"
									maxHeight="400px"
									showFieldTypes={showFieldTypes}
									highlightChanges={highlightChanges}
									previousDocuments={getPreviousStageDocuments(index)}
								/>
                            {:else if _viewMode === 'side-by-side'}
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
                            {:else if _viewMode === 'chart'}
								<ChartViewer
									data={stage.preview}
									title="Stage {index + 1} Data Visualization"
									showControls={true}
									width="100%"
									height="400px"
								/>
                            {:else if _viewMode === 'diff'}
								{#if getDiffForStage(index)}
									<DiffViewer
										diffResult={getDiffForStage(index)!}
										showUnchanged={false}
										filterType="all"
										highlightChanges={true}
									/>
								{:else}
									<div style="text-align: center; color: var(--color-text-tertiary); padding: var(--space-lg);">
										No changes to display (first stage or no previous stage)
									</div>
								{/if}
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
<script lang="ts">
	import type { StageResult } from '$lib/stores/pipeline.store';

	interface Props {
		stages: StageResult[];
	}

	let { stages }: Props = $props();
	let expandedStage = $state<number | null>(null);

	function toggleStage(index: number) {
		expandedStage = expandedStage === index ? null : index;
	}

	function formatTime(ms: number): string {
		if (ms < 1000) return `${ms}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	}
</script>

<div style="padding: 1rem;">
	<h3 style="font-size: 0.875rem; font-weight: 600; color: #f3f4f6; margin-bottom: 1rem;">
		Stage-by-Stage Results
	</h3>

	{#if stages.length === 0}
		<p style="font-size: 0.875rem; color: #9ca3af;">
			Run pipeline with preview to see stage-by-stage results.
		</p>
	{:else}
		<div style="display: flex; flex-direction: column; gap: 0.75rem;">
			{#each stages as stage, index}
				<div
					style="background: #1f2937; border: 1px solid #374151; border-radius: 0.5rem; overflow: hidden;"
				>
					<!-- Stage Header -->
					<button
						onclick={() => toggleStage(index)}
						style="width: 100%; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; background: transparent; border: none; cursor: pointer; text-align: left;"
					>
						<div style="flex: 1;">
							<div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
								<span
									style="display: inline-block; width: 1.5rem; height: 1.5rem; background: #3b82f6; border-radius: 50%; color: white; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; justify-content: center;"
								>
									{index + 1}
								</span>
								<span style="font-family: monospace; font-size: 0.875rem; color: #60a5fa;">
									{Object.keys(stage.stage)[0]}
								</span>
							</div>
							<div style="display: flex; gap: 1rem; font-size: 0.75rem; color: #9ca3af; margin-left: 2rem;">
								<span>{stage.count} documents</span>
								<span>{formatTime(stage.executionTime)}</span>
							</div>
						</div>
						<svg
							style="width: 1.25rem; height: 1.25rem; color: #9ca3af; transform: {expandedStage === index
								? 'rotate(180deg)'
								: 'rotate(0deg)'}; transition: transform 0.2s;"
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
						<div style="border-top: 1px solid #374151; padding: 1rem;">
							<!-- Stage Definition -->
							<div style="margin-bottom: 1rem;">
								<div style="font-size: 0.75rem; font-weight: 600; color: #9ca3af; margin-bottom: 0.5rem;">
									Stage Definition
								</div>
								<pre
									style="background: #111827; padding: 0.75rem; border-radius: 0.375rem; font-family: monospace; font-size: 0.75rem; color: #e5e7eb; overflow-x: auto;">{JSON.stringify(stage.stage, null, 2)}</pre>
							</div>

							<!-- Preview Documents -->
							<div>
								<div style="font-size: 0.75rem; font-weight: 600; color: #9ca3af; margin-bottom: 0.5rem;">
									Preview ({stage.preview.length} of {stage.count} documents)
								</div>
								<pre
									style="background: #111827; padding: 0.75rem; border-radius: 0.375rem; font-family: monospace; font-size: 0.75rem; color: #e5e7eb; overflow-x: auto; max-height: 300px; overflow-y: auto;">{JSON.stringify(
										stage.preview,
										null,
										2
									)}</pre>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
<script lang="ts">
	import SkeletonLoader from './SkeletonLoader.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';

	interface Props {
		stageCount?: number;
		showStages?: boolean;
		message?: string;
	}

	const { 
		stageCount = 3, 
		showStages = false,
		message = 'Executing pipeline...'
	}: Props = $props();
</script>

<div class="pipeline-loading">
	<div class="loading-header">
		<LoadingSpinner size="md" text={message} />
	</div>

	{#if showStages}
		<div class="stages-loading">
			<h4 class="stages-title">Pipeline Stages</h4>
			<div class="stages-list">
				{#each Array(stageCount) as _, i}
					<div class="stage-item">
						<div class="stage-header">
							<SkeletonLoader width={120} height={16} />
							<SkeletonLoader width={60} height={14} />
						</div>
						<div class="stage-content">
							<SkeletonLoader width="100%" height={60} lines={3} />
						</div>
						<div class="stage-footer">
							<SkeletonLoader width={80} height={12} />
							<SkeletonLoader width={100} height={12} />
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="results-loading">
			<div class="loading-content">
				<SkeletonLoader width="100%" height={200} lines={8} />
			</div>
		</div>
	{/if}
</div>

<style>
	.pipeline-loading {
		padding: var(--space-lg);
		background: var(--color-bg-secondary);
		border-radius: var(--radius-md);
		border: 1px solid var(--glass-border);
	}

	.loading-header {
		display: flex;
		justify-content: center;
		margin-bottom: var(--space-lg);
	}

	.stages-loading {
		margin-top: var(--space-lg);
	}

	.stages-title {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-text-secondary);
		margin-bottom: var(--space-md);
	}

	.stages-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.stage-item {
		padding: var(--space-md);
		background: var(--color-bg-primary);
		border-radius: var(--radius-sm);
		border: 1px solid var(--glass-border);
	}

	.stage-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-sm);
	}

	.stage-content {
		margin-bottom: var(--space-sm);
	}

	.stage-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.results-loading {
		margin-top: var(--space-lg);
	}

	.loading-content {
		background: var(--color-bg-primary);
		border-radius: var(--radius-sm);
		padding: var(--space-md);
		border: 1px solid var(--glass-border);
	}
</style>

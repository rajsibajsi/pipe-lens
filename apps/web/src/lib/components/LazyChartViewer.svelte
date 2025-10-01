<script lang="ts">
	import { createLazyComponent } from '$lib/utils/lazy-loading';
	import { onMount } from 'svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';

    interface Props {
        data: unknown[];
		title?: string;
		showControls?: boolean;
		width?: string;
		height?: string;
	}

    const { 
        data,
        title = 'Chart',
        showControls = true,
        width = '100%',
        height = '100%'
    }: Props = $props();
    const __use = (..._args: unknown[]) => {};
    __use(data, title, showControls, width, height);

	// Lazy load ChartViewer component
    const chartLoader = createLazyComponent(
		() => import('./ChartViewer.svelte'),
		LoadingSpinner
	);

	let isVisible = $state(false);
	let observer: IntersectionObserver | null = null;
	let containerElement: HTMLDivElement;

	onMount(() => {
		// Only load when component becomes visible
		observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !isVisible) {
						isVisible = true;
						observer?.disconnect();
					}
				});
			},
			{ rootMargin: '100px' }
		);

		if (containerElement) {
			observer.observe(containerElement);
		}

		return () => {
			observer?.disconnect();
		};
	});
</script>

<div bind:this={containerElement} style="width: {width}; height: {height};">
	{#if !isVisible}
		<div class="lazy-placeholder">
			<LoadingSpinner size="lg" text="Loading chart..." />
		</div>
	{:else if chartLoader.loading}
		<div class="lazy-placeholder">
			<LoadingSpinner size="lg" text="Loading chart..." />
		</div>
	{:else if chartLoader.error}
		<div class="lazy-error">
			<h3>Failed to load chart</h3>
			<p>{chartLoader.error.message}</p>
		</div>
	{:else if chartLoader.component}
		{@const ChartComponent = chartLoader.component}
		<ChartComponent
			{data}
			{title}
			{showControls}
			{width}
			{height}
		/>
	{/if}
</div>

<style>
	.lazy-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		background: var(--color-bg-secondary);
		border-radius: var(--radius-md);
		border: 1px solid var(--glass-border);
	}

	.lazy-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		background: var(--color-bg-secondary);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-error);
		padding: var(--space-lg);
		text-align: center;
	}

	.lazy-error h3 {
		color: var(--color-error);
		margin: 0 0 var(--space-sm) 0;
		font-size: var(--text-lg);
	}

	.lazy-error p {
		color: var(--color-text-secondary);
		margin: 0;
		font-size: var(--text-sm);
	}
</style>

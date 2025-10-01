<script lang="ts">
	interface Props {
		width?: string | number;
		height?: string | number;
		rounded?: boolean;
		className?: string;
		lines?: number;
		animated?: boolean;
	}

	let { 
		width = '100%', 
		height = '1rem', 
		rounded = true, 
		className = '',
		lines = 1,
		animated = true
	}: Props = $props();

	function getWidthStyle() {
		if (typeof width === 'number') {
			return `${width}px`;
		}
		return width;
	}

	function getHeightStyle() {
		if (typeof height === 'number') {
			return `${height}px`;
		}
		return height;
	}
</script>

<div class="skeleton-container {className}">
	{#each Array(lines) as _, i}
		<div 
			class="skeleton-line"
			class:animated={animated}
			class:rounded={rounded}
			style="width: {i === lines - 1 ? '75%' : getWidthStyle()}; height: {getHeightStyle()};"
		></div>
	{/each}
</div>

<style>
	.skeleton-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.skeleton-line {
		background: linear-gradient(
			90deg,
			var(--color-bg-tertiary) 25%,
			var(--color-bg-secondary) 50%,
			var(--color-bg-tertiary) 75%
		);
		background-size: 200% 100%;
		opacity: 0.7;
	}

	.skeleton-line.rounded {
		border-radius: var(--radius-sm);
	}

	.skeleton-line.animated {
		animation: shimmer 1.5s infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}
</style>

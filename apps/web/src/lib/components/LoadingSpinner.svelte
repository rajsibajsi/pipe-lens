<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		color?: string;
		className?: string;
		text?: string;
	}

    // biome-ignore lint/correctness/noUnusedVariables: used in template styles/attrs
    const { 
        size = 'md', 
        color = 'var(--color-primary)', 
        className = '', 
        text = ''
    }: Props = $props();

    // biome-ignore lint/correctness/noUnusedVariables: used in template
    const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-6 h-6',
		lg: 'w-8 h-8'
	};
</script>

<div class="loading-spinner-container {className}">
	<div 
		class="loading-spinner {sizeClasses[size]}"
		style="--spinner-color: {color};"
		aria-label={text || 'Loading...'}
		role="status"
	></div>
	{#if text}
		<span class="loading-text">{text}</span>
	{/if}
</div>

<style>
	.loading-spinner-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
	}

	.loading-spinner {
		border: 2px solid var(--color-bg-tertiary);
		border-top: 2px solid var(--spinner-color);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.loading-text {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		text-align: center;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>

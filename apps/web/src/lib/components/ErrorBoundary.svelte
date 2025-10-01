<script lang="ts">
	import { onMount } from 'svelte';

	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		fallback?: Snippet;
	}

	let { children, fallback }: Props = $props();

	let error = $state<Error | null>(null);
	let hasError = $state(false);

	function handleError(event: ErrorEvent) {
		console.error('ErrorBoundary caught error:', event.error);
		error = event.error || new Error(event.message);
		hasError = true;
	}

	function handleUnhandledRejection(event: PromiseRejectionEvent) {
		console.error('ErrorBoundary caught unhandled promise rejection:', event.reason);
		error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
		hasError = true;
	}

	onMount(() => {
		// Listen for unhandled errors
		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleUnhandledRejection);

		return () => {
			window.removeEventListener('error', handleError);
			window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		};
	});

	function reset() {
		error = null;
		hasError = false;
	}
</script>

{#if hasError}
	<div class="error-boundary">
		<div class="error-content">
			<h3>Something went wrong</h3>
			<p>An error occurred while rendering this component.</p>
			{#if error}
				<details class="error-details">
					<summary>Error Details</summary>
					<pre>{error.message}</pre>
					{#if error.stack}
						<pre class="error-stack">{error.stack}</pre>
					{/if}
				</details>
			{/if}
			<button onclick={reset} class="retry-button">
				Try Again
			</button>
		</div>
	</div>
{:else}
	{@render children()}
{/if}

<style>
	.error-boundary {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		padding: var(--space-lg);
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-error);
		border-radius: var(--radius-md);
	}

	.error-content {
		text-align: center;
		max-width: 500px;
	}

	.error-content h3 {
		color: var(--color-error);
		margin: 0 0 var(--space-sm) 0;
		font-size: var(--text-lg);
	}

	.error-content p {
		color: var(--color-text-secondary);
		margin: 0 0 var(--space-md) 0;
	}

	.error-details {
		text-align: left;
		margin: var(--space-md) 0;
		padding: var(--space-sm);
		background: var(--color-bg-primary);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-sm);
	}

	.error-details summary {
		cursor: pointer;
		font-weight: 600;
		color: var(--color-text-primary);
		margin-bottom: var(--space-xs);
	}

	.error-details pre {
		margin: var(--space-xs) 0;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
		white-space: pre-wrap;
		word-break: break-word;
	}

	.error-stack {
		font-size: 0.75rem;
		opacity: 0.8;
	}

	.retry-button {
		padding: var(--space-sm) var(--space-md);
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: var(--text-sm);
		font-weight: 500;
		transition: background-color 0.2s ease;
	}

	.retry-button:hover {
		background: var(--color-primary-hover);
	}
</style>
<script lang="ts">
import type { Snippet } from 'svelte';
import { onMount } from 'svelte';

interface Props {
	children: Snippet;
	fallback?: Snippet;
	onError?: (error: Error, errorInfo: Record<string, unknown>) => void;
}

const { children, fallback, onError }: Props = $props();
const __use = (..._args: unknown[]) => {};
__use(children, fallback, onError);

let _hasError = $state(false);
let error = $state<Error | null>(null);
let errorInfo = $state<Record<string, unknown> | null>(null);

onMount(() => {
	// Listen for unhandled errors
	const handleError = (event: ErrorEvent) => {
		_hasError = true;
		error = new Error(event.message);
		errorInfo = {
			filename: event.filename,
			lineno: event.lineno,
			colno: event.colno,
		};

		if (onError) {
			onError(error, errorInfo);
		}
	};

	const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
		_hasError = true;
		error = new Error(event.reason?.message || 'Unhandled promise rejection');
		errorInfo = {
			reason: event.reason,
			promise: event.promise,
		};

		if (onError) {
			onError(error, errorInfo);
		}
	};

	window.addEventListener('error', handleError);
	window.addEventListener('unhandledrejection', handleUnhandledRejection);

	return () => {
		window.removeEventListener('error', handleError);
		window.removeEventListener('unhandledrejection', handleUnhandledRejection);
	};
});

function _resetError() {
	_hasError = false;
	error = null;
	errorInfo = null;
}

function _reportError() {
	if (error) {
		// In a real app, you would send this to an error reporting service
		console.error('Error reported:', error, errorInfo);
	}
}
</script>

{#if hasError}
	<div class="error-boundary" role="alert">
		<div class="error-content">
			<div class="error-icon">⚠️</div>
			<div class="error-details">
				<h3 class="error-title">Something went wrong</h3>
				<p class="error-message">
					We're sorry, but something unexpected happened. Please try refreshing the page.
				</p>
				{#if error}
					<details class="error-technical">
						<summary>Technical Details</summary>
						<pre class="error-stack">{error.message}</pre>
						{#if error.stack}
							<pre class="error-stack">{error.stack}</pre>
						{/if}
					</details>
				{/if}
			</div>
		</div>
		<div class="error-actions">
			<button class="btn btn-primary" onclick={resetError}>
				Try Again
			</button>
			<button class="btn btn-secondary" onclick={() => window.location.reload()}>
				Refresh Page
			</button>
			<button class="btn btn-ghost" onclick={reportError}>
				Report Issue
			</button>
		</div>
	</div>
{:else if fallback}
	{@render fallback()}
{:else}
	{@render children()}
{/if}

<style>
	.error-boundary {
		background: var(--color-bg-primary);
		border: 1px solid var(--color-error);
		border-radius: var(--radius-md);
		padding: var(--space-xl);
		margin: var(--space-lg);
		box-shadow: var(--shadow-lg);
	}

	.error-content {
		display: flex;
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
	}

	.error-icon {
		font-size: var(--text-2xl);
		flex-shrink: 0;
	}

	.error-details {
		flex: 1;
	}

	.error-title {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0 0 var(--space-sm) 0;
	}

	.error-message {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		margin: 0 0 var(--space-md) 0;
		line-height: 1.5;
	}

	.error-technical {
		background: var(--color-bg-tertiary);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-sm);
		padding: var(--space-sm);
		margin-top: var(--space-sm);
	}

	.error-technical summary {
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--color-text-secondary);
		cursor: pointer;
		margin-bottom: var(--space-xs);
	}

	.error-stack {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: var(--text-xs);
		color: var(--color-text-error);
		background: var(--color-bg-primary);
		border-radius: var(--radius-sm);
		padding: var(--space-sm);
		margin: var(--space-xs) 0;
		overflow-x: auto;
		white-space: pre-wrap;
	}

	.error-actions {
		display: flex;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}

	@media (max-width: 768px) {
		.error-boundary {
			margin: var(--space-sm);
			padding: var(--space-lg);
		}

		.error-content {
			flex-direction: column;
			text-align: center;
		}

		.error-actions {
			justify-content: center;
		}
	}
</style>
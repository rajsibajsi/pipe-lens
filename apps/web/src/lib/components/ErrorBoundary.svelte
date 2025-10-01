<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		children: unknown;
		fallback?: unknown;
		onError?: (error: Error, errorInfo: unknown) => void;
	}

	let { children, fallback, onError }: Props = $props();
	let hasError = $state(false);
	let error = $state<Error | null>(null);

	onMount(() => {
		// Reset error state when component mounts
		hasError = false;
		error = null;
	});

	function handleError(event: ErrorEvent) {
		hasError = true;
		error = new Error(event.message);
		
		if (onError) {
			onError(error, {
				error: event.error,
				filename: event.filename,
				lineno: event.lineno,
				colno: event.colno,
			});
		}
		
		// Prevent the error from bubbling up
		event.preventDefault();
	}

	function reset() {
		hasError = false;
		error = null;
	}
</script>

<svelte:window on:error={handleError} />

{#if hasError}
	<div class="error-boundary" style="padding: var(--space-lg); text-align: center;">
		<div style="background: var(--color-error-bg, #fef2f2); border: 1px solid var(--color-error-border, #fecaca); border-radius: var(--radius-md); padding: var(--space-lg);">
			<svg style="width: 3rem; height: 3rem; margin: 0 auto var(--space-md); color: var(--color-error, #dc2626);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
			</svg>
			<h3 style="font-size: var(--text-lg); font-weight: 600; color: var(--color-error, #dc2626); margin-bottom: var(--space-sm);">
				Something went wrong
			</h3>
			<p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-md);">
				{error?.message || 'An unexpected error occurred'}
			</p>
			<div style="display: flex; gap: var(--space-sm); justify-content: center;">
				<button
					onclick={reset}
					class="btn btn-primary"
					style="font-size: var(--text-sm);"
				>
					Try Again
				</button>
				<button
					onclick={() => window.location.reload()}
					class="btn btn-secondary"
					style="font-size: var(--text-sm);"
				>
					Reload Page
				</button>
			</div>
		</div>
	</div>
{:else}
	{@render children()}
{/if}

<style>
	.error-boundary {
		/* Error boundary specific styles */
	}
</style>

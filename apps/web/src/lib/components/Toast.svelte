<script lang="ts">
	import { toastStore, type Toast } from '$lib/stores/toast.store';
	import { onMount } from 'svelte';

	interface Props {
		toast: Toast;
	}

	const { toast }: Props = $props();

	let element: HTMLDivElement;
	let isVisible = $state(false);
	let isRemoving = $state(false);

	onMount(() => {
		// Trigger entrance animation
		setTimeout(() => {
			isVisible = true;
		}, 10);
	});

	function handleRemove() {
		isRemoving = true;
		setTimeout(() => {
			toastStore.remove(toast.id);
		}, 300); // Match animation duration
	}

	function handleAction() {
		if (toast.action) {
			toast.action.onClick();
		}
		handleRemove();
	}

	const typeIcons = {
		success: '✓',
		error: '✕',
		warning: '⚠',
		info: 'ℹ'
	};

	const typeColors = {
		success: 'var(--color-success)',
		error: 'var(--color-error)',
		warning: 'var(--color-warning)',
		info: 'var(--color-info)'
	};
</script>

<div
	bind:this={element}
	class="toast"
	class:visible={isVisible}
	class:removing={isRemoving}
	class:success={toast.type === 'success'}
	class:error={toast.type === 'error'}
	class:warning={toast.type === 'warning'}
	class:info={toast.type === 'info'}
	role="alert"
	aria-live="polite"
>
	<div class="toast-content">
		<div class="toast-icon" style="color: {typeColors[toast.type]}">
			{typeIcons[toast.type]}
		</div>
		<div class="toast-body">
			<div class="toast-title">{toast.title}</div>
			{#if toast.message}
				<div class="toast-message">{toast.message}</div>
			{/if}
		</div>
		<div class="toast-actions">
			{#if toast.action}
				<button
					class="toast-action"
					onclick={handleAction}
					aria-label={toast.action.label}
				>
					{toast.action.label}
				</button>
			{/if}
			<button
				class="toast-close"
				onclick={handleRemove}
				aria-label="Close notification"
			>
				×
			</button>
		</div>
	</div>
</div>

<style>
	.toast {
		background: var(--color-bg-primary);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		backdrop-filter: blur(10px);
		opacity: 0;
		transform: translateX(100%);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		margin-bottom: var(--space-sm);
		min-width: 300px;
		max-width: 500px;
		animation: slideIn 0.3s ease-out;
	}

	.toast.visible {
		opacity: 1;
		transform: translateX(0);
	}

	.toast.removing {
		opacity: 0;
		transform: translateX(100%);
	}

	.toast.success {
		border-left: 4px solid var(--color-success);
	}

	.toast.error {
		border-left: 4px solid var(--color-error);
	}

	.toast.warning {
		border-left: 4px solid var(--color-warning);
	}

	.toast.info {
		border-left: 4px solid var(--color-info);
	}

	.toast-content {
		display: flex;
		align-items: flex-start;
		padding: var(--space-md);
		gap: var(--space-sm);
	}

	.toast-icon {
		font-size: var(--text-lg);
		font-weight: bold;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.toast-body {
		flex: 1;
		min-width: 0;
	}

	.toast-title {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-text-primary);
		margin-bottom: var(--space-xs);
	}

	.toast-message {
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
		line-height: 1.4;
	}

	.toast-actions {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		flex-shrink: 0;
	}

	.toast-action {
		background: none;
		border: none;
		color: var(--color-primary);
		font-size: var(--text-xs);
		font-weight: 500;
		cursor: pointer;
		padding: var(--space-xs);
		border-radius: var(--radius-sm);
		transition: background-color 0.2s ease;
	}

	.toast-action:hover {
		background: var(--color-bg-tertiary);
	}

	.toast-close {
		background: none;
		border: none;
		color: var(--color-text-tertiary);
		font-size: var(--text-lg);
		cursor: pointer;
		padding: var(--space-xs);
		border-radius: var(--radius-sm);
		transition: all 0.2s ease;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.toast-close:hover {
		background: var(--color-bg-tertiary);
		color: var(--color-text-primary);
	}
</style>

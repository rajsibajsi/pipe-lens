<script lang="ts">
	import { keyboardShortcuts, type KeyboardShortcut } from '$lib/utils/keyboard-shortcuts';
	import { onMount } from 'svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

const { isOpen, onClose }: Props = $props();

// biome-ignore lint/correctness/noUnusedVariables: isOpen is used in template
// biome-ignore lint/correctness/noUnusedVariables: shortcuts is used in template
let shortcuts = $state<KeyboardShortcut[]>([]);

	onMount(() => {
		shortcuts = keyboardShortcuts.getAllShortcuts();
	});

// biome-ignore lint/correctness/noUnusedVariables: used in template
function getKeyDisplay(shortcut: KeyboardShortcut): string {
		const parts = [];
		if (shortcut.ctrlKey) parts.push('Ctrl');
		if (shortcut.shiftKey) parts.push('Shift');
		if (shortcut.altKey) parts.push('Alt');
		if (shortcut.metaKey) parts.push('Cmd');
		parts.push(shortcut.key.toUpperCase());
		return parts.join(' + ');
	}

// biome-ignore lint/correctness/noUnusedVariables: used as event handler
function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

{#if isOpen}
	<div
		class="shortcuts-overlay"
		onclick={onClose}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="shortcuts-title"
		tabindex="-1"
		onkeypress={onClose}
	>
		<div class="shortcuts-modal" onclick={(e) => e.stopPropagation()} role="presentation">
			<div class="shortcuts-header">
				<h2 id="shortcuts-title">Keyboard Shortcuts</h2>
				<button class="shortcuts-close" onclick={onClose} aria-label="Close">
					×
				</button>
			</div>

			<div class="shortcuts-content">
				{#if shortcuts.length > 0}
					<div class="shortcuts-list">
						{#each shortcuts as shortcut (shortcut.key)}
							<div class="shortcut-item">
								<div class="shortcut-keys">
									{#each getKeyDisplay(shortcut).split(' + ') as key, i}
										<span class="key" class:last={i === getKeyDisplay(shortcut).split(' + ').length - 1}>
											{key}
										</span>
									{/each}
								</div>
								<div class="shortcut-description">
									{shortcut.description}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="no-shortcuts">
						<p>No keyboard shortcuts registered yet.</p>
					</div>
				{/if}
			</div>

			<div class="shortcuts-footer">
				<button class="btn btn-secondary" onclick={onClose}>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.shortcuts-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: var(--space-lg);
	}

	.shortcuts-modal {
		background: var(--color-bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-xl);
		max-width: 600px;
		width: 100%;
		max-height: 80vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.shortcuts-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-lg);
		border-bottom: 1px solid var(--glass-border);
	}


	.shortcuts-close {
		background: none;
		border: none;
		font-size: var(--text-xl);
		color: var(--color-text-secondary);
		cursor: pointer;
		padding: var(--space-xs);
		border-radius: var(--radius-sm);
		transition: all 0.2s ease;
	}

	.shortcuts-close:hover {
		background: var(--color-bg-tertiary);
		color: var(--color-text-primary);
	}

	.shortcuts-content {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-lg);
	}

	.shortcuts-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.shortcut-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-sm);
		background: var(--color-bg-secondary);
		border-radius: var(--radius-sm);
		border: 1px solid var(--glass-border);
	}

	.shortcut-keys {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		flex-shrink: 0;
	}

	.key {
		background: var(--color-bg-tertiary);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xs);
		padding: var(--space-xs) var(--space-sm);
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--color-text-primary);
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	}

	.key.last {
		margin-left: var(--space-xs);
	}

	.shortcut-description {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		margin-left: var(--space-md);
	}

	.no-shortcuts {
		text-align: center;
		padding: var(--space-xl);
		color: var(--color-text-secondary);
	}

	.shortcuts-footer {
		padding: var(--space-lg);
		border-top: 1px solid var(--glass-border);
		display: flex;
		justify-content: flex-end;
	}

	@media (max-width: 768px) {
		.shortcuts-overlay {
			padding: var(--space-sm);
		}

		.shortcut-item {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-xs);
		}

		.shortcut-description {
			margin-left: 0;
		}
	}
</style>

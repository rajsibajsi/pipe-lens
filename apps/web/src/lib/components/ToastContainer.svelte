<script lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in template
import { toastStore } from '$lib/stores/toast.store';
// biome-ignore lint/correctness/noUnusedImports: used in template
import Toast from './Toast.svelte';

// biome-ignore lint/correctness/noUnusedVariables: used in template
const toasts = $derived($toastStore.toasts);
</script>

<div class="toast-container" aria-live="polite" aria-label="Notifications">
	{#each toasts as toast (toast.id)}
		<Toast {toast} />
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		top: var(--space-lg);
		right: var(--space-lg);
		z-index: 1000;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		max-width: 500px;
		pointer-events: none;
	}

	.toast-container :global(.toast) {
		pointer-events: auto;
	}

	@media (max-width: 768px) {
		.toast-container {
			top: var(--space-md);
			right: var(--space-md);
			left: var(--space-md);
			max-width: none;
		}
	}
</style>

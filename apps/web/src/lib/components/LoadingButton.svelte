<script lang="ts">
import type { Snippet } from 'svelte';
import LoadingSpinner from './LoadingSpinner.svelte';

interface Props {
		loading?: boolean;
		disabled?: boolean;
		onclick?: () => void;
		className?: string;
		style?: string;
		variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
		size?: 'sm' | 'md' | 'lg';
		children: Snippet;
	}

const { 
		loading = false,
		disabled = false,
		onclick,
		className = '',
		style = '',
		variant = 'primary',
		size = 'md',
		children
}: Props = $props();

// Linter acknowledge usage
const __use = (..._args: unknown[]) => {};
__use(className, style, variant, size, children);

	const variantClasses = {
		primary: 'btn-primary',
		secondary: 'btn-secondary',
		ghost: 'btn-ghost',
		outline: 'btn-outline'
	};

	const sizeClasses = {
		sm: 'btn-sm',
		md: '',
		lg: 'btn-lg'
	};

function handleClick() {
		if (!loading && !disabled && onclick) {
			onclick();
		}
	}
</script>

<button
	class="btn {variantClasses[variant]} {sizeClasses[size]} {className}"
	class:loading={loading}
	disabled={disabled || loading}
	onclick={handleClick}
	aria-disabled={disabled || loading}
	style={style}
>
	{#if loading}
		<LoadingSpinner size="sm" />
	{/if}
	{@render children()}
</button>

<style>
	.btn.loading {
		opacity: 0.8;
		cursor: not-allowed;
		transition: all 0.2s ease;
	}

	.btn.loading :global(.loading-spinner-container) {
		margin-right: var(--space-xs);
		animation: spin 1s linear infinite;
	}

	.btn {
		transition: all 0.2s ease;
	}

	.btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.btn:active:not(:disabled) {
		transform: translateY(0);
	}
</style>

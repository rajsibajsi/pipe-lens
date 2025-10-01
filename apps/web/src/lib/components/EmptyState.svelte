<script lang="ts">
	interface Props {
		icon?: string;
		title: string;
		description?: string;
		action?: {
			label: string;
			onClick: () => void;
		};
		className?: string;
	}

	const { 
		icon = '📄',
		title,
		description,
		action,
		className = ''
	}: Props = $props();
</script>

<div class="empty-state {className}">
	<div class="empty-icon">{icon}</div>
	<div class="empty-content">
		<h3 class="empty-title">{title}</h3>
		{#if description}
			<p class="empty-description">{description}</p>
		{/if}
		{#if action}
			<button class="btn btn-primary" onclick={action.onClick}>
				{action.label}
			</button>
		{/if}
	</div>
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-2xl);
		text-align: center;
		background: var(--color-bg-secondary);
		border-radius: var(--radius-md);
		border: 1px solid var(--glass-border);
		animation: fadeIn 0.5s ease-out;
		transition: all 0.3s ease;
	}

	.empty-state:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: var(--space-lg);
		opacity: 0.6;
	}

	.empty-content {
		max-width: 400px;
	}

	.empty-title {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0 0 var(--space-sm) 0;
	}

	.empty-description {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		margin: 0 0 var(--space-lg) 0;
		line-height: 1.5;
	}

	@media (max-width: 768px) {
		.empty-state {
			padding: var(--space-xl);
		}

		.empty-icon {
			font-size: 3rem;
		}
	}
</style>

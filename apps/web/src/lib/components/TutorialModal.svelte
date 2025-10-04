<script lang="ts">
import { onMount } from 'svelte';

interface Props {
	isOpen: boolean;
	onClose: () => void;
	onComplete?: () => void;
}

const { isOpen, onClose, onComplete }: Props = $props();
const __use = (..._args: unknown[]) => {};
__use(isOpen);

let currentStep = $state(0);
let _isCompleted = $state(false);

const steps = [
	{
		title: 'Welcome to PipeLens!',
		description: "Let's take a quick tour of the MongoDB aggregation pipeline builder.",
		icon: '👋',
		action: 'Next',
	},
	{
		title: 'Connect to MongoDB',
		description:
			'First, connect to your MongoDB database by clicking the "Connect to MongoDB" button.',
		icon: '🔌',
		action: 'Got it',
	},
	{
		title: 'Select Database & Collection',
		description: 'Choose the database and collection you want to run your pipeline against.',
		icon: '📊',
		action: 'Next',
	},
	{
		title: 'Write Your Pipeline',
		description: 'Use the Monaco editor to write your MongoDB aggregation pipeline in JSON format.',
		icon: '✍️',
		action: 'Next',
	},
	{
		title: 'Run Your Pipeline',
		description:
			'Click "Run Pipeline" or "Run with Preview" to execute your aggregation and see the results.',
		icon: '⚡',
		action: 'Next',
	},
	{
		title: 'Explore Results',
		description:
			'View your results in different formats: raw JSON, charts, or stage-by-stage preview.',
		icon: '📈',
		action: 'Next',
	},
	{
		title: 'Save Your Work',
		description: 'Sign in to save your pipelines and access them later from your personal library.',
		icon: '💾',
		action: 'Next',
	},
	{
		title: "You're All Set!",
		description:
			'You now know the basics of PipeLens. Start building amazing aggregation pipelines!',
		icon: '🎉',
		action: 'Start Building',
	},
];

function nextStep() {
	if (currentStep < steps.length - 1) {
		currentStep++;
	} else {
		completeTutorial();
	}
}

function prevStep() {
	if (currentStep > 0) {
		currentStep--;
	}
}

function completeTutorial() {
	_isCompleted = true;
	if (onComplete) {
		onComplete();
	}
	// Store completion in localStorage
	localStorage.setItem('pipe-lens-tutorial-completed', 'true');
}

function _skipTutorial() {
	onClose();
}

function _handleKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape') {
		onClose();
	} else if (event.key === 'ArrowRight' || event.key === 'Enter') {
		nextStep();
	} else if (event.key === 'ArrowLeft') {
		prevStep();
	}
}

onMount(() => {
	// Check if tutorial was already completed
	const completed = localStorage.getItem('pipe-lens-tutorial-completed');
	if (completed === 'true') {
		onClose();
	}
});
</script>

{#if isOpen}
	<div
		class="tutorial-overlay"
		onclick={onClose}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="tutorial-title"
		tabindex="-1"
		onkeypress={onClose}
	>
		<div class="tutorial-modal" onclick={(e) => e.stopPropagation()} role="presentation">
			{#if !isCompleted}
				<div class="tutorial-header">
					<div class="tutorial-progress">
						<div class="progress-bar">
							<div 
								class="progress-fill" 
								style="width: {((currentStep + 1) / steps.length) * 100}%"
							></div>
						</div>
						<span class="progress-text">
							{currentStep + 1} of {steps.length}
						</span>
					</div>
					<button class="tutorial-close" onclick={onClose} aria-label="Close tutorial">
						×
					</button>
				</div>

				<div class="tutorial-content">
					<div class="tutorial-step">
						<div class="step-icon">{steps[currentStep].icon}</div>
						<h2 id="tutorial-title" class="step-title">{steps[currentStep].title}</h2>
						<p class="step-description">{steps[currentStep].description}</p>
					</div>
				</div>

				<div class="tutorial-footer">
					<div class="tutorial-actions">
						<button
							class="btn btn-ghost"
							onclick={skipTutorial}
						>
							Skip Tutorial
						</button>
						<div class="step-navigation">
							{#if currentStep > 0}
								<button
									class="btn btn-secondary"
									onclick={prevStep}
								>
									Previous
								</button>
							{/if}
							<button
								class="btn btn-primary"
								onclick={nextStep}
							>
								{steps[currentStep].action}
							</button>
						</div>
					</div>
					<div class="tutorial-hint">
						Use ← → arrow keys or Enter to navigate
					</div>
				</div>
			{:else}
				<div class="tutorial-complete">
					<div class="complete-icon">🎉</div>
					<h2 class="complete-title">Tutorial Complete!</h2>
					<p class="complete-description">
						You're ready to start building amazing MongoDB aggregation pipelines with PipeLens.
					</p>
					<button
						class="btn btn-primary"
						onclick={onClose}
					>
						Start Building
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.tutorial-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		padding: var(--space-lg);
	}

	.tutorial-modal {
		background: var(--color-bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-xl);
		max-width: 500px;
		width: 100%;
		max-height: 80vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--glass-border);
	}

	.tutorial-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-lg);
		border-bottom: 1px solid var(--glass-border);
	}

	.tutorial-progress {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		flex: 1;
	}

	.progress-bar {
		flex: 1;
		height: 4px;
		background: var(--color-bg-tertiary);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--color-primary);
		transition: width 0.3s ease;
	}

	.progress-text {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.tutorial-close {
		background: none;
		border: none;
		font-size: var(--text-xl);
		color: var(--color-text-secondary);
		cursor: pointer;
		padding: var(--space-xs);
		border-radius: var(--radius-sm);
		transition: all 0.2s ease;
	}

	.tutorial-close:hover {
		background: var(--color-bg-tertiary);
		color: var(--color-text-primary);
	}

	.tutorial-content {
		flex: 1;
		padding: var(--space-xl);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.tutorial-step {
		text-align: center;
		max-width: 400px;
	}

	.step-icon {
		font-size: 4rem;
		margin-bottom: var(--space-lg);
	}

	.step-title {
		font-size: var(--text-xl);
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0 0 var(--space-md) 0;
	}

	.step-description {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin: 0;
	}

	.tutorial-footer {
		padding: var(--space-lg);
		border-top: 1px solid var(--glass-border);
	}

	.tutorial-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-sm);
	}

	.step-navigation {
		display: flex;
		gap: var(--space-sm);
	}

	.tutorial-hint {
		text-align: center;
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
	}

	.tutorial-complete {
		padding: var(--space-2xl);
		text-align: center;
	}

	.complete-icon {
		font-size: 4rem;
		margin-bottom: var(--space-lg);
	}

	.complete-title {
		font-size: var(--text-xl);
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0 0 var(--space-md) 0;
	}

	.complete-description {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin: 0 0 var(--space-xl) 0;
	}

	@media (max-width: 768px) {
		.tutorial-overlay {
			padding: var(--space-sm);
		}

		.tutorial-actions {
			flex-direction: column;
			gap: var(--space-sm);
		}

		.step-navigation {
			width: 100%;
			justify-content: center;
		}
	}
</style>

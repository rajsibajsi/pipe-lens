<script lang="ts">
	import { userStore } from '$lib/stores/user.store';
	import { onMount } from 'svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		mode?: 'login' | 'register';
	}

	const { isOpen, onClose, mode = 'login' }: Props = $props();

	let currentMode = $state(mode);
	let email = $state('');
	let password = $state('');
	let name = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);
let error = $state('');

	// Reactive state from store
	const authState = $derived($userStore);

	// Reset form when modal opens/closes
	$effect(() => {
		if (isOpen) {
			resetForm();
		}
	});

	// Update current mode when prop changes
	$effect(() => {
		currentMode = mode;
	});

	// Watch for auth state changes
	$effect(() => {
		if (authState.isAuthenticated && isOpen) {
			onClose();
		}
	});

	function resetForm() {
		email = '';
		password = '';
		name = '';
		confirmPassword = '';
		error = '';
		isLoading = false;
	}

function switchMode() {
		currentMode = currentMode === 'login' ? 'register' : 'login';
		resetForm();
	}

	async function handleSubmit() {
		if (isLoading) return;

		// Validation
		if (!email || !password) {
			error = 'Email and password are required';
			return;
		}

		if (currentMode === 'register') {
			if (!name) {
				error = 'Name is required';
				return;
			}
			if (password !== confirmPassword) {
				error = 'Passwords do not match';
				return;
			}
			if (password.length < 8) {
				error = 'Password must be at least 8 characters long';
				return;
			}
		}

		isLoading = true;
		error = '';

        try {
            let result: { success: boolean; error?: string };
			if (currentMode === 'login') {
				result = await userStore.login(email, password);
			} else {
				result = await userStore.register(email, password, name);
			}

			if (result.success) {
				onClose();
			} else {
				error = result.error || 'Authentication failed';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Authentication failed';
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => document.removeEventListener('keydown', handleKeydown);
	});
</script>

{#if isOpen}
	<div
		class="auth-modal-overlay"
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="dialog"
		aria-modal="true"
		aria-labelledby="auth-modal-title"
		tabindex="-1"
	>
		<div class="auth-modal" onclick={(e) => e.stopPropagation()} role="presentation">
			<div class="auth-modal-header">
				<h2 id="auth-modal-title">
					{currentMode === 'login' ? 'Sign In' : 'Create Account'}
				</h2>
				<button class="auth-modal-close" onclick={onClose} aria-label="Close modal">
					×
				</button>
			</div>

			<div class="auth-modal-content">
				{#if error}
					<div class="auth-error" role="alert">
						{error}
					</div>
				{/if}

				<form onsubmit={handleSubmit}>
					{#if currentMode === 'register'}
						<div class="form-group">
							<label for="name">Name</label>
							<input
								id="name"
								type="text"
								bind:value={name}
								placeholder="Enter your name"
								required
								disabled={isLoading}
							/>
						</div>
					{/if}

					<div class="form-group">
						<label for="email">Email</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							placeholder="Enter your email"
							required
							disabled={isLoading}
						/>
					</div>

					<div class="form-group">
						<label for="password">Password</label>
						<input
							id="password"
							type="password"
							bind:value={password}
							placeholder="Enter your password"
							required
							disabled={isLoading}
						/>
					</div>

					{#if currentMode === 'register'}
						<div class="form-group">
							<label for="confirmPassword">Confirm Password</label>
							<input
								id="confirmPassword"
								type="password"
								bind:value={confirmPassword}
								placeholder="Confirm your password"
								required
								disabled={isLoading}
							/>
						</div>
					{/if}

					<button
						type="submit"
						class="auth-submit"
						disabled={isLoading}
					>
						{isLoading ? 'Please wait...' : (currentMode === 'login' ? 'Sign In' : 'Create Account')}
					</button>
				</form>

				<div class="auth-switch">
					<p>
						{currentMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
						<button
							type="button"
							class="auth-switch-button"
							onclick={switchMode}
							disabled={isLoading}
						>
							{currentMode === 'login' ? 'Sign up' : 'Sign in'}
						</button>
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.auth-modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
	}

	.auth-modal {
		background: var(--color-bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-xl);
		width: 100%;
		max-width: 400px;
		margin: var(--space-md);
		max-height: 90vh;
		overflow-y: auto;
	}

	.auth-modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-lg);
		border-bottom: 1px solid var(--glass-border);
	}

	.auth-modal-header h2 {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.auth-modal-close {
		background: none;
		border: none;
		font-size: var(--text-xl);
		color: var(--color-text-secondary);
		cursor: pointer;
		padding: var(--space-xs);
		border-radius: var(--radius-sm);
		transition: all 0.2s ease;
	}

	.auth-modal-close:hover {
		background: var(--color-bg-secondary);
		color: var(--color-text-primary);
	}

	.auth-modal-content {
		padding: var(--space-lg);
	}

	.auth-error {
		background: var(--color-bg-error);
		color: var(--color-text-error);
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		margin-bottom: var(--space-md);
		font-size: var(--text-sm);
	}

	.form-group {
		margin-bottom: var(--space-md);
	}

	.form-group label {
		display: block;
		margin-bottom: var(--space-xs);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--color-text-primary);
	}

	.form-group input {
		width: 100%;
		padding: var(--space-sm);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-secondary);
		color: var(--color-text-primary);
		font-size: var(--text-sm);
		transition: all 0.2s ease;
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
	}

	.form-group input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.auth-submit {
		width: 100%;
		padding: var(--space-sm);
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-bottom: var(--space-md);
	}

	.auth-submit:hover:not(:disabled) {
		background: var(--color-primary-hover);
		transform: translateY(-1px);
	}

	.auth-submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.auth-switch {
		text-align: center;
	}

	.auth-switch p {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
	}

	.auth-switch-button {
		background: none;
		border: none;
		color: var(--color-primary);
		cursor: pointer;
		font-size: var(--text-sm);
		font-weight: 500;
		margin-left: var(--space-xs);
		text-decoration: underline;
		transition: color 0.2s ease;
	}

	.auth-switch-button:hover:not(:disabled) {
		color: var(--color-primary-hover);
	}

	.auth-switch-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>

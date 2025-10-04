<script lang="ts">
/** biome-ignore-all lint/correctness/noUnusedImports: false positives */

import { onMount } from 'svelte';
import { page } from '$app/stores';
import favicon from '$lib/assets/favicon.svg';
import AuthModal from '$lib/components/AuthModal.svelte';
import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
import KeyboardShortcutsHelp from '$lib/components/KeyboardShortcutsHelp.svelte';
import ToastContainer from '$lib/components/ToastContainer.svelte';
import TutorialModal from '$lib/components/TutorialModal.svelte';
import UserProfile from '$lib/components/UserProfile.svelte';
import { userStore } from '$lib/stores/user.store';
import { keyboardShortcuts } from '$lib/utils/keyboard-shortcuts';
import '../app.css';
import '../styles/components.css';
import '../styles/design-system.css';

const { children } = $props();
const __use = (..._args: unknown[]) => {};
__use(children);

// Authentication state
let showAuthModal = $state(false);
let showUserProfile = $state(false);
let _authMode = $state<'login' | 'register'>('login');
let showKeyboardShortcuts = $state(false);
let showTutorial = $state(false);

// Reactive state from store
const _authState = $derived($userStore);

// Initialize user on mount
onMount(() => {
	userStore.getCurrentUser();

	// Register common keyboard shortcuts
	keyboardShortcuts.register({
		key: 'F1',
		action: () => {
			showKeyboardShortcuts = true;
		},
		description: 'Show keyboard shortcuts help',
	});

	keyboardShortcuts.register({
		key: 'Escape',
		action: () => {
			if (showKeyboardShortcuts) showKeyboardShortcuts = false;
			if (showAuthModal) showAuthModal = false;
			if (showUserProfile) showUserProfile = false;
			if (showTutorial) showTutorial = false;
		},
		description: 'Close modals',
	});

	keyboardShortcuts.register({
		key: 'h',
		ctrlKey: true,
		action: () => {
			showTutorial = true;
		},
		description: 'Show tutorial',
	});
});

function _openAuthModal(mode: 'login' | 'register' = 'login') {
	_authMode = mode;
	showAuthModal = true;
}

function _closeAuthModal() {
	showAuthModal = false;
}

function _openUserProfile() {
	showUserProfile = true;
}

function _closeUserProfile() {
	showUserProfile = false;
}

async function _handleLogout() {
	await userStore.logout();
}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

	<div class="app-layout">

		<!-- Navigation Header -->
		{#if $page.url.pathname !== '/builder'}
		<header class="app-header">
		<div class="app-header-content">
			<div class="app-logo">
				<a href="/" class="logo-link">
					<img src={favicon} alt="PipeLens" class="logo-icon" />
					<span class="logo-text">PipeLens</span>
				</a>
			</div>

			<nav class="app-nav">
				<a href="/" class="nav-link">Home</a>
				<a href="/builder" class="nav-link">Builder</a>
				<button
					class="nav-button"
					onclick={() => showTutorial = true}
					title="Show tutorial (Ctrl+H)"
				>
					Help
				</button>
			</nav>

			<div class="app-auth">
				{#if _authState.isLoading}
					<div class="auth-loading">Loading...</div>
				{:else if _authState.isAuthenticated && _authState.user}
					<div class="user-menu">
						<button
							class="user-button"
							onclick={_openUserProfile}
							title="User Profile"
						>
							{#if _authState.user.avatar}
								<img src={_authState.user.avatar} alt="Avatar" class="user-avatar" />
							{:else}
								<div class="user-avatar-placeholder">
									{_authState.user.name.charAt(0).toUpperCase()}
								</div>
							{/if}
							<span class="user-name">{_authState.user.name}</span>
						</button>
						<div class="user-dropdown">
							<button class="dropdown-item" onclick={_openUserProfile}>
								Profile
							</button>
							<button class="dropdown-item" onclick={_handleLogout}>
								Logout
							</button>
						</div>
					</div>
				{:else}
					<div class="auth-buttons">
						<button
							class="auth-button login"
							onclick={() => _openAuthModal('login')}
						>
							Sign In
						</button>
						<button
							class="auth-button register"
							onclick={() => _openAuthModal('register')}
						>
							Sign Up
						</button>
					</div>
				{/if}
			</div>
		</div>
	</header>
		{/if}

	<!-- Main Content -->
	<main id="main-content" class="app-main">
		<ErrorBoundary>
			{@render children()}
		</ErrorBoundary>
	</main>

	<!-- Footer -->
	<footer class="app-footer">
		<div class="app-footer-content">
			<p>&copy; 2024 PipeLens. Built with SvelteKit and MongoDB.</p>
		</div>
	</footer>
</div>

<!-- Authentication Modal -->
<AuthModal
	isOpen={showAuthModal}
	onClose={_closeAuthModal}
	mode={_authMode}
/>

<!-- User Profile Modal -->
<UserProfile
	isOpen={showUserProfile}
	onClose={_closeUserProfile}
/>

<!-- Toast Notifications -->
<ToastContainer />

<!-- Keyboard Shortcuts Help -->
<KeyboardShortcutsHelp
	isOpen={showKeyboardShortcuts}
	onClose={() => showKeyboardShortcuts = false}
/>

<!-- Tutorial Modal -->
<TutorialModal
	isOpen={showTutorial}
	onClose={() => showTutorial = false}
	onComplete={() => showTutorial = false}
/>

<style>
	.app-layout {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: var(--color-bg-primary);
		color: var(--color-text-primary);
	}

	.app-header {
		background: var(--color-bg-secondary);
		border-bottom: 1px solid var(--glass-border);
		backdrop-filter: blur(10px);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.app-header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-md) var(--space-lg);
		max-width: 1200px;
		margin: 0 auto;
	}

	.app-logo {
		display: flex;
		align-items: center;
	}

	.logo-link {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		text-decoration: none;
		color: var(--color-text-primary);
		font-weight: 600;
		font-size: var(--text-lg);
	}

	.logo-icon {
		width: 24px;
		height: 24px;
	}

	.logo-text {
		background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.app-nav {
		display: flex;
		gap: var(--space-lg);
		align-items: center;
	}

	.nav-link {
		color: var(--color-text-secondary);
		text-decoration: none;
		font-weight: 500;
		transition: color 0.2s ease;
	}

	.nav-link:hover {
		color: var(--color-text-primary);
	}

	/* Override global accessibility min-size for compact header links */
	.app-nav .nav-link {
		min-height: 0;
		min-width: 0;
		line-height: 1.2;
		padding: 0;
	}

	.nav-button {
		background: none;
		border: none;
		cursor: pointer;
		font-family: inherit;
		font-size: inherit;
		font-weight: inherit;
		display: flex;
		align-items: center;
		padding: 0;
		color: var(--color-text-secondary);
		text-decoration: none;
		font-weight: 500;
		transition: color 0.2s ease;
	}

	.nav-button:hover {
		color: var(--color-text-primary);
	}

	.app-auth {
		display: flex;
		align-items: center;
	}

	.auth-loading {
		color: var(--color-text-secondary);
		font-size: var(--text-sm);
	}

	.auth-buttons {
		display: flex;
		gap: var(--space-sm);
	}

	.auth-button {
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-primary);
		color: var(--color-text-primary);
		font-size: var(--text-sm);
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.auth-button:hover {
		background: var(--color-bg-tertiary);
		border-color: var(--color-primary);
	}

	.auth-button.register {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.auth-button.register:hover {
		background: var(--color-primary-hover);
	}

	.user-menu {
		position: relative;
	}

	.user-button {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm);
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--color-text-primary);
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.user-button:hover {
		background: var(--color-bg-tertiary);
	}

	.user-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		object-fit: cover;
	}

	.user-avatar-placeholder {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--color-primary);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: var(--text-sm);
	}

	.user-name {
		font-size: var(--text-sm);
		font-weight: 500;
	}

	.user-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		background: var(--color-bg-primary);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-lg);
		min-width: 150px;
		z-index: 200;
		display: none;
	}

	.user-menu:hover .user-dropdown {
		display: block;
	}

	.dropdown-item {
		width: 100%;
		padding: var(--space-sm) var(--space-md);
		background: none;
		border: none;
		color: var(--color-text-primary);
		font-size: var(--text-sm);
		text-align: left;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.dropdown-item:hover {
		background: var(--color-bg-secondary);
	}

	.dropdown-item:first-child {
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
	}

	.dropdown-item:last-child {
		border-radius: 0 0 var(--radius-sm) var(--radius-sm);
	}

	.app-main {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.app-footer {
		background: var(--color-bg-secondary);
		border-top: 1px solid var(--glass-border);
		margin-top: auto;
	}

	.app-footer-content {
		padding: var(--space-lg);
		text-align: center;
		color: var(--color-text-secondary);
		font-size: var(--text-sm);
	}

	@media (max-width: 768px) {
		.app-header-content {
			padding: var(--space-sm) var(--space-md);
		}

		.app-nav {
			display: none;
		}

		.auth-buttons {
			flex-direction: column;
			gap: var(--space-xs);
		}

		.auth-button {
			padding: var(--space-xs) var(--space-sm);
			font-size: var(--text-xs);
		}

		.user-name {
			display: none;
		}
	}
</style>
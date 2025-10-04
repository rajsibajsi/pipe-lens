<script lang="ts">
/** biome-ignore-all lint/correctness/noUnusedVariables: Svelte component with reactive variables that may appear unused but are used in template */

import { onMount } from 'svelte';
import { userStore } from '$lib/stores/user.store';

interface Props {
	isOpen: boolean;
	onClose: () => void;
}

const { isOpen, onClose }: Props = $props();

let activeTab = $state<'profile' | 'password' | 'preferences'>('profile');
let isLoading = $state(false);
let error = $state('');
let success = $state('');

// Profile form
let name = $state('');
let email = $state('');
let avatar = $state('');

// Password form
let currentPassword = $state('');
let newPassword = $state('');
let confirmPassword = $state('');

// Preferences form
let theme = $state<'light' | 'dark' | 'auto'>('auto');
let language = $state('en');
let emailNotifications = $state(true);
let pipelineNotifications = $state(true);

// Reactive state from store
const authState = $derived($userStore);

// Initialize form data when modal opens
$effect(() => {
	if (isOpen && authState.user) {
		initializeForm();
	}
});

function initializeForm() {
	if (!authState.user) return;

	const user = authState.user;
	name = user.name;
	email = user.email;
	avatar = user.avatar || '';
	theme = user.preferences.theme;
	language = user.preferences.language;
	emailNotifications = user.preferences.notifications.email;
	pipelineNotifications = user.preferences.notifications.pipelineUpdates;
}

function resetForms() {
	name = '';
	email = '';
	avatar = '';
	currentPassword = '';
	newPassword = '';
	confirmPassword = '';
	theme = 'auto';
	language = 'en';
	emailNotifications = true;
	pipelineNotifications = true;
	error = '';
	success = '';
}

function switchTab(tab: 'profile' | 'password' | 'preferences') {
	activeTab = tab;
	error = '';
	success = '';
}

async function updateProfile() {
	if (isLoading) return;

	isLoading = true;
	error = '';
	success = '';

	try {
		const result = await userStore.updateProfile({
			name: name.trim(),
			avatar: avatar.trim() || undefined,
			preferences: {
				theme,
				language,
				notifications: {
					email: emailNotifications,
					pipelineUpdates: pipelineNotifications,
				},
			},
		});

		if (result.success) {
			success = 'Profile updated successfully';
		} else {
			error = result.error || 'Profile update failed';
		}
	} catch (err) {
		error = err instanceof Error ? err.message : 'Profile update failed';
	} finally {
		isLoading = false;
	}
}

async function changePassword() {
	if (isLoading) return;

	if (!currentPassword || !newPassword) {
		error = 'Current password and new password are required';
		return;
	}

	if (newPassword.length < 8) {
		error = 'New password must be at least 8 characters long';
		return;
	}

	if (newPassword !== confirmPassword) {
		error = 'New passwords do not match';
		return;
	}

	isLoading = true;
	error = '';
	success = '';

	try {
		const result = await userStore.changePassword(currentPassword, newPassword);

		if (result.success) {
			success = 'Password changed successfully';
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
		} else {
			error = result.error || 'Password change failed';
		}
	} catch (err) {
		error = err instanceof Error ? err.message : 'Password change failed';
	} finally {
		isLoading = false;
	}
}

async function deleteAccount() {
	if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
		return;
	}

	if (
		!confirm(
			'This will permanently delete your account and all your data. Are you absolutely sure?',
		)
	) {
		return;
	}

	isLoading = true;
	error = '';

	try {
		const response = await fetch('/api/auth/account', {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
				'Content-Type': 'application/json',
			},
		});

		if (response.ok) {
			await userStore.logout();
			onClose();
		} else {
			const data = await response.json();
			error = data.message || 'Account deletion failed';
		}
	} catch (err) {
		error = err instanceof Error ? err.message : 'Account deletion failed';
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
		class="profile-modal-overlay"
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="dialog"
		aria-modal="true"
		aria-labelledby="profile-modal-title"
		tabindex="-1"
	>
		<div class="profile-modal" onclick={(e) => e.stopPropagation()} role="presentation">
			<div class="profile-modal-header">
				<h2 id="profile-modal-title">User Profile</h2>
				<button class="profile-modal-close" onclick={onClose} aria-label="Close modal">
					×
				</button>
			</div>

			<div class="profile-modal-content">
				<div class="profile-tabs">
					<button
						class="profile-tab"
						class:active={activeTab === 'profile'}
						onclick={() => switchTab('profile')}
					>
						Profile
					</button>
					<button
						class="profile-tab"
						class:active={activeTab === 'password'}
						onclick={() => switchTab('password')}
					>
						Password
					</button>
					<button
						class="profile-tab"
						class:active={activeTab === 'preferences'}
						onclick={() => switchTab('preferences')}
					>
						Preferences
					</button>
				</div>

				{#if error}
					<div class="profile-error" role="alert">
						{error}
					</div>
				{/if}

				{#if success}
					<div class="profile-success" role="alert">
						{success}
					</div>
				{/if}

				{#if activeTab === 'profile'}
					<div class="profile-form">
						<div class="form-group">
							<label for="profile-name">Name</label>
							<input
								id="profile-name"
								type="text"
								bind:value={name}
								placeholder="Enter your name"
								disabled={isLoading}
							/>
						</div>

						<div class="form-group">
							<label for="profile-email">Email</label>
							<input
								id="profile-email"
								type="email"
								bind:value={email}
								disabled
								title="Email cannot be changed"
							/>
						</div>

						<div class="form-group">
							<label for="profile-avatar">Avatar URL</label>
							<input
								id="profile-avatar"
								type="url"
								bind:value={avatar}
								placeholder="Enter avatar URL (optional)"
								disabled={isLoading}
							/>
						</div>

						<div class="form-group">
							<label for="plan-display">Plan</label>
							<div class="plan-info" id="plan-display">
								<span class="plan-badge plan-{authState.user?.plan || 'free'}">
									{authState.user?.plan || 'free'}
								</span>
								{#if authState.user?.plan === 'free'}
									<button class="upgrade-button" disabled={isLoading}>
										Upgrade
									</button>
								{/if}
							</div>
						</div>

						<button
							class="profile-submit"
							onclick={updateProfile}
							disabled={isLoading}
						>
							{isLoading ? 'Updating...' : 'Update Profile'}
						</button>
					</div>
				{:else if activeTab === 'password'}
					<div class="profile-form">
						<div class="form-group">
							<label for="current-password">Current Password</label>
							<input
								id="current-password"
								type="password"
								bind:value={currentPassword}
								placeholder="Enter current password"
								disabled={isLoading}
							/>
						</div>

						<div class="form-group">
							<label for="new-password">New Password</label>
							<input
								id="new-password"
								type="password"
								bind:value={newPassword}
								placeholder="Enter new password"
								disabled={isLoading}
							/>
						</div>

						<div class="form-group">
							<label for="confirm-password">Confirm New Password</label>
							<input
								id="confirm-password"
								type="password"
								bind:value={confirmPassword}
								placeholder="Confirm new password"
								disabled={isLoading}
							/>
						</div>

						<button
							class="profile-submit"
							onclick={changePassword}
							disabled={isLoading}
						>
							{isLoading ? 'Changing...' : 'Change Password'}
						</button>
					</div>
				{:else if activeTab === 'preferences'}
					<div class="profile-form">
						<div class="form-group">
							<label for="theme">Theme</label>
							<select id="theme" bind:value={theme} disabled={isLoading}>
								<option value="auto">Auto</option>
								<option value="light">Light</option>
								<option value="dark">Dark</option>
							</select>
						</div>

						<div class="form-group">
							<label for="language">Language</label>
							<select id="language" bind:value={language} disabled={isLoading}>
								<option value="en">English</option>
								<option value="es">Spanish</option>
								<option value="fr">French</option>
								<option value="de">German</option>
							</select>
						</div>

						<div class="form-group">
							<label class="checkbox-label">
								<input
									type="checkbox"
									bind:checked={emailNotifications}
									disabled={isLoading}
								/>
								Email notifications
							</label>
						</div>

						<div class="form-group">
							<label class="checkbox-label">
								<input
									type="checkbox"
									bind:checked={pipelineNotifications}
									disabled={isLoading}
								/>
								Pipeline update notifications
							</label>
						</div>

						<button
							class="profile-submit"
							onclick={updateProfile}
							disabled={isLoading}
						>
							{isLoading ? 'Updating...' : 'Update Preferences'}
						</button>
					</div>
				{/if}

				<div class="profile-actions">
					<button
						class="profile-danger"
						onclick={deleteAccount}
						disabled={isLoading}
					>
						Delete Account
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.profile-modal-overlay {
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

	.profile-modal {
		background: var(--color-bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-xl);
		width: 100%;
		max-width: 500px;
		margin: var(--space-md);
		max-height: 90vh;
		overflow-y: auto;
	}

	.profile-modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-lg);
		border-bottom: 1px solid var(--glass-border);
	}

	.profile-modal-header h2 {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.profile-modal-close {
		background: none;
		border: none;
		font-size: var(--text-xl);
		color: var(--color-text-secondary);
		cursor: pointer;
		padding: var(--space-xs);
		border-radius: var(--radius-sm);
		transition: all 0.2s ease;
	}

	.profile-modal-close:hover {
		background: var(--color-bg-secondary);
		color: var(--color-text-primary);
	}

	.profile-modal-content {
		padding: var(--space-lg);
	}

	.profile-tabs {
		display: flex;
		border-bottom: 1px solid var(--glass-border);
		margin-bottom: var(--space-lg);
	}

	.profile-tab {
		background: none;
		border: none;
		padding: var(--space-sm) var(--space-md);
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.2s ease;
	}

	.profile-tab:hover {
		color: var(--color-text-primary);
	}

	.profile-tab.active {
		color: var(--color-primary);
		border-bottom-color: var(--color-primary);
	}

	.profile-error {
		background: var(--color-bg-error);
		color: var(--color-text-error);
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		margin-bottom: var(--space-md);
		font-size: var(--text-sm);
	}

	.profile-success {
		background: var(--color-bg-success);
		color: var(--color-text-success);
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		margin-bottom: var(--space-md);
		font-size: var(--text-sm);
	}

	.profile-form {
		margin-bottom: var(--space-lg);
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

	.form-group input,
	.form-group select {
		width: 100%;
		padding: var(--space-sm);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-secondary);
		color: var(--color-text-primary);
		font-size: var(--text-sm);
		transition: all 0.2s ease;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
	}

	.form-group input:disabled,
	.form-group select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		cursor: pointer;
	}

	.checkbox-label input[type="checkbox"] {
		width: auto;
		margin: 0;
	}

	.plan-info {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.plan-badge {
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		font-weight: 500;
		text-transform: uppercase;
	}

	.plan-free {
		background: var(--color-bg-secondary);
		color: var(--color-text-secondary);
	}

	.plan-pro {
		background: var(--color-bg-info);
		color: var(--color-text-info);
	}

	.plan-enterprise {
		background: var(--color-bg-warning);
		color: var(--color-text-warning);
	}

	.upgrade-button {
		padding: var(--space-xs) var(--space-sm);
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.upgrade-button:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}

	.upgrade-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.profile-submit {
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
	}

	.profile-submit:hover:not(:disabled) {
		background: var(--color-primary-hover);
		transform: translateY(-1px);
	}

	.profile-submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.profile-actions {
		border-top: 1px solid var(--glass-border);
		padding-top: var(--space-md);
	}

	.profile-danger {
		width: 100%;
		padding: var(--space-sm);
		background: var(--color-error);
		color: white;
		border: none;
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.profile-danger:hover:not(:disabled) {
		background: var(--color-error-hover);
		transform: translateY(-1px);
	}

	.profile-danger:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}
</style>

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface User {
	_id: string;
	email: string;
	name: string;
	avatar?: string;
	plan: 'free' | 'pro' | 'enterprise';
	createdAt: string;
	updatedAt: string;
	lastLoginAt?: string;
	isActive: boolean;
	preferences: {
		theme: 'light' | 'dark' | 'auto';
		language: string;
		notifications: {
			email: boolean;
			pipelineUpdates: boolean;
		};
	};
}

export interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
}

const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	isLoading: true,
	error: null,
};

function createUserStore() {
	const { subscribe, set, update } = writable<AuthState>(initialState);

	return {
		subscribe,

		// Set user data
		setUser: (user: User | null) => {
			update((state) => ({
				...state,
				user,
				isAuthenticated: !!user,
				isLoading: false,
				error: null,
			}));
		},

		// Set loading state
		setLoading: (isLoading: boolean) => {
			update((state) => ({ ...state, isLoading }));
		},

		// Set error
		setError: (error: string | null) => {
			update((state) => ({ ...state, error, isLoading: false }));
		},

		// Clear error
		clearError: () => {
			update((state) => ({ ...state, error: null }));
		},

		// Login
		login: async (email: string, password: string) => {
			update((state) => ({ ...state, isLoading: true, error: null }));

			try {
				const response = await fetch('/api/auth/login', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email, password }),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || 'Login failed');
				}

				const { user, accessToken, refreshToken } = data.data;

				// Store tokens in localStorage
				if (browser) {
					localStorage.setItem('accessToken', accessToken);
					localStorage.setItem('refreshToken', refreshToken);
				}

				update((state) => ({
					...state,
					user,
					isAuthenticated: true,
					isLoading: false,
					error: null,
				}));

				return { success: true, user };
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Login failed';
				update((state) => ({
					...state,
					isLoading: false,
					error: errorMessage,
				}));
				return { success: false, error: errorMessage };
			}
		},

		// Register
		register: async (email: string, password: string, name: string) => {
			update((state) => ({ ...state, isLoading: true, error: null }));

			try {
				const response = await fetch('/api/auth/register', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email, password, name }),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || 'Registration failed');
				}

				const { user, accessToken, refreshToken } = data.data;

				// Store tokens in localStorage
				if (browser) {
					localStorage.setItem('accessToken', accessToken);
					localStorage.setItem('refreshToken', refreshToken);
				}

				update((state) => ({
					...state,
					user,
					isAuthenticated: true,
					isLoading: false,
					error: null,
				}));

				return { success: true, user };
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Registration failed';
				update((state) => ({
					...state,
					isLoading: false,
					error: errorMessage,
				}));
				return { success: false, error: errorMessage };
			}
		},

		// Logout
		logout: async () => {
			try {
				const accessToken = browser ? localStorage.getItem('accessToken') : null;

				if (accessToken) {
					await fetch('/api/auth/logout', {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${accessToken}`,
							'Content-Type': 'application/json',
						},
					});
				}
			} catch (error) {
				console.error('Logout error:', error);
			} finally {
				// Clear tokens and user data
				if (browser) {
					localStorage.removeItem('accessToken');
					localStorage.removeItem('refreshToken');
				}

				update((state) => ({
					...state,
					user: null,
					isAuthenticated: false,
					isLoading: false,
					error: null,
				}));
			}
		},

		// Refresh token
		refreshToken: async () => {
			if (!browser) return false;

			const refreshToken = localStorage.getItem('refreshToken');
			if (!refreshToken) return false;

			try {
				const response = await fetch('/api/auth/refresh', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ refreshToken }),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || 'Token refresh failed');
				}

				const { accessToken, refreshToken: newRefreshToken } = data.data;

				// Update tokens
				localStorage.setItem('accessToken', accessToken);
				localStorage.setItem('refreshToken', newRefreshToken);

				return true;
			} catch (error) {
				console.error('Token refresh error:', error);
				// Clear tokens on refresh failure
				localStorage.removeItem('accessToken');
				localStorage.removeItem('refreshToken');
				return false;
			}
		},

		// Get current user
		getCurrentUser: async (): Promise<void> => {
			if (!browser) return;

			const accessToken = localStorage.getItem('accessToken');
			if (!accessToken) {
				update((state) => ({ ...state, isLoading: false }));
				return;
			}

			update((state) => ({ ...state, isLoading: true }));

			try {
				const response = await fetch('/api/auth/me', {
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
				});

				if (response.ok) {
					const data = await response.json();
					update((state) => ({
						...state,
						user: data.data.user,
						isAuthenticated: true,
						isLoading: false,
						error: null,
					}));
				} else if (response.status === 401) {
					// Token expired, try to refresh
					const refreshed = await userStore.refreshToken();
					if (refreshed) {
						// Retry the request
						return userStore.getCurrentUser();
					} else {
						// Refresh failed, clear tokens
						localStorage.removeItem('accessToken');
						localStorage.removeItem('refreshToken');
						update((state) => ({
							...state,
							user: null,
							isAuthenticated: false,
							isLoading: false,
							error: null,
						}));
					}
				} else {
					throw new Error('Failed to get user data');
				}
			} catch (error) {
				console.error('Get current user error:', error);
				update((state) => ({
					...state,
					user: null,
					isAuthenticated: false,
					isLoading: false,
					error: null,
				}));
			}
		},

		// Update user profile
		updateProfile: async (updateData: Partial<User>) => {
			if (!browser) return { success: false, error: 'Not in browser' };

			const accessToken = localStorage.getItem('accessToken');
			if (!accessToken) return { success: false, error: 'Not authenticated' };

			update((state) => ({ ...state, isLoading: true, error: null }));

			try {
				const response = await fetch('/api/auth/profile', {
					method: 'PUT',
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(updateData),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || 'Profile update failed');
				}

				update((state) => ({
					...state,
					user: data.data.user,
					isLoading: false,
					error: null,
				}));

				return { success: true, user: data.data.user };
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
				update((state) => ({
					...state,
					isLoading: false,
					error: errorMessage,
				}));
				return { success: false, error: errorMessage };
			}
		},

		// Change password
		changePassword: async (currentPassword: string, newPassword: string) => {
			if (!browser) return { success: false, error: 'Not in browser' };

			const accessToken = localStorage.getItem('accessToken');
			if (!accessToken) return { success: false, error: 'Not authenticated' };

			update((state) => ({ ...state, isLoading: true, error: null }));

			try {
				const response = await fetch('/api/auth/change-password', {
					method: 'PUT',
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ currentPassword, newPassword }),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || 'Password change failed');
				}

				update((state) => ({ ...state, isLoading: false, error: null }));

				return { success: true };
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Password change failed';
				update((state) => ({
					...state,
					isLoading: false,
					error: errorMessage,
				}));
				return { success: false, error: errorMessage };
			}
		},

		// Reset to initial state
		reset: () => set(initialState),
	};
}

export const userStore = createUserStore();

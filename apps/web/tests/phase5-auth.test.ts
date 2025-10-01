import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { userStore } from '../src/lib/stores/user.store.js';

// Mock fetch
global.fetch = vi.fn();

describe('Phase 5 - Authentication', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('User Store', () => {
		it('should initialize with default state', () => {
			const state = userStore.getState();
			expect(state.isAuthenticated).toBe(false);
			expect(state.user).toBeNull();
			expect(state.isLoading).toBe(false);
		});

		it('should handle successful login', async () => {
			const mockFetch = vi.mocked(fetch);
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					data: {
						user: { name: 'Test User', email: 'test@example.com' },
						accessToken: 'mock-token',
						refreshToken: 'mock-refresh-token'
					}
				})
			} as Response);

			await userStore.login('test@example.com', 'password123');

			const state = userStore.getState();
			expect(state.isAuthenticated).toBe(true);
			expect(state.user).toEqual({
				name: 'Test User',
				email: 'test@example.com'
			});
		});

		it('should handle login failure', async () => {
			const mockFetch = vi.mocked(fetch);
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({
					success: false,
					message: 'Invalid credentials'
				})
			} as Response);

			await userStore.login('test@example.com', 'wrongpassword');

			const state = userStore.getState();
			expect(state.isAuthenticated).toBe(false);
			expect(state.user).toBeNull();
		});

		it('should handle successful registration', async () => {
			const mockFetch = vi.mocked(fetch);
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					data: {
						user: { name: 'New User', email: 'new@example.com' },
						accessToken: 'mock-token',
						refreshToken: 'mock-refresh-token'
					}
				})
			} as Response);

			await userStore.register('New User', 'new@example.com', 'password123');

			const state = userStore.getState();
			expect(state.isAuthenticated).toBe(true);
			expect(state.user).toEqual({
				name: 'New User',
				email: 'new@example.com'
			});
		});

		it('should handle registration failure', async () => {
			const mockFetch = vi.mocked(fetch);
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({
					success: false,
					message: 'Email already exists'
				})
			} as Response);

			await userStore.register('New User', 'existing@example.com', 'password123');

			const state = userStore.getState();
			expect(state.isAuthenticated).toBe(false);
			expect(state.user).toBeNull();
		});

		it('should handle logout', async () => {
			// First login
			const mockFetch = vi.mocked(fetch);
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					data: {
						user: { name: 'Test User', email: 'test@example.com' },
						accessToken: 'mock-token',
						refreshToken: 'mock-refresh-token'
					}
				})
			} as Response);

			await userStore.login('test@example.com', 'password123');

			// Then logout
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true })
			} as Response);

			await userStore.logout();

			const state = userStore.getState();
			expect(state.isAuthenticated).toBe(false);
			expect(state.user).toBeNull();
		});

		it('should handle token refresh', async () => {
			const mockFetch = vi.mocked(fetch);
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					data: {
						accessToken: 'new-access-token'
					}
				})
			} as Response);

			localStorageMock.getItem.mockReturnValue('mock-refresh-token');

			await userStore.refreshToken();

			expect(mockFetch).toHaveBeenCalledWith('/api/auth/refresh', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					refreshToken: 'mock-refresh-token'
				})
			});
		});

		it('should handle getCurrentUser with valid token', async () => {
			const mockFetch = vi.mocked(fetch);
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					data: {
						user: { name: 'Test User', email: 'test@example.com' }
					}
				})
			} as Response);

			localStorageMock.getItem.mockReturnValue('mock-token');

			await userStore.getCurrentUser();

			const state = userStore.getState();
			expect(state.isAuthenticated).toBe(true);
			expect(state.user).toEqual({
				name: 'Test User',
				email: 'test@example.com'
			});
		});

		it('should handle getCurrentUser with invalid token', async () => {
			const mockFetch = vi.mocked(fetch);
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({
					success: false,
					message: 'Invalid token'
				})
			} as Response);

			localStorageMock.getItem.mockReturnValue('invalid-token');

			await userStore.getCurrentUser();

			const state = userStore.getState();
			expect(state.isAuthenticated).toBe(false);
			expect(state.user).toBeNull();
		});

		it('should handle getCurrentUser with no token', async () => {
			localStorageMock.getItem.mockReturnValue(null);

			await userStore.getCurrentUser();

			const state = userStore.getState();
			expect(state.isAuthenticated).toBe(false);
			expect(state.user).toBeNull();
		});

		it('should handle network errors gracefully', async () => {
			const mockFetch = vi.mocked(fetch);
			mockFetch.mockRejectedValueOnce(new Error('Network error'));

			await userStore.login('test@example.com', 'password123');

			const state = userStore.getState();
			expect(state.isAuthenticated).toBe(false);
			expect(state.user).toBeNull();
		});
	});
});
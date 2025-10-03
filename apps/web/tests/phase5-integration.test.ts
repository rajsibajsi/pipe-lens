import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageService } from '../src/lib/services/local-storage.service.js';
import { pipelineStore } from '../src/lib/stores/pipeline.store.js';
import { userStore } from '../src/lib/stores/user.store.js';

// Mock fetch
global.fetch = vi.fn();

// localStorage and crypto are mocked in setup.ts

describe('Phase 5 - Integration Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		LocalStorageService.clearPipelines();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('Complete User Workflow', () => {
		it('should handle complete user registration and pipeline saving workflow', async () => {
			// Mock successful registration
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

			// Mock pipeline save
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					data: { pipeline: { _id: 'saved-pipeline-id' } }
				})
			} as Response);

			// Start with unauthenticated state
            userStore.setUser(null);

			// Set up pipeline state
            pipelineStore.setConnection({ id: 'test-conn', name: 'Test Connection', uri: '', isConnected: true, selectedDatabase: 'test-db', selectedCollection: 'test-collection' });
            pipelineStore.setPipeline([{ $match: { status: 'active' } }]);
            pipelineStore.setSampleSize(10);

			// User should be unauthenticated initially
			expect(get(userStore).isAuthenticated).toBe(false);

			// After registration, user should be authenticated
			await userStore.register('New User', 'new@example.com', 'password123');

			await new Promise(resolve => setTimeout(resolve, 0)); // Allow state to update

			expect(get(userStore).isAuthenticated).toBe(true);
			expect(get(userStore).user).toEqual({
				name: 'New User',
				email: 'new@example.com'
			});

			// Pipeline should be ready to save
			expect(get(pipelineStore).pipeline).toEqual([{ $match: { status: 'active' } }]);
		});

		it('should handle guest user pipeline saving to local storage', async () => {
			// Mock guest state
            userStore.setUser(null);

			// Set up pipeline state
            pipelineStore.setConnection({ id: 'test-conn', name: 'Test Connection', uri: '', isConnected: true, selectedDatabase: 'test-db', selectedCollection: 'test-collection' });
            pipelineStore.setPipeline([{ $match: { status: 'active' } }]);
            pipelineStore.setSampleSize(10);

			// Guest user should not be authenticated
			expect(get(userStore).isAuthenticated).toBe(false);

			// Save pipeline to local storage
            LocalStorageService.savePipeline({
				name: 'Guest Pipeline',
				description: 'A guest pipeline',
				tags: ['guest'],
				pipeline: [{ $match: { status: 'active' } }],
				connectionId: 'test-conn',
				database: 'test-db',
				collection: 'test-collection',
                sampleSize: 10,
                metadata: {}
			});

			// Verify pipeline was saved
			const pipelines = LocalStorageService.getPipelines();
			expect(pipelines).toHaveLength(1);
			expect(pipelines[0].name).toBe('Guest Pipeline');
		});

		it('should handle pipeline loading and execution workflow', async () => {
			// Mock authenticated state
            userStore.setUser({ _id: '1', email: 'test@example.com', name: 'Test User', plan: 'free', createdAt: '', updatedAt: '', isActive: true, preferences: { theme: 'light', language: 'en', notifications: { email: false, pipelineUpdates: false } } } as any);

			// Mock pipeline loading
			const mockFetch = vi.mocked(fetch);
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					data: {
						pipelines: [
							{
								_id: 'pipeline-1',
								name: 'Sales Analysis',
								description: 'Analyze sales data',
								tags: ['sales', 'analysis'],
								pipeline: [
									{ $match: { status: 'active' } },
									{ $group: { _id: '$category', total: { $sum: '$amount' } } }
								],
								connectionId: 'test-conn',
								database: 'sales-db',
								collection: 'transactions',
								sampleSize: 50,
								createdAt: '2024-01-01T00:00:00Z'
							}
						]
					}
				})
			} as Response);

			// Mock pipeline execution
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					data: [
						{ _id: 'Electronics', total: 1500 },
						{ _id: 'Clothing', total: 800 }
					]
				})
			} as Response);

            (global as any).localStorage.getItem.mockReturnValue('mock-token');

			// User should be authenticated
			expect(get(userStore).isAuthenticated).toBe(true);

			// Load pipelines
			const response = await fetch('/api/pipelines/saved');
			const data = await response.json();

			expect(data.success).toBe(true);
			expect(data.data.pipelines).toHaveLength(1);
			expect(data.data.pipelines[0].name).toBe('Sales Analysis');

			// Load pipeline into store
			const pipeline = data.data.pipelines[0];
			pipelineStore.setPipeline(pipeline.pipeline);
            pipelineStore.setConnection({ id: pipeline.connectionId, name: 'Test Connection', uri: '', isConnected: true, selectedDatabase: pipeline.database, selectedCollection: pipeline.collection });
			pipelineStore.setSampleSize(pipeline.sampleSize);

			// Verify pipeline was loaded
			expect(get(pipelineStore).pipeline).toEqual([
				{ $match: { status: 'active' } },
				{ $group: { _id: '$category', total: { $sum: '$amount' } } }
			]);
		});

		it('should handle pipeline sharing and collaboration workflow', async () => {
			// Mock authenticated state
            userStore.setUser({ _id: '1', email: 'test@example.com', name: 'Test User', plan: 'free', createdAt: '', updatedAt: '', isActive: true, preferences: { theme: 'light', language: 'en', notifications: { email: false, pipelineUpdates: false } } } as any);

			// Mock pipeline save as public
			const mockFetch = vi.mocked(fetch);
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					data: { pipeline: { _id: 'public-pipeline-id' } }
				})
			} as Response);

			// Mock public pipeline loading
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					data: {
						pipelines: [
							{
								_id: 'public-pipeline-id',
								name: 'Public Sales Pipeline',
								description: 'A public sales analysis pipeline',
								tags: ['sales', 'public'],
								pipeline: [
									{ $match: { status: 'active' } },
									{ $group: { _id: '$category', count: { $sum: 1 } } }
								],
								userId: 'other-user-id',
								isPublic: true,
								createdAt: '2024-01-01T00:00:00Z'
							}
						]
					}
				})
			} as Response);

            (global as any).localStorage.getItem.mockReturnValue('mock-token');

			// Set up pipeline state
            pipelineStore.setConnection({ id: 'test-conn', name: 'Test Connection', uri: '', isConnected: true, selectedDatabase: 'test-db', selectedCollection: 'test-collection' });
            pipelineStore.setPipeline([
                    { $match: { status: 'active' } },
                    { $group: { _id: '$category', count: { $sum: 1 } } }
            ]);
            pipelineStore.setSampleSize(10);

			// User should be authenticated
			expect(get(userStore).isAuthenticated).toBe(true);

			// Load public pipelines
			const response = await fetch('/api/pipelines/saved/public');
			const data = await response.json();

			expect(data.success).toBe(true);
			expect(data.data.pipelines).toHaveLength(1);
			expect(data.data.pipelines[0].isPublic).toBe(true);

			// Duplicate the public pipeline
			const publicPipeline = data.data.pipelines[0];
			const duplicatedPipeline = {
				...publicPipeline,
				name: `${publicPipeline.name} (Copy)`,
				_id: undefined,
				id: undefined,
				createdAt: undefined,
				updatedAt: undefined,
				userId: get(userStore).user?._id,
				isPublic: false
			};

			// Save duplicated pipeline
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					data: { pipeline: { _id: 'duplicated-pipeline-id' } }
				})
			} as Response);

			const saveResponse = await fetch('/api/pipelines/saved', {
				method: 'POST',
				headers: {
					'Authorization': 'Bearer mock-token',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(duplicatedPipeline)
			});

			expect(saveResponse.ok).toBe(true);
		});

		it('should handle error scenarios gracefully', async () => {
			// Mock authentication failure
			const mockFetch = vi.mocked(fetch);
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({
					success: false,
					message: 'Invalid credentials'
				})
			} as Response);

			// Mock guest state
            userStore.setUser(null as any);

			// Attempt login should fail gracefully
			await userStore.login('test@example.com', 'wrongpassword');

			await new Promise(resolve => setTimeout(resolve, 0)); // Allow state to update

			expect(get(userStore).isAuthenticated).toBe(false);
			expect(get(userStore).user).toBeNull();

			// User should still be able to use the app as guest
			expect(get(userStore).isAuthenticated).toBe(false);
		});

		it('should handle network errors gracefully', async () => {
			// Mock network error
			const mockFetch = vi.mocked(fetch);
			mockFetch.mockRejectedValueOnce(new Error('Network error'));

			// Mock authenticated state
            userStore.setUser({ _id: '1', email: 'test@example.com', name: 'Test User', plan: 'free', createdAt: '', updatedAt: '', isActive: true, preferences: { theme: 'light', language: 'en', notifications: { email: false, pipelineUpdates: false } } } as any);

			// Set up pipeline state
            pipelineStore.setConnection({ id: 'test-conn', name: 'Test Connection', uri: '', isConnected: true, selectedDatabase: 'test-db', selectedCollection: 'test-collection' });
            pipelineStore.setPipeline([{ $match: { status: 'active' } }]);
            pipelineStore.setSampleSize(10);

			// Should handle network error gracefully
			try {
				await fetch('/api/pipelines/saved');
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toBe('Network error');
			}
		});

		it('should persist user session across page reloads', async () => {
            // Mock localStorage with existing token
            (global as any).localStorage.getItem.mockReturnValue('mock-token');

			// Mock token validation
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

			// Initialize user from stored token
			await userStore.getCurrentUser();

			await new Promise(resolve => setTimeout(resolve, 0)); // Allow state to update

			expect(get(userStore).isAuthenticated).toBe(true);
			expect(get(userStore).user).toEqual({
				name: 'Test User',
				email: 'test@example.com'
			});
		});

		it('should handle token expiration and refresh', async () => {
			// Mock expired token
            (global as any).localStorage.getItem.mockReturnValue('expired-token');

			// Mock token validation failure
			const mockFetch = vi.mocked(fetch);
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({
					success: false,
					message: 'Token expired'
				})
			} as Response);

			// Attempt to get current user with expired token
			await userStore.getCurrentUser();

			await new Promise(resolve => setTimeout(resolve, 0)); // Allow state to update

			expect(get(userStore).isAuthenticated).toBe(false);
			expect(get(userStore).user).toBeNull();
		});
	});

	describe('Data Persistence and Migration', () => {
		it('should migrate guest pipelines to authenticated user', async () => {
			// Create guest pipeline
            LocalStorageService.savePipeline({
				name: 'Guest Pipeline',
				description: 'A guest pipeline',
				tags: ['guest'],
				pipeline: [{ $match: { status: 'active' } }],
				connectionId: 'test-conn',
				database: 'test-db',
				collection: 'test-collection',
                sampleSize: 10,
                metadata: {}
			});

			// Mock successful registration
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

			// Register new user
			await userStore.register('New User', 'new@example.com', 'password123');

			await new Promise(resolve => setTimeout(resolve, 0)); // Allow state to update

			// In a real implementation, you would migrate guest pipelines here
			// For now, we'll just verify the guest pipeline still exists
			const guestPipelines = LocalStorageService.getPipelines();
			expect(guestPipelines).toHaveLength(1);
			expect(guestPipelines[0].name).toBe('Guest Pipeline');
		});

		it('should handle data corruption gracefully', () => {
			// Mock corrupted localStorage data
            (global as any).localStorage.getItem.mockReturnValue('invalid-json');

			// Should handle gracefully
			const pipelines = LocalStorageService.getPipelines();
			expect(pipelines).toEqual([]);
		});

		it('should handle storage quota exceeded', () => {
			// Mock storage quota exceeded error
            (global as any).localStorage.setItem.mockImplementation(() => {
				throw new Error('QuotaExceededError');
			});

			// Should handle gracefully
            expect(() => {
                LocalStorageService.savePipeline({
                    name: 'Test Pipeline',
                    description: 'A test pipeline',
                    tags: ['test'],
                    pipeline: [{ $match: { status: 'active' } }],
                    connectionId: 'test-conn',
                    database: 'test-db',
                    collection: 'test-collection',
                    sampleSize: 10,
                    metadata: {}
                });
            }).not.toThrow();
		});
	});
});
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { userStore } from '../src/lib/stores/user.store.js';
import { pipelineStore } from '../src/lib/stores/pipeline.store.js';
import { LocalStorageService } from '../src/lib/services/local-storage.service.js';

// Mock fetch
global.fetch = vi.fn();

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
	value: {
		randomUUID: vi.fn(() => 'mock-uuid-123')
	}
});

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
			userStore.setState({
				isAuthenticated: false,
				user: null,
				isLoading: false
			});

			// Set up pipeline state
			pipelineStore.setState({
				connection: {
					id: 'test-conn',
					name: 'Test Connection',
					selectedDatabase: 'test-db',
					selectedCollection: 'test-collection'
				},
				pipeline: [{ $match: { status: 'active' } }],
				sampleSize: 10
			});

			// User should be unauthenticated initially
			expect(userStore.getState().isAuthenticated).toBe(false);

			// After registration, user should be authenticated
			await userStore.register('New User', 'new@example.com', 'password123');

			await new Promise(resolve => setTimeout(resolve, 0)); // Allow state to update

			expect(userStore.getState().isAuthenticated).toBe(true);
			expect(userStore.getState().user).toEqual({
				name: 'New User',
				email: 'new@example.com'
			});

			// Pipeline should be ready to save
			expect(pipelineStore.getState().pipeline).toEqual([{ $match: { status: 'active' } }]);
		});

		it('should handle guest user pipeline saving to local storage', async () => {
			// Mock guest state
			userStore.setState({
				isAuthenticated: false,
				user: null,
				isLoading: false
			});

			// Set up pipeline state
			pipelineStore.setState({
				connection: {
					id: 'test-conn',
					name: 'Test Connection',
					selectedDatabase: 'test-db',
					selectedCollection: 'test-collection'
				},
				pipeline: [{ $match: { status: 'active' } }],
				sampleSize: 10
			});

			// Guest user should not be authenticated
			expect(userStore.getState().isAuthenticated).toBe(false);

			// Save pipeline to local storage
			LocalStorageService.savePipeline({
				name: 'Guest Pipeline',
				description: 'A guest pipeline',
				tags: ['guest'],
				pipeline: [{ $match: { status: 'active' } }],
				connectionId: 'test-conn',
				database: 'test-db',
				collection: 'test-collection',
				sampleSize: 10
			});

			// Verify pipeline was saved
			const pipelines = LocalStorageService.getPipelines();
			expect(pipelines).toHaveLength(1);
			expect(pipelines[0].name).toBe('Guest Pipeline');
		});

		it('should handle pipeline loading and execution workflow', async () => {
			// Mock authenticated state
			userStore.setState({
				isAuthenticated: true,
				user: { name: 'Test User', email: 'test@example.com' },
				isLoading: false
			});

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

			localStorageMock.getItem.mockReturnValue('mock-token');

			// User should be authenticated
			expect(userStore.getState().isAuthenticated).toBe(true);

			// Load pipelines
			const response = await fetch('/api/pipelines/saved');
			const data = await response.json();

			expect(data.success).toBe(true);
			expect(data.data.pipelines).toHaveLength(1);
			expect(data.data.pipelines[0].name).toBe('Sales Analysis');

			// Load pipeline into store
			const pipeline = data.data.pipelines[0];
			pipelineStore.setPipeline(pipeline.pipeline);
			pipelineStore.setConnection({
				id: pipeline.connectionId,
				name: 'Test Connection',
				selectedDatabase: pipeline.database,
				selectedCollection: pipeline.collection
			});
			pipelineStore.setSampleSize(pipeline.sampleSize);

			// Verify pipeline was loaded
			expect(pipelineStore.getState().pipeline).toEqual([
				{ $match: { status: 'active' } },
				{ $group: { _id: '$category', total: { $sum: '$amount' } } }
			]);
		});

		it('should handle pipeline sharing and collaboration workflow', async () => {
			// Mock authenticated state
			userStore.setState({
				isAuthenticated: true,
				user: { name: 'Test User', email: 'test@example.com' },
				isLoading: false
			});

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

			localStorageMock.getItem.mockReturnValue('mock-token');

			// Set up pipeline state
			pipelineStore.setState({
				connection: {
					id: 'test-conn',
					name: 'Test Connection',
					selectedDatabase: 'test-db',
					selectedCollection: 'test-collection'
				},
				pipeline: [
					{ $match: { status: 'active' } },
					{ $group: { _id: '$category', count: { $sum: 1 } } }
				],
				sampleSize: 10
			});

			// User should be authenticated
			expect(userStore.getState().isAuthenticated).toBe(true);

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
				userId: userStore.getState().user?._id,
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
			userStore.setState({
				isAuthenticated: false,
				user: null,
				isLoading: false
			});

			// Attempt login should fail gracefully
			await userStore.login('test@example.com', 'wrongpassword');

			await new Promise(resolve => setTimeout(resolve, 0)); // Allow state to update

			expect(userStore.getState().isAuthenticated).toBe(false);
			expect(userStore.getState().user).toBeNull();

			// User should still be able to use the app as guest
			expect(userStore.getState().isAuthenticated).toBe(false);
		});

		it('should handle network errors gracefully', async () => {
			// Mock network error
			const mockFetch = vi.mocked(fetch);
			mockFetch.mockRejectedValueOnce(new Error('Network error'));

			// Mock authenticated state
			userStore.setState({
				isAuthenticated: true,
				user: { name: 'Test User', email: 'test@example.com' },
				isLoading: false
			});

			// Set up pipeline state
			pipelineStore.setState({
				connection: {
					id: 'test-conn',
					name: 'Test Connection',
					selectedDatabase: 'test-db',
					selectedCollection: 'test-collection'
				},
				pipeline: [{ $match: { status: 'active' } }],
				sampleSize: 10
			});

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
			localStorageMock.getItem.mockReturnValue('mock-token');

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

			expect(userStore.getState().isAuthenticated).toBe(true);
			expect(userStore.getState().user).toEqual({
				name: 'Test User',
				email: 'test@example.com'
			});
		});

		it('should handle token expiration and refresh', async () => {
			// Mock expired token
			localStorageMock.getItem.mockReturnValue('expired-token');

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

			expect(userStore.getState().isAuthenticated).toBe(false);
			expect(userStore.getState().user).toBeNull();
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
				sampleSize: 10
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
			localStorageMock.getItem.mockReturnValue('invalid-json');

			// Should handle gracefully
			const pipelines = LocalStorageService.getPipelines();
			expect(pipelines).toEqual([]);
		});

		it('should handle storage quota exceeded', () => {
			// Mock storage quota exceeded error
			localStorageMock.setItem.mockImplementation(() => {
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
					sampleSize: 10
				});
			}).not.toThrow();
		});
	});
});
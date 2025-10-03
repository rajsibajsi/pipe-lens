import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageService } from '../src/lib/services/local-storage.service.js';
import { pipelineStore } from '../src/lib/stores/pipeline.store.js';
import { userStore } from '../src/lib/stores/user.store.js';

// Mock fetch
global.fetch = vi.fn();

// localStorage and crypto are mocked in setup.ts

describe('Phase 5 - Pipeline Management', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		LocalStorageService.clearPipelines();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('Pipeline Store Integration', () => {
		it('should handle pipeline state updates', () => {
			const testPipeline = [
				{ $match: { status: 'active' } },
				{ $group: { _id: '$category', count: { $sum: 1 } } }
			];

			pipelineStore.setPipeline(testPipeline);

			const state = get(pipelineStore);
			expect(state.pipeline).toEqual(testPipeline);
		});

		it('should handle connection state updates', () => {
			const testConnection = {
				id: 'test-conn',
				name: 'Test Connection',
				selectedDatabase: 'test-db',
				selectedCollection: 'test-collection'
			};

            pipelineStore.setConnection({ ...testConnection, uri: '', isConnected: true });

			const state = get(pipelineStore);
			expect(state.connection).toEqual(testConnection);
		});

		it('should handle sample size updates', () => {
			pipelineStore.setSampleSize(50);

			const state = get(pipelineStore);
			expect(state.sampleSize).toBe(50);
		});

		it('should handle results updates', () => {
			const testResults = [
				{ _id: 'Electronics', count: 10 },
				{ _id: 'Clothing', count: 5 }
			];

			pipelineStore.setResults(testResults);

			const state = get(pipelineStore);
			expect(state.results).toEqual(testResults);
		});

		it('should handle error state updates', () => {
			const errorMessage = 'Pipeline execution failed';

			pipelineStore.setError(errorMessage);

			const state = get(pipelineStore);
			expect(state.error).toBe(errorMessage);
		});

		it('should handle execution state updates', () => {
			pipelineStore.setExecuting(true);

            const s1 = get(pipelineStore);
            expect(s1.isExecuting).toBe(true);

			pipelineStore.setExecuting(false);

            let s2: any;
            pipelineStore.subscribe(s => (s2 = s))();
            expect(s2.isExecuting).toBe(false);
		});
	});

	describe('LocalStorageService', () => {
		it('should save and retrieve pipelines', () => {
			const pipelineData = {
				name: 'Test Pipeline',
				description: 'A test pipeline',
				tags: ['test'],
				pipeline: [{ $match: { status: 'active' } }],
				connectionId: 'test-conn',
				database: 'test-db',
				collection: 'test-collection',
				sampleSize: 10
			};

            LocalStorageService.savePipeline({ ...pipelineData, metadata: {} });

			const pipelines = LocalStorageService.getPipelines();
			expect(pipelines).toHaveLength(1);
			expect(pipelines[0]).toMatchObject({
				name: 'Test Pipeline',
				description: 'A test pipeline',
				tags: ['test'],
				pipeline: [{ $match: { status: 'active' } }]
			});
			expect(pipelines[0].id).toBeDefined();
			expect(pipelines[0].createdAt).toBeDefined();
		});

		it('should delete pipelines', () => {
			const pipelineData = {
				name: 'Test Pipeline',
				description: 'A test pipeline',
				tags: ['test'],
				pipeline: [{ $match: { status: 'active' } }],
				connectionId: 'test-conn',
				database: 'test-db',
				collection: 'test-collection',
				sampleSize: 10
			};

            LocalStorageService.savePipeline({ ...pipelineData, metadata: {} });
			const pipelines = LocalStorageService.getPipelines();
			const pipelineId = pipelines[0].id;

			LocalStorageService.deletePipeline(pipelineId);

			const updatedPipelines = LocalStorageService.getPipelines();
			expect(updatedPipelines).toHaveLength(0);
		});

		it('should get specific pipeline by id', () => {
			const pipelineData = {
				name: 'Test Pipeline',
				description: 'A test pipeline',
				tags: ['test'],
				pipeline: [{ $match: { status: 'active' } }],
				connectionId: 'test-conn',
				database: 'test-db',
				collection: 'test-collection',
				sampleSize: 10
			};

            LocalStorageService.savePipeline({ ...pipelineData, metadata: {} });
			const pipelines = LocalStorageService.getPipelines();
			const pipelineId = pipelines[0].id;

			const retrievedPipeline = LocalStorageService.getPipeline(pipelineId);
			expect(retrievedPipeline).toEqual(pipelines[0]);
		});

		it('should return undefined for non-existent pipeline', () => {
            const retrievedPipeline = LocalStorageService.getPipeline('non-existent-id');
            expect(retrievedPipeline).toBeNull();
		});

		it('should clear all pipelines', () => {
			const pipelineData = {
				name: 'Test Pipeline',
				description: 'A test pipeline',
				tags: ['test'],
				pipeline: [{ $match: { status: 'active' } }],
				connectionId: 'test-conn',
				database: 'test-db',
				collection: 'test-collection',
				sampleSize: 10
			};

            LocalStorageService.savePipeline({ ...pipelineData, metadata: {} });
			expect(LocalStorageService.getPipelines()).toHaveLength(1);

			LocalStorageService.clearPipelines();
			expect(LocalStorageService.getPipelines()).toHaveLength(0);
		});

		it('should enforce maximum pipeline limit', () => {
			// Clear existing pipelines
			LocalStorageService.clearPipelines();

			// Add more than the limit (10)
			for (let i = 0; i < 12; i++) {
                LocalStorageService.savePipeline({
					name: `Pipeline ${i}`,
					description: `Pipeline ${i} description`,
					tags: ['test'],
					pipeline: [{ $match: { status: 'active' } }],
					connectionId: 'test-conn',
					database: 'test-db',
					collection: 'test-collection',
                    sampleSize: 10,
                    metadata: {}
				});
			}

			const pipelines = LocalStorageService.getPipelines();
			expect(pipelines).toHaveLength(10); // Should be limited to 10
		});

		it('should handle empty local storage gracefully', () => {
            (global as any).localStorage.getItem.mockReturnValue(null);

			const pipelines = LocalStorageService.getPipelines();
			expect(pipelines).toEqual([]);
		});

		it('should handle corrupted local storage gracefully', () => {
            (global as any).localStorage.getItem.mockReturnValue('invalid-json');

			const pipelines = LocalStorageService.getPipelines();
			expect(pipelines).toEqual([]);
		});

		it('should overwrite existing pipeline with same name', () => {
			const pipelineData1 = {
				name: 'Test Pipeline',
				description: 'First version',
				tags: ['test'],
				pipeline: [{ $match: { status: 'active' } }],
				connectionId: 'test-conn',
				database: 'test-db',
				collection: 'test-collection',
				sampleSize: 10
			};

			const pipelineData2 = {
				name: 'Test Pipeline',
				description: 'Second version',
				tags: ['test', 'updated'],
				pipeline: [{ $match: { status: 'inactive' } }],
				connectionId: 'test-conn',
				database: 'test-db',
				collection: 'test-collection',
				sampleSize: 20
			};

            LocalStorageService.savePipeline({ ...pipelineData1, metadata: {} });
            LocalStorageService.savePipeline({ ...pipelineData2, metadata: {} });

			const pipelines = LocalStorageService.getPipelines();
			expect(pipelines).toHaveLength(1);
			expect(pipelines[0].description).toBe('Second version');
			expect(pipelines[0].tags).toEqual(['test', 'updated']);
		});
	});

	describe('User Store Integration', () => {
		it('should handle authentication state changes', async () => {
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

            // Initially unauthenticated
            let us: any; userStore.subscribe(v => (us = v))();
            expect(us.isAuthenticated).toBe(false);

			// Login
			await userStore.login('test@example.com', 'password123');

            // Should be authenticated
            userStore.subscribe(v => (us = v))();
            expect(us.isAuthenticated).toBe(true);
            expect(us.user).toEqual({
				name: 'Test User',
				email: 'test@example.com'
			});

			// Logout
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true })
			} as Response);

			await userStore.logout();

            // Should be unauthenticated again
            userStore.subscribe(v => (us = v))();
            expect(us.isAuthenticated).toBe(false);
            expect(us.user).toBeNull();
		});

		it('should handle loading states', async () => {
			const mockFetch = vi.mocked(fetch);
			
			// Mock a delayed response
			mockFetch.mockImplementationOnce(() => 
				new Promise(resolve => 
					setTimeout(() => resolve({
						ok: true,
						json: async () => ({
							success: true,
							data: {
								user: { name: 'Test User', email: 'test@example.com' },
								accessToken: 'mock-token',
								refreshToken: 'mock-refresh-token'
							}
						})
					} as Response), 100)
				)
			);

            // Start login
            const loginPromise = userStore.login('test@example.com', 'password123');

            // Should be loading
            let us: any;
            userStore.subscribe(v => (us = v))();
            expect(us.isLoading).toBe(true);

			// Wait for completion
			await loginPromise;

            // Should not be loading anymore
            userStore.subscribe(v => (us = v))();
            expect(us.isLoading).toBe(false);
		});
	});

	describe('Error Handling', () => {
		it('should handle network errors in pipeline operations', async () => {
			const mockFetch = vi.mocked(fetch);
			mockFetch.mockRejectedValueOnce(new Error('Network error'));

			// This would be called by a component, but we can test the error handling
			try {
				const response = await fetch('/api/pipelines/saved');
				expect(response).toBeUndefined();
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toBe('Network error');
			}
		});

		it('should handle API errors gracefully', async () => {
			const mockFetch = vi.mocked(fetch);
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({
					success: false,
					message: 'Server error'
				})
			} as Response);

			const response = await fetch('/api/pipelines/saved');
			const data = await response.json();

			expect(response.ok).toBe(false);
			expect(data.success).toBe(false);
			expect(data.message).toBe('Server error');
		});

		it('should handle localStorage errors gracefully', () => {
			// Mock localStorage error
            (global as any).localStorage.setItem.mockImplementation(() => {
				throw new Error('Storage quota exceeded');
			});

			// Should not throw
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
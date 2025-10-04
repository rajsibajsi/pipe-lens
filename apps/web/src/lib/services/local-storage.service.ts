import { browser } from '$app/environment';

export interface LocalPipeline {
	id: string;
	name: string;
	description?: string;
	tags: string[];
	pipeline: object[];
	connectionId: string;
	database: string;
	collection: string;
	sampleSize: number;
	createdAt: string;
	updatedAt: string;
	lastExecutedAt?: string;
	executionCount: number;
	metadata: {
		estimatedExecutionTime?: number;
		complexity?: 'simple' | 'medium' | 'complex';
		category?: string;
		difficulty?: 'beginner' | 'intermediate' | 'advanced';
	};
}

export interface PipelineImportData {
	pipeline: object[];
	description?: string;
	tags?: string[];
	metadata?: {
		estimatedExecutionTime?: number;
		complexity?: 'simple' | 'medium' | 'complex';
		category?: string;
		difficulty?: 'beginner' | 'intermediate' | 'advanced';
	};
}

// biome-ignore lint/complexity/noStaticOnlyClass: Intentional static utility container
export class LocalStorageService {
	private static readonly STORAGE_KEY = 'pipe-lens-local-pipelines';
	private static readonly MAX_PIPELINES = 10; // Limit for guest users

	/**
	 * Get all local pipelines
	 */
	static getPipelines(): LocalPipeline[] {
		if (!browser) return [];

		try {
			const stored = localStorage.getItem(LocalStorageService.STORAGE_KEY);
			return stored ? JSON.parse(stored) : [];
		} catch (error) {
			console.error('Failed to load local pipelines:', error);
			return [];
		}
	}

	/**
	 * Save a pipeline locally
	 */
	static savePipeline(
		pipelineData: Omit<LocalPipeline, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>,
	): LocalPipeline {
		if (!browser) throw new Error('Local storage not available');

		const pipelines = LocalStorageService.getPipelines();

		// Check if name already exists
		const existingIndex = pipelines.findIndex((p) => p.name === pipelineData.name);
		if (existingIndex !== -1) {
			throw new Error('Pipeline with this name already exists');
		}

		// Check storage limit
		if (pipelines.length >= LocalStorageService.MAX_PIPELINES) {
			throw new Error(
				`Guest users are limited to ${LocalStorageService.MAX_PIPELINES} saved pipelines. Sign up to save more.`,
			);
		}

		const now = new Date().toISOString();
		const newPipeline: LocalPipeline = {
			...pipelineData,
			id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			createdAt: now,
			updatedAt: now,
			executionCount: 0,
		};

		pipelines.push(newPipeline);
		LocalStorageService.savePipelines(pipelines);

		return newPipeline;
	}

	/**
	 * Update a local pipeline
	 */
	static updatePipeline(id: string, updateData: Partial<LocalPipeline>): LocalPipeline {
		if (!browser) throw new Error('Local storage not available');

		const pipelines = LocalStorageService.getPipelines();
		const index = pipelines.findIndex((p) => p.id === id);

		if (index === -1) {
			throw new Error('Pipeline not found');
		}

		// Check if new name conflicts with existing pipeline
		if (updateData.name && updateData.name !== pipelines[index].name) {
			const existingIndex = pipelines.findIndex((p) => p.name === updateData.name && p.id !== id);
			if (existingIndex !== -1) {
				throw new Error('Pipeline with this name already exists');
			}
		}

		const updatedPipeline = {
			...pipelines[index],
			...updateData,
			updatedAt: new Date().toISOString(),
		};

		pipelines[index] = updatedPipeline;
		LocalStorageService.savePipelines(pipelines);

		return updatedPipeline;
	}

	/**
	 * Delete a local pipeline
	 */
	static deletePipeline(id: string): void {
		if (!browser) throw new Error('Local storage not available');

		const pipelines = LocalStorageService.getPipelines();
		const filteredPipelines = pipelines.filter((p) => p.id !== id);

		if (filteredPipelines.length === pipelines.length) {
			throw new Error('Pipeline not found');
		}

		LocalStorageService.savePipelines(filteredPipelines);
	}

	/**
	 * Get a pipeline by ID
	 */
	static getPipeline(id: string): LocalPipeline | null {
		if (!browser) return null;

		const pipelines = LocalStorageService.getPipelines();
		return pipelines.find((p) => p.id === id) || null;
	}

	/**
	 * Search pipelines
	 */
	static searchPipelines(
		query: string,
		filters: {
			category?: string;
			difficulty?: string;
			tags?: string[];
		} = {},
	): LocalPipeline[] {
		if (!browser) return [];

		let pipelines = LocalStorageService.getPipelines();

		// Text search
		if (query) {
			const searchTerm = query.toLowerCase();
			pipelines = pipelines.filter(
				(p) =>
					p.name.toLowerCase().includes(searchTerm) ||
					p.description?.toLowerCase().includes(searchTerm) ||
					p.tags.some((tag) => tag.toLowerCase().includes(searchTerm)),
			);
		}

		// Category filter
		if (filters.category) {
			pipelines = pipelines.filter((p) => p.metadata.category === filters.category);
		}

		// Difficulty filter
		if (filters.difficulty) {
			pipelines = pipelines.filter((p) => p.metadata.difficulty === filters.difficulty);
		}

		// Tags filter
		if (filters.tags && filters.tags.length > 0) {
			pipelines = pipelines.filter((p) => filters.tags?.some((tag) => p.tags.includes(tag)));
		}

		return pipelines;
	}

	/**
	 * Duplicate a pipeline
	 */
	static duplicatePipeline(id: string, newName: string): LocalPipeline {
		if (!browser) throw new Error('Local storage not available');

		const originalPipeline = LocalStorageService.getPipeline(id);
		if (!originalPipeline) {
			throw new Error('Pipeline not found');
		}

		// Check if new name already exists
		const existingPipeline = LocalStorageService.getPipelines().find((p) => p.name === newName);
		if (existingPipeline) {
			throw new Error('Pipeline with this name already exists');
		}

		const duplicatedPipeline: Omit<
			LocalPipeline,
			'id' | 'createdAt' | 'updatedAt' | 'executionCount'
		> = {
			name: newName,
			description: originalPipeline.description,
			tags: [...originalPipeline.tags],
			pipeline: [...originalPipeline.pipeline],
			connectionId: originalPipeline.connectionId,
			database: originalPipeline.database,
			collection: originalPipeline.collection,
			sampleSize: originalPipeline.sampleSize,
			lastExecutedAt: originalPipeline.lastExecutedAt,
			metadata: { ...originalPipeline.metadata },
		};

		return LocalStorageService.savePipeline(duplicatedPipeline);
	}

	/**
	 * Export pipeline as JSON
	 */
	static exportPipeline(id: string): object {
		const pipeline = LocalStorageService.getPipeline(id);
		if (!pipeline) {
			throw new Error('Pipeline not found');
		}

		return {
			name: pipeline.name,
			description: pipeline.description,
			tags: pipeline.tags,
			pipeline: pipeline.pipeline,
			metadata: pipeline.metadata,
			exportedAt: new Date().toISOString(),
			version: 1,
		};
	}

	/**
	 * Import pipeline from JSON
	 */
	static importPipeline(importData: unknown, name: string): LocalPipeline {
		if (!browser) throw new Error('Local storage not available');

		if (!isPipelineImportData(importData)) {
			throw new Error(
				'Invalid import data: must contain a pipeline array and valid optional properties',
			);
		}

		const pipelineData: Omit<LocalPipeline, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'> = {
			name,
			description: importData.description,
			tags: importData.tags || [],
			pipeline: importData.pipeline,
			connectionId: '', // Will need to be set by user
			database: '', // Will need to be set by user
			collection: '', // Will need to be set by user
			sampleSize: 10,
			metadata: importData.metadata || {},
		};

		return LocalStorageService.savePipeline(pipelineData);
	}

	/**
	 * Increment execution count
	 */
	static incrementExecution(id: string): void {
		if (!browser) return;

		const pipelines = LocalStorageService.getPipelines();
		const index = pipelines.findIndex((p) => p.id === id);

		if (index !== -1) {
			pipelines[index].executionCount += 1;
			pipelines[index].lastExecutedAt = new Date().toISOString();
			LocalStorageService.savePipelines(pipelines);
		}
	}

	/**
	 * Get storage statistics
	 */
	static getStats(): {
		totalPipelines: number;
		usedSpace: number;
		maxPipelines: number;
		canSaveMore: boolean;
	} {
		if (!browser) {
			return {
				totalPipelines: 0,
				usedSpace: 0,
				maxPipelines: LocalStorageService.MAX_PIPELINES,
				canSaveMore: false,
			};
		}

		const pipelines = LocalStorageService.getPipelines();
		const usedSpace = JSON.stringify(pipelines).length;

		return {
			totalPipelines: pipelines.length,
			usedSpace,
			maxPipelines: LocalStorageService.MAX_PIPELINES,
			canSaveMore: pipelines.length < LocalStorageService.MAX_PIPELINES,
		};
	}

	/**
	 * Clear all local pipelines
	 */
	static clearAll(): void {
		if (!browser) return;

		localStorage.removeItem(LocalStorageService.STORAGE_KEY);
	}

	/**
	 * Clear all local pipelines (alias for clearAll)
	 */
	static clearPipelines(): void {
		LocalStorageService.clearAll();
	}

	/**
	 * Save pipelines to localStorage
	 */
	private static savePipelines(pipelines: LocalPipeline[]): void {
		if (!browser) return;

		try {
			localStorage.setItem(LocalStorageService.STORAGE_KEY, JSON.stringify(pipelines));
		} catch (error) {
			console.error('Failed to save local pipelines:', error);
			throw new Error('Failed to save pipeline. Storage may be full.');
		}
	}
}

/**
 * Type guard to check if an object has a pipeline property that is an array
 */
function hasPipelineArray(obj: unknown): obj is { pipeline: object[] } {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'pipeline' in obj &&
		Array.isArray((obj as Record<string, unknown>).pipeline)
	);
}

/**
 * Type guard to check if an object has optional string properties
 */
function hasOptionalStringProperty(obj: unknown, property: string): boolean {
	if (typeof obj !== 'object' || obj === null || !(property in obj)) {
		return true; // property is optional
	}

	const value = (obj as Record<string, unknown>)[property];
	return typeof value === 'string' || value === undefined;
}

/**
 * Type guard to check if an object has optional string array properties
 */
function hasOptionalStringArrayProperty(obj: unknown, property: string): boolean {
	if (typeof obj !== 'object' || obj === null || !(property in obj)) {
		return true; // property is optional
	}

	const value = (obj as Record<string, unknown>)[property];
	return Array.isArray(value) || value === undefined;
}

/**
 * Type guard to check if an object has optional metadata object
 */
function hasOptionalMetadata(obj: unknown): boolean {
	if (typeof obj !== 'object' || obj === null || !('metadata' in obj)) {
		return true; // metadata is optional
	}

	const metadata = (obj as Record<string, unknown>).metadata;
	if (metadata === undefined || metadata === null) {
		return true; // undefined/null is valid for optional metadata
	}

	return typeof metadata === 'object';
}

/**
 * Type guard to validate PipelineImportData
 */
function isPipelineImportData(obj: unknown): obj is PipelineImportData {
	return (
		hasPipelineArray(obj) &&
		hasOptionalStringProperty(obj, 'description') &&
		hasOptionalStringArrayProperty(obj, 'tags') &&
		hasOptionalMetadata(obj)
	);
}

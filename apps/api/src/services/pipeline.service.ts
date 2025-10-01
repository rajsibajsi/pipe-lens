import { Pipeline, IPipeline } from '../models/Pipeline';
import { User } from '../models/User';

export interface CreatePipelineData {
	userId: string;
	name: string;
	description?: string;
	tags?: string[];
	pipeline: object[];
	connectionId: string;
	database: string;
	collection: string;
	sampleSize?: number;
	isPublic?: boolean;
	isTemplate?: boolean;
	metadata?: {
		estimatedExecutionTime?: number;
		complexity?: 'simple' | 'medium' | 'complex';
		category?: string;
		difficulty?: 'beginner' | 'intermediate' | 'advanced';
	};
}

export interface UpdatePipelineData {
	name?: string;
	description?: string;
	tags?: string[];
	pipeline?: object[];
	connectionId?: string;
	database?: string;
	collection?: string;
	sampleSize?: number;
	isPublic?: boolean;
	isTemplate?: boolean;
	metadata?: {
		estimatedExecutionTime?: number;
		complexity?: 'simple' | 'medium' | 'complex';
		category?: string;
		difficulty?: 'beginner' | 'intermediate' | 'advanced';
	};
}

export interface PipelineFilters {
	userId?: string;
	isPublic?: boolean;
	isTemplate?: boolean;
	tags?: string[];
	category?: string;
	difficulty?: string;
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'executionCount';
	sortOrder?: 'asc' | 'desc';
}

export class PipelineService {
	/**
	 * Create a new pipeline
	 */
	async createPipeline(data: CreatePipelineData): Promise<IPipeline> {
		const { userId, ...pipelineData } = data;

		// Check if user exists
		const user = await User.findById(userId);
		if (!user) {
			throw new Error('User not found');
		}

		// Check if pipeline name already exists for this user
		const existingPipeline = await Pipeline.findOne({
			userId,
			name: pipelineData.name
		});

		if (existingPipeline) {
			throw new Error('Pipeline with this name already exists');
		}

		// Check user's plan limits
		const pipelineCount = await Pipeline.countDocuments({ userId });
		if (user.plan === 'free' && pipelineCount >= 3) {
			throw new Error('Free plan limited to 3 saved pipelines. Upgrade to save more.');
		}

		// Calculate complexity if not provided
		if (!pipelineData.metadata?.complexity) {
			pipelineData.metadata = {
				...pipelineData.metadata,
				complexity: this.calculateComplexity(pipelineData.pipeline)
			};
		}

		const pipeline = new Pipeline({
			...pipelineData,
			userId
		});

		await pipeline.save();
		return pipeline;
	}

	/**
	 * Get pipeline by ID
	 */
	async getPipelineById(pipelineId: string, userId?: string): Promise<IPipeline | null> {
		const query: any = { _id: pipelineId };
		
		// If userId provided, ensure user owns the pipeline or it's public
		if (userId) {
			query.$or = [
				{ userId },
				{ isPublic: true }
			];
		}

		return await Pipeline.findOne(query);
	}

	/**
	 * Get user's pipelines
	 */
	async getUserPipelines(userId: string, filters: PipelineFilters = {}): Promise<IPipeline[]> {
		const query: any = { userId };
		
		// Apply filters
		if (filters.tags && filters.tags.length > 0) {
			query.tags = { $in: filters.tags };
		}
		
		if (filters.category) {
			query['metadata.category'] = filters.category;
		}
		
		if (filters.difficulty) {
			query['metadata.difficulty'] = filters.difficulty;
		}
		
		if (filters.search) {
			query.$or = [
				{ name: { $regex: filters.search, $options: 'i' } },
				{ description: { $regex: filters.search, $options: 'i' } },
				{ tags: { $in: [new RegExp(filters.search, 'i')] } }
			];
		}

		// Build sort object
		const sort: any = {};
		const sortBy = filters.sortBy || 'updatedAt';
		const sortOrder = filters.sortOrder || 'desc';
		sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

		// Build query options
		const options: any = { sort };
		if (filters.limit) {
			options.limit = filters.limit;
		}
		if (filters.offset) {
			options.skip = filters.offset;
		}

		return await Pipeline.find(query, null, options);
	}

	/**
	 * Get public pipelines
	 */
	async getPublicPipelines(filters: PipelineFilters = {}): Promise<IPipeline[]> {
		const query: any = { isPublic: true };
		
		// Apply filters
		if (filters.tags && filters.tags.length > 0) {
			query.tags = { $in: filters.tags };
		}
		
		if (filters.category) {
			query['metadata.category'] = filters.category;
		}
		
		if (filters.difficulty) {
			query['metadata.difficulty'] = filters.difficulty;
		}
		
		if (filters.search) {
			query.$or = [
				{ name: { $regex: filters.search, $options: 'i' } },
				{ description: { $regex: filters.search, $options: 'i' } },
				{ tags: { $in: [new RegExp(filters.search, 'i')] } }
			];
		}

		// Build sort object
		const sort: any = {};
		const sortBy = filters.sortBy || 'createdAt';
		const sortOrder = filters.sortOrder || 'desc';
		sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

		// Build query options
		const options: any = { sort };
		if (filters.limit) {
			options.limit = filters.limit;
		}
		if (filters.offset) {
			options.skip = filters.offset;
		}

		return await Pipeline.find(query, null, options);
	}

	/**
	 * Update pipeline
	 */
	async updatePipeline(pipelineId: string, userId: string, updateData: UpdatePipelineData): Promise<IPipeline> {
		const pipeline = await Pipeline.findOne({ _id: pipelineId, userId });
		if (!pipeline) {
			throw new Error('Pipeline not found or access denied');
		}

		// Check if new name conflicts with existing pipeline
		if (updateData.name && updateData.name !== pipeline.name) {
			const existingPipeline = await Pipeline.findOne({
				userId,
				name: updateData.name,
				_id: { $ne: pipelineId }
			});

			if (existingPipeline) {
				throw new Error('Pipeline with this name already exists');
			}
		}

		// Update pipeline
		Object.assign(pipeline, updateData);
		
		// Recalculate complexity if pipeline changed
		if (updateData.pipeline) {
			pipeline.metadata.complexity = this.calculateComplexity(updateData.pipeline);
		}

		// Increment version
		pipeline.version += 1;

		await pipeline.save();
		return pipeline;
	}

	/**
	 * Delete pipeline
	 */
	async deletePipeline(pipelineId: string, userId: string): Promise<void> {
		const pipeline = await Pipeline.findOne({ _id: pipelineId, userId });
		if (!pipeline) {
			throw new Error('Pipeline not found or access denied');
		}

		await Pipeline.findByIdAndDelete(pipelineId);
	}

	/**
	 * Duplicate pipeline
	 */
	async duplicatePipeline(pipelineId: string, userId: string, newName: string): Promise<IPipeline> {
		const originalPipeline = await Pipeline.findOne({ _id: pipelineId, userId });
		if (!originalPipeline) {
			throw new Error('Pipeline not found or access denied');
		}

		// Check if new name already exists
		const existingPipeline = await Pipeline.findOne({ userId, name: newName });
		if (existingPipeline) {
			throw new Error('Pipeline with this name already exists');
		}

		// Create duplicate
		const duplicateData: CreatePipelineData = {
			userId,
			name: newName,
			description: originalPipeline.description,
			tags: [...originalPipeline.tags],
			pipeline: [...originalPipeline.pipeline],
			connectionId: originalPipeline.connectionId,
			database: originalPipeline.database,
			collection: originalPipeline.collection,
			sampleSize: originalPipeline.sampleSize,
			isPublic: false, // Duplicates are private by default
			isTemplate: false,
			metadata: { ...originalPipeline.metadata }
		};

		return await this.createPipeline(duplicateData);
	}

	/**
	 * Execute pipeline and update execution count
	 */
	async executePipeline(pipelineId: string, userId: string): Promise<IPipeline> {
		const pipeline = await Pipeline.findOne({ _id: pipelineId, userId });
		if (!pipeline) {
			throw new Error('Pipeline not found or access denied');
		}

		// Increment execution count
		await pipeline.incrementExecution();

		return pipeline;
	}

	/**
	 * Get pipeline statistics
	 */
	async getPipelineStats(userId: string): Promise<{
		totalPipelines: number;
		publicPipelines: number;
		templates: number;
		totalExecutions: number;
		mostUsedPipeline?: IPipeline;
	}> {
		const totalPipelines = await Pipeline.countDocuments({ userId });
		const publicPipelines = await Pipeline.countDocuments({ userId, isPublic: true });
		const templates = await Pipeline.countDocuments({ userId, isTemplate: true });
		
		const pipelines = await Pipeline.find({ userId });
		const totalExecutions = pipelines.reduce((sum, pipeline) => sum + pipeline.executionCount, 0);
		
		const mostUsedPipeline = pipelines.reduce((most, pipeline) => 
			pipeline.executionCount > most.executionCount ? pipeline : most, 
			pipelines[0] || null
		);

		return {
			totalPipelines,
			publicPipelines,
			templates,
			totalExecutions,
			mostUsedPipeline
		};
	}

	/**
	 * Calculate pipeline complexity
	 */
	private calculateComplexity(pipeline: object[]): 'simple' | 'medium' | 'complex' {
		const stageCount = pipeline.length;
		const hasComplexStages = pipeline.some((stage: any) => 
			stage.$lookup || stage.$facet || stage.$graphLookup || stage.$unionWith
		);
		
		if (stageCount <= 3 && !hasComplexStages) return 'simple';
		if (stageCount <= 6 && !hasComplexStages) return 'medium';
		return 'complex';
	}

	/**
	 * Export pipeline as JSON
	 */
	async exportPipeline(pipelineId: string, userId: string): Promise<object> {
		const pipeline = await Pipeline.findOne({ _id: pipelineId, userId });
		if (!pipeline) {
			throw new Error('Pipeline not found or access denied');
		}

		return {
			name: pipeline.name,
			description: pipeline.description,
			tags: pipeline.tags,
			pipeline: pipeline.pipeline,
			metadata: pipeline.metadata,
			exportedAt: new Date().toISOString(),
			version: pipeline.version
		};
	}

	/**
	 * Import pipeline from JSON
	 */
	async importPipeline(userId: string, importData: any, name: string): Promise<IPipeline> {
		const pipelineData: CreatePipelineData = {
			userId,
			name,
			description: importData.description,
			tags: importData.tags || [],
			pipeline: importData.pipeline,
			connectionId: '', // Will need to be set by user
			database: '', // Will need to be set by user
			collection: '', // Will need to be set by user
			sampleSize: 10,
			metadata: importData.metadata || {}
		};

		return await this.createPipeline(pipelineData);
	}
}

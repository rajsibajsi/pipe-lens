import { Request, Response, Router } from 'express';
import { authenticate, optionalAuth, rateLimit } from '../middleware/auth.middleware';
import { CreatePipelineData, PipelineFilters, PipelineService } from '../services/pipeline.service';

const router = Router();
const pipelineService = new PipelineService();

// Rate limiting for pipeline endpoints
const pipelineRateLimit = rateLimit(100, 15 * 60 * 1000); // 100 requests per 15 minutes

/**
 * @route POST /api/pipelines/saved
 * @desc Create a new saved pipeline
 * @access Private
 */
router.post('/saved', authenticate, pipelineRateLimit, async (req: Request, res: Response) => {
	try {
		const {
			name,
			description,
			tags,
			pipeline,
			connectionId,
			database,
			collection: collectionName,
			sampleSize,
			isPublic,
			isTemplate,
			metadata
		} = req.body;

		// Validate required fields
		if (!name || !pipeline || !connectionId || !database || !collectionName) {
			return res.status(400).json({
				success: false,
				message: 'Name, pipeline, connectionId, database, and collection are required'
			});
		}

		// Validate pipeline is an array
		if (!Array.isArray(pipeline) || pipeline.length === 0) {
			return res.status(400).json({
				success: false,
				message: 'Pipeline must be a non-empty array of aggregation stages'
			});
		}

		// Validate tags
		if (tags && (!Array.isArray(tags) || tags.length > 10)) {
			return res.status(400).json({
				success: false,
				message: 'Tags must be an array with maximum 10 items'
			});
		}

		const pipelineData: CreatePipelineData = {
			userId: req.user?._id?.toString() || '',
			name: name.trim(),
			description: description?.trim(),
			tags: tags || [],
			pipeline,
			connectionId,
			database,
			collection: collectionName,
			sampleSize: sampleSize || 10,
			isPublic: isPublic || false,
			isTemplate: isTemplate || false,
			metadata: metadata || {}
		};

		const savedPipeline = await pipelineService.createPipeline(pipelineData);

		return res.status(201).json({
			success: true,
			message: 'Pipeline saved successfully',
			data: { pipeline: savedPipeline }
		});
	} catch (error) {
		console.error('Save pipeline error:', error);
		return res.status(400).json({
			success: false,
			message: error instanceof Error ? error.message : 'Failed to save pipeline'
		});
	}
});

/**
 * @route GET /api/pipelines/saved
 * @desc Get user's saved pipelines
 * @access Private
 */
router.get('/saved', authenticate, async (req: Request, res: Response) => {
	try {
		const {
			tags,
			category,
			difficulty,
			search,
			limit = 20,
			offset = 0,
			sortBy = 'updatedAt',
			sortOrder = 'desc'
		} = req.query;

		const filters: PipelineFilters = {
			userId: req.user!._id.toString(),
			tags: tags ? (Array.isArray(tags) ? tags.map(t => t as string) : [tags as string]) : undefined,
			category: category as string,
			difficulty: difficulty as string,
			search: search as string,
			limit: parseInt(limit as string),
			offset: parseInt(offset as string),
			sortBy: sortBy as any,
			sortOrder: sortOrder as 'asc' | 'desc'
		};

		const pipelines = await pipelineService.getUserPipelines(req.user!._id.toString(), filters);

		res.json({
			success: true,
			data: { pipelines }
		});
	} catch (error) {
		console.error('Get pipelines error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to get pipelines'
		});
	}
});

/**
 * @route GET /api/pipelines/saved/public
 * @desc Get public pipelines
 * @access Public
 */
router.get('/saved/public', optionalAuth, async (req: Request, res: Response) => {
	try {
		const {
			tags,
			category,
			difficulty,
			search,
			limit = 20,
			offset = 0,
			sortBy = 'createdAt',
			sortOrder = 'desc'
		} = req.query;

		const filters: PipelineFilters = {
			tags: tags ? (Array.isArray(tags) ? tags.map(t => t as string) : [tags as string]) : undefined,
			category: category as string,
			difficulty: difficulty as string,
			search: search as string,
			limit: parseInt(limit as string),
			offset: parseInt(offset as string),
			sortBy: sortBy as any,
			sortOrder: sortOrder as 'asc' | 'desc'
		};

		const pipelines = await pipelineService.getPublicPipelines(filters);

		res.json({
			success: true,
			data: { pipelines }
		});
	} catch (error) {
		console.error('Get public pipelines error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to get public pipelines'
		});
	}
});

/**
 * @route GET /api/pipelines/saved/:id
 * @desc Get pipeline by ID
 * @access Private/Public (if public)
 */
router.get('/saved/:id', optionalAuth, async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const userId = req.user?._id?.toString();

		const pipeline = await pipelineService.getPipelineById(id, userId);

		if (!pipeline) {
			return res.status(404).json({
				success: false,
				message: 'Pipeline not found'
			});
		}

		return res.json({
			success: true,
			data: { pipeline }
		});
	} catch (error) {
		console.error('Get pipeline error:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to get pipeline'
		});
	}
});

/**
 * @route PUT /api/pipelines/saved/:id
 * @desc Update pipeline
 * @access Private
 */
router.put('/saved/:id', authenticate, pipelineRateLimit, async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const updateData = req.body;

		// Validate pipeline if provided
		if (updateData.pipeline && (!Array.isArray(updateData.pipeline) || updateData.pipeline.length === 0)) {
			return res.status(400).json({
				success: false,
				message: 'Pipeline must be a non-empty array of aggregation stages'
			});
		}

		// Validate tags if provided
		if (updateData.tags && (!Array.isArray(updateData.tags) || updateData.tags.length > 10)) {
			return res.status(400).json({
				success: false,
				message: 'Tags must be an array with maximum 10 items'
			});
		}

		const pipeline = await pipelineService.updatePipeline(id, req.user!._id.toString(), updateData);

		return res.json({
			success: true,
			message: 'Pipeline updated successfully',
			data: { pipeline }
		});
	} catch (error) {
		console.error('Update pipeline error:', error);
		return res.status(400).json({
			success: false,
			message: error instanceof Error ? error.message : 'Failed to update pipeline'
		});
	}
});

/**
 * @route DELETE /api/pipelines/saved/:id
 * @desc Delete pipeline
 * @access Private
 */
router.delete('/saved/:id', authenticate, async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		await pipelineService.deletePipeline(id, req.user!._id.toString());

		return res.json({
			success: true,
			message: 'Pipeline deleted successfully'
		});
	} catch (error) {
		console.error('Delete pipeline error:', error);
		return res.status(400).json({
			success: false,
			message: error instanceof Error ? error.message : 'Failed to delete pipeline'
		});
	}
});

/**
 * @route POST /api/pipelines/saved/:id/duplicate
 * @desc Duplicate pipeline
 * @access Private
 */
router.post('/saved/:id/duplicate', authenticate, async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { name } = req.body;

		if (!name) {
			return res.status(400).json({
				success: false,
				message: 'Name is required for duplicated pipeline'
			});
		}

		const duplicatedPipeline = await pipelineService.duplicatePipeline(id, req.user!._id.toString(), name);

		return res.status(201).json({
			success: true,
			message: 'Pipeline duplicated successfully',
			data: { pipeline: duplicatedPipeline }
		});
	} catch (error) {
		console.error('Duplicate pipeline error:', error);
		return res.status(400).json({
			success: false,
			message: error instanceof Error ? error.message : 'Failed to duplicate pipeline'
		});
	}
});

/**
 * @route POST /api/pipelines/saved/:id/execute
 * @desc Execute pipeline and update execution count
 * @access Private
 */
router.post('/saved/:id/execute', authenticate, async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const pipeline = await pipelineService.executePipeline(id, req.user!._id.toString());

		return res.json({
			success: true,
			message: 'Pipeline executed successfully',
			data: { pipeline }
		});
	} catch (error) {
		console.error('Execute pipeline error:', error);
		return res.status(400).json({
			success: false,
			message: error instanceof Error ? error.message : 'Failed to execute pipeline'
		});
	}
});

/**
 * @route GET /api/pipelines/saved/stats
 * @desc Get pipeline statistics
 * @access Private
 */
router.get('/saved/stats', authenticate, async (req: Request, res: Response) => {
	try {
		const stats = await pipelineService.getPipelineStats(req.user!._id.toString());

		return res.json({
			success: true,
			data: { stats }
		});
	} catch (error) {
		console.error('Get pipeline stats error:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to get pipeline statistics'
		});
	}
});

/**
 * @route GET /api/pipelines/saved/:id/export
 * @desc Export pipeline as JSON
 * @access Private
 */
router.get('/saved/:id/export', authenticate, async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const exportData = await pipelineService.exportPipeline(id, req.user!._id.toString());

		return res.json({
			success: true,
			data: { export: exportData }
		});
	} catch (error) {
		console.error('Export pipeline error:', error);
		return res.status(400).json({
			success: false,
			message: error instanceof Error ? error.message : 'Failed to export pipeline'
		});
	}
});

/**
 * @route POST /api/pipelines/saved/import
 * @desc Import pipeline from JSON
 * @access Private
 */
router.post('/saved/import', authenticate, async (req: Request, res: Response) => {
	try {
		const { importData, name } = req.body;

		if (!importData || !name) {
			return res.status(400).json({
				success: false,
				message: 'Import data and name are required'
			});
		}

		if (!importData.pipeline || !Array.isArray(importData.pipeline)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid import data: pipeline must be an array'
			});
		}

		const pipeline = await pipelineService.importPipeline(req.user!._id.toString(), importData, name);

		return res.status(201).json({
			success: true,
			message: 'Pipeline imported successfully',
			data: { pipeline }
		});
	} catch (error) {
		console.error('Import pipeline error:', error);
		return res.status(400).json({
			success: false,
			message: error instanceof Error ? error.message : 'Failed to import pipeline'
		});
	}
});

export default router;

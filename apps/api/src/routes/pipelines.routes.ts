import { type Request, type Response, Router } from 'express';
import { mongoService } from '../services/mongodb.service.js';

const router = Router();

// Execute pipeline
router.post('/execute', async (req: Request, res: Response) => {
	try {
		const { connectionId, database, collection, pipeline } = req.body;

		if (!connectionId || !database || !collection || !pipeline) {
			res.status(400).json({
				error: 'connectionId, database, collection, and pipeline are required',
			});
			return;
		}

		if (!Array.isArray(pipeline)) {
			res.status(400).json({ error: 'pipeline must be an array' });
			return;
		}

		const result = await mongoService.executePipeline(connectionId, database, collection, pipeline);

		res.json({
			success: true,
			count: result.length,
			results: result,
		});
	} catch (error) {
		console.error('Pipeline execution error:', error);
		res.status(500).json({
			error: 'Failed to execute pipeline',
			message: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Execute pipeline with stage-by-stage results
router.post('/execute-stages', async (req: Request, res: Response) => {
	try {
		const { connectionId, database, collection, pipeline } = req.body;

		if (!connectionId || !database || !collection || !pipeline) {
			res.status(400).json({
				error: 'connectionId, database, collection, and pipeline are required',
			});
			return;
		}

		if (!Array.isArray(pipeline)) {
			res.status(400).json({ error: 'pipeline must be an array' });
			return;
		}

		const result = await mongoService.executePipelineWithStages(
			connectionId,
			database,
			collection,
			pipeline,
		);

		res.json({
			success: true,
			stages: result,
		});
	} catch (error) {
		console.error('Pipeline stage execution error:', error);
		res.status(500).json({
			error: 'Failed to execute pipeline stages',
			message: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Validate pipeline syntax
router.post('/validate', async (req: Request, res: Response) => {
	try {
		const { pipeline } = req.body;

		if (!pipeline) {
			res.status(400).json({ error: 'pipeline is required' });
			return;
		}

		// Basic validation
		if (!Array.isArray(pipeline)) {
			res.json({ valid: false, error: 'Pipeline must be an array' });
			return;
		}

		if (pipeline.length === 0) {
			res.json({ valid: false, error: 'Pipeline cannot be empty' });
			return;
		}

		// Check each stage has at least one operator
		for (let i = 0; i < pipeline.length; i++) {
			const stage = pipeline[i];
			if (typeof stage !== 'object' || stage === null) {
				res.json({
					valid: false,
					error: `Stage ${i + 1} must be an object`,
				});
				return;
			}

			const keys = Object.keys(stage);
			if (keys.length === 0) {
				res.json({
					valid: false,
					error: `Stage ${i + 1} must have at least one operator`,
				});
				return;
			}

			// Check if operators start with $
			const invalidOps = keys.filter((k) => !k.startsWith('$'));
			if (invalidOps.length > 0) {
				res.json({
					valid: false,
					error: `Stage ${i + 1} has invalid operators: ${invalidOps.join(', ')}. Operators must start with $`,
				});
				return;
			}
		}

		res.json({ valid: true });
	} catch (error) {
		console.error('Pipeline validation error:', error);
		res.status(500).json({ error: 'Failed to validate pipeline' });
	}
});

export default router;

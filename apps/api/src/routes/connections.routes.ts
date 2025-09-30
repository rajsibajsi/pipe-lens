import { type Request, type Response, Router } from 'express';
import { mongoService } from '../services/mongodb.service.js';

const router = Router();

// Test connection
router.post('/test', async (req: Request, res: Response) => {
	try {
		const { uri } = req.body;

		if (!uri) {
			res.status(400).json({ error: 'Connection URI is required' });
			return;
		}

		const isValid = await mongoService.testConnection(uri);

		res.json({ success: isValid });
	} catch (error) {
		console.error('Connection test error:', error);
		res.status(500).json({ error: 'Failed to test connection' });
	}
});

// Connect to MongoDB
router.post('/connect', async (req: Request, res: Response) => {
	try {
		const { connectionId, uri } = req.body;

		if (!connectionId || !uri) {
			res.status(400).json({ error: 'connectionId and uri are required' });
			return;
		}

		await mongoService.connect(connectionId, uri);

		res.json({ success: true, connectionId });
	} catch (error) {
		console.error('Connection error:', error);
		res.status(500).json({ error: 'Failed to connect to MongoDB' });
	}
});

// Disconnect from MongoDB
router.post('/disconnect', async (req: Request, res: Response) => {
	try {
		const { connectionId } = req.body;

		if (!connectionId) {
			res.status(400).json({ error: 'connectionId is required' });
			return;
		}

		await mongoService.disconnect(connectionId);

		res.json({ success: true });
	} catch (error) {
		console.error('Disconnect error:', error);
		res.status(500).json({ error: 'Failed to disconnect' });
	}
});

// List databases
router.get('/:connectionId/databases', async (req: Request, res: Response) => {
	try {
		const { connectionId } = req.params;

		const databases = await mongoService.listDatabases(connectionId);

		res.json({ databases });
	} catch (error) {
		console.error('List databases error:', error);
		res.status(500).json({ error: 'Failed to list databases' });
	}
});

// List collections
router.get('/:connectionId/databases/:dbName/collections', async (req: Request, res: Response) => {
	try {
		const { connectionId, dbName } = req.params;

		const collections = await mongoService.listCollections(connectionId, dbName);

		res.json({ collections });
	} catch (error) {
		console.error('List collections error:', error);
		res.status(500).json({ error: 'Failed to list collections' });
	}
});

export default router;

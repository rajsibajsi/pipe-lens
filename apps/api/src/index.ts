import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import authRouter from './routes/auth.routes.js';
import connectionsRouter from './routes/connections.routes.js';
import pipelinesRouter from './routes/pipelines.routes.js';
import savedPipelinesRouter from './routes/saved-pipelines.routes.js';
import { mongoService } from './services/mongodb.service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (_req: Request, res: Response) => {
	res.json({ message: 'PipeLens API v0.1.0' });
});

// Feature routes
app.use('/api/connections', connectionsRouter);
app.use('/api/pipelines', pipelinesRouter);
app.use('/api/auth', authRouter);
app.use('/api/pipelines', savedPipelinesRouter);

// Graceful shutdown
process.on('SIGTERM', async () => {
	console.log('SIGTERM signal received: closing HTTP server');
	await mongoService.disconnectAll();
	process.exit(0);
});

process.on('SIGINT', async () => {
	console.log('SIGINT signal received: closing HTTP server');
	await mongoService.disconnectAll();
	process.exit(0);
});

// Initialize Mongoose connection
mongoService.connectMongoose().catch(console.error);

// Start server
app.listen(PORT, () => {
	console.log(`🚀 PipeLens API server running on http://localhost:${PORT}`);
});

export default app;

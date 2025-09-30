import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';

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

// Start server
app.listen(PORT, () => {
	console.log(`🚀 PipeLens API server running on http://localhost:${PORT}`);
});

export default app;

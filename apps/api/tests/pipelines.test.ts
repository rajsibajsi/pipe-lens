import { MongoClient } from 'mongodb';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/index.js';

const TEST_DB = 'test_pipeline_api';
const TEST_COLLECTION = 'test_orders';

describe('Pipeline API Endpoints', () => {
	let connectionId: string;
	let mongoClient: MongoClient;

	beforeAll(async () => {
		// Connect to test MongoDB
		mongoClient = new MongoClient('mongodb://admin:password@localhost:27017');
		await mongoClient.connect();
		
		// Create test data
		const db = mongoClient.db(TEST_DB);
		const collection = db.collection(TEST_COLLECTION);
		
		// Clear existing data
		await collection.deleteMany({});
		
		// Insert test data
		await collection.insertMany([
			{
				_id: '1',
				product: 'Laptop',
				category: 'Electronics',
				status: 'shipped',
				quantity: 1,
				price: 1200
			},
			{
				_id: '2',
				product: 'Mouse',
				category: 'Electronics',
				status: 'shipped',
				quantity: 3,
				price: 25
			},
			{
				_id: '3',
				product: 'Desk',
				category: 'Furniture',
				status: 'pending',
				quantity: 1,
				price: 300
			},
			{
				_id: '4',
				product: 'Chair',
				category: 'Furniture',
				status: 'shipped',
				quantity: 2,
				price: 150
			}
		]);

		// Create connection
		const connectResponse = await request(app)
			.post('/api/connections/connect')
			.send({
				connectionId: 'test-conn-1',
				uri: 'mongodb://admin:password@localhost:27017'
			});

		expect(connectResponse.status).toBe(200);
		connectionId = 'test-conn-1';
	});

	afterAll(async () => {
		// Clean up
		if (mongoClient) {
			await mongoClient.db(TEST_DB).dropDatabase();
			await mongoClient.close();
		}
	});

	describe('POST /api/pipelines/execute', () => {
		it('should execute a simple pipeline', async () => {
			const pipeline = [
				{ $match: { status: 'shipped' } },
				{ $limit: 2 }
			];

			const response = await request(app)
				.post('/api/pipelines/execute')
				.send({
					connectionId,
					database: TEST_DB,
					collection: TEST_COLLECTION,
					pipeline
				});

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.results).toHaveLength(2);
			expect(response.body.count).toBe(2);
		});

		it('should return error for invalid pipeline', async () => {
			const response = await request(app)
				.post('/api/pipelines/execute')
				.send({
					connectionId,
					database: TEST_DB,
					collection: TEST_COLLECTION,
					pipeline: [{ invalid: 'operator' }]
				});

			expect(response.status).toBe(500);
			expect(response.body.error).toBeDefined();
		});

		it('should return error for missing required fields', async () => {
			const response = await request(app)
				.post('/api/pipelines/execute')
				.send({
					connectionId,
					// Missing database, collection, pipeline
				});

			expect(response.status).toBe(400);
			expect(response.body.error).toContain('required');
		});
	});

	describe('POST /api/pipelines/execute-stages', () => {
		it('should execute pipeline with stage-by-stage results', async () => {
			const pipeline = [
				{ $match: { status: 'shipped' } },
				{ $group: { _id: '$category', count: { $sum: 1 } } }
			];

			const response = await request(app)
				.post('/api/pipelines/execute-stages')
				.send({
					connectionId,
					database: TEST_DB,
					collection: TEST_COLLECTION,
					pipeline,
					sampleSize: 5
				});

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.stages).toHaveLength(2);
			
			// Check first stage
			expect(response.body.stages[0].stageIndex).toBe(0);
			expect(response.body.stages[0].stage).toEqual({ $match: { status: 'shipped' } });
			expect(response.body.stages[0].count).toBeGreaterThan(0);
			expect(response.body.stages[0].preview).toHaveLength(5); // sampleSize
			expect(response.body.stages[0].executionTime).toBeGreaterThan(0);

			// Check second stage
			expect(response.body.stages[1].stageIndex).toBe(1);
			expect(response.body.stages[1].stage).toEqual({ $group: { _id: '$category', count: { $sum: 1 } } });
			expect(response.body.stages[1].count).toBeGreaterThan(0);
			expect(response.body.stages[1].preview).toHaveLength(5); // sampleSize
			expect(response.body.stages[1].executionTime).toBeGreaterThan(0);
		});

		it('should respect sample size parameter', async () => {
			const pipeline = [{ $limit: 10 }];

			const response = await request(app)
				.post('/api/pipelines/execute-stages')
				.send({
					connectionId,
					database: TEST_DB,
					collection: TEST_COLLECTION,
					pipeline,
					sampleSize: 2
				});

			expect(response.status).toBe(200);
			expect(response.body.stages[0].preview).toHaveLength(2);
		});

		it('should handle empty pipeline', async () => {
			const response = await request(app)
				.post('/api/pipelines/execute-stages')
				.send({
					connectionId,
					database: TEST_DB,
					collection: TEST_COLLECTION,
					pipeline: [],
					sampleSize: 5
				});

			expect(response.status).toBe(200);
			expect(response.body.stages).toHaveLength(0);
		});

		it('should return error for invalid connection', async () => {
			const response = await request(app)
				.post('/api/pipelines/execute-stages')
				.send({
					connectionId: 'invalid-connection',
					database: TEST_DB,
					collection: TEST_COLLECTION,
					pipeline: [{ $limit: 1 }],
					sampleSize: 5
				});

			expect(response.status).toBe(500);
			expect(response.body.error).toContain('No active connection');
		});
	});

	describe('POST /api/pipelines/validate', () => {
		it('should validate correct pipeline', async () => {
			const pipeline = [
				{ $match: { status: 'shipped' } },
				{ $group: { _id: '$category', count: { $sum: 1 } } }
			];

			const response = await request(app)
				.post('/api/pipelines/validate')
				.send({ pipeline });

			expect(response.status).toBe(200);
			expect(response.body.valid).toBe(true);
		});

		it('should reject empty pipeline', async () => {
			const response = await request(app)
				.post('/api/pipelines/validate')
				.send({ pipeline: [] });

			expect(response.status).toBe(200);
			expect(response.body.valid).toBe(false);
			expect(response.body.error).toContain('Pipeline cannot be empty');
		});

		it('should reject non-array pipeline', async () => {
			const response = await request(app)
				.post('/api/pipelines/validate')
				.send({ pipeline: 'not an array' });

			expect(response.status).toBe(200);
			expect(response.body.valid).toBe(false);
			expect(response.body.error).toContain('Pipeline must be an array');
		});

		it('should reject pipeline with invalid operators', async () => {
			const pipeline = [
				{ $match: { status: 'shipped' } },
				{ invalidOperator: 'value' }
			];

			const response = await request(app)
				.post('/api/pipelines/validate')
				.send({ pipeline });

			expect(response.status).toBe(200);
			expect(response.body.valid).toBe(false);
			expect(response.body.error).toContain('invalid operators');
		});

		it('should reject pipeline with empty stages', async () => {
			const pipeline = [{}];

			const response = await request(app)
				.post('/api/pipelines/validate')
				.send({ pipeline });

			expect(response.status).toBe(200);
			expect(response.body.valid).toBe(false);
			expect(response.body.error).toContain('must have at least one operator');
		});

		it('should reject non-object stages', async () => {
			const pipeline = ['not an object'];

			const response = await request(app)
				.post('/api/pipelines/validate')
				.send({ pipeline });

			expect(response.status).toBe(200);
			expect(response.body.valid).toBe(false);
			expect(response.body.error).toContain('must be an object');
		});
	});
});

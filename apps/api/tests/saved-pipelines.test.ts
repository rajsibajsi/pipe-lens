import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../src/index.js';
import { Pipeline } from '../src/models/Pipeline.js';
import { User } from '../src/models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

describe('Saved Pipelines API', () => {
	let accessToken: string;
	let userId: string;

	beforeAll(async () => {
		// Clear collections
		await User.deleteMany({});
		await Pipeline.deleteMany({});

		// Create a test user
		const hashedPassword = await bcrypt.hash('password123', 10);
		const user = await User.create({
			name: 'Test User',
			email: 'test@example.com',
			password: hashedPassword,
		});

		userId = user._id.toString();
		accessToken = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
			expiresIn: '1h',
		});
	});

	afterAll(async () => {
		// Clean up
		await User.deleteMany({});
		await Pipeline.deleteMany({});
	});

	describe('POST /api/pipelines/saved', () => {
		it('should save a pipeline successfully', async () => {
			const pipelineData = {
				name: 'Test Pipeline',
				description: 'A test pipeline',
				tags: ['test', 'aggregation'],
				pipeline: [
					{ $match: { status: 'active' } },
					{ $group: { _id: '$category', count: { $sum: 1 } } },
				],
				connectionId: 'test-conn',
				database: 'test-db',
				collection: 'test-collection',
				sampleSize: 10,
				isPublic: false,
			};

			const response = await request(app)
				.post('/api/pipelines/saved')
				.set('Authorization', `Bearer ${accessToken}`)
				.send(pipelineData);

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.pipeline).toMatchObject({
				name: pipelineData.name,
				description: pipelineData.description,
				tags: pipelineData.tags,
				pipeline: pipelineData.pipeline,
				userId: userId,
				isPublic: false,
			});
		});

		it('should reject saving pipeline without authentication', async () => {
			const pipelineData = {
				name: 'Test Pipeline',
				pipeline: [{ $match: { status: 'active' } }],
			};

			const response = await request(app).post('/api/pipelines/saved').send(pipelineData);

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		it('should reject saving pipeline with missing required fields', async () => {
			const response = await request(app)
				.post('/api/pipelines/saved')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({});

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it('should save public pipeline', async () => {
			const pipelineData = {
				name: 'Public Test Pipeline',
				description: 'A public test pipeline',
				tags: ['public', 'test'],
				pipeline: [{ $match: { status: 'active' } }, { $count: 'total' }],
				connectionId: 'test-conn',
				database: 'test-db',
				collection: 'test-collection',
				sampleSize: 10,
				isPublic: true,
			};

			const response = await request(app)
				.post('/api/pipelines/saved')
				.set('Authorization', `Bearer ${accessToken}`)
				.send(pipelineData);

			expect(response.status).toBe(201);
			expect(response.body.data.pipeline.isPublic).toBe(true);
		});
	});

	describe('GET /api/pipelines/saved', () => {
		beforeAll(async () => {
			// Create some test pipelines
			await Pipeline.create([
				{
					name: 'User Pipeline 1',
					description: 'First user pipeline',
					tags: ['user'],
					pipeline: [{ $match: { status: 'active' } }],
					userId: userId,
					connectionId: 'test-conn',
					database: 'test-db',
					collection: 'test-collection',
					sampleSize: 10,
					isPublic: false,
				},
				{
					name: 'User Pipeline 2',
					description: 'Second user pipeline',
					tags: ['user', 'test'],
					pipeline: [{ $group: { _id: '$category' } }],
					userId: userId,
					connectionId: 'test-conn',
					database: 'test-db',
					collection: 'test-collection',
					sampleSize: 20,
					isPublic: false,
				},
			]);
		});

		it('should get user pipelines', async () => {
			const response = await request(app)
				.get('/api/pipelines/saved')
				.set('Authorization', `Bearer ${accessToken}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.pipelines).toHaveLength(2);
			expect(response.body.data.pipelines[0]).toMatchObject({
				name: expect.any(String),
				userId: userId,
			});
		});

		it('should reject getting pipelines without authentication', async () => {
			const response = await request(app).get('/api/pipelines/saved');

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		it('should support pagination', async () => {
			const response = await request(app)
				.get('/api/pipelines/saved?page=1&limit=1')
				.set('Authorization', `Bearer ${accessToken}`);

			expect(response.status).toBe(200);
			expect(response.body.data.pipelines).toHaveLength(1);
			expect(response.body.data.pagination).toMatchObject({
				page: 1,
				limit: 1,
				total: 2,
				pages: 2,
			});
		});

		it('should support search by name', async () => {
			const response = await request(app)
				.get('/api/pipelines/saved?search=Pipeline 1')
				.set('Authorization', `Bearer ${accessToken}`);

			expect(response.status).toBe(200);
			expect(response.body.data.pipelines).toHaveLength(1);
			expect(response.body.data.pipelines[0].name).toBe('User Pipeline 1');
		});

		it('should support filtering by tags', async () => {
			const response = await request(app)
				.get('/api/pipelines/saved?tags=test')
				.set('Authorization', `Bearer ${accessToken}`);

			expect(response.status).toBe(200);
			expect(response.body.data.pipelines).toHaveLength(1);
			expect(response.body.data.pipelines[0].tags).toContain('test');
		});
	});

	describe('GET /api/pipelines/saved/public', () => {
		beforeAll(async () => {
			// Create a public pipeline
			await Pipeline.create({
				name: 'Public Pipeline',
				description: 'A public pipeline',
				tags: ['public'],
				pipeline: [{ $match: { status: 'public' } }],
				userId: userId,
				connectionId: 'test-conn',
				database: 'test-db',
				collection: 'test-collection',
				sampleSize: 10,
				isPublic: true,
			});
		});

		it('should get public pipelines without authentication', async () => {
			const response = await request(app).get('/api/pipelines/saved/public');

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.pipelines).toHaveLength(1);
			expect(response.body.data.pipelines[0].isPublic).toBe(true);
		});

		it('should support search in public pipelines', async () => {
			const response = await request(app).get('/api/pipelines/saved/public?search=Public');

			expect(response.status).toBe(200);
			expect(response.body.data.pipelines).toHaveLength(1);
			expect(response.body.data.pipelines[0].name).toBe('Public Pipeline');
		});
	});

	describe('GET /api/pipelines/saved/:id', () => {
		let pipelineId: string;

		beforeAll(async () => {
			const pipeline = await Pipeline.create({
				name: 'Test Pipeline Detail',
				description: 'Pipeline for detail testing',
				tags: ['detail'],
				pipeline: [{ $match: { status: 'detail' } }],
				userId: userId,
				connectionId: 'test-conn',
				database: 'test-db',
				collection: 'test-collection',
				sampleSize: 10,
				isPublic: false,
			});
			pipelineId = pipeline._id.toString();
		});

		it('should get pipeline by id', async () => {
			const response = await request(app)
				.get(`/api/pipelines/saved/${pipelineId}`)
				.set('Authorization', `Bearer ${accessToken}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.pipeline).toMatchObject({
				name: 'Test Pipeline Detail',
				userId: userId,
			});
		});

		it('should reject getting pipeline without authentication', async () => {
			const response = await request(app).get(`/api/pipelines/saved/${pipelineId}`);

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		it('should return 404 for non-existent pipeline', async () => {
			const response = await request(app)
				.get('/api/pipelines/saved/507f1f77bcf86cd799439011')
				.set('Authorization', `Bearer ${accessToken}`);

			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
		});
	});

	describe('PUT /api/pipelines/saved/:id', () => {
		let pipelineId: string;

		beforeAll(async () => {
			const pipeline = await Pipeline.create({
				name: 'Test Pipeline Update',
				description: 'Pipeline for update testing',
				tags: ['update'],
				pipeline: [{ $match: { status: 'update' } }],
				userId: userId,
				connectionId: 'test-conn',
				database: 'test-db',
				collection: 'test-collection',
				sampleSize: 10,
				isPublic: false,
			});
			pipelineId = pipeline._id.toString();
		});

		it('should update pipeline successfully', async () => {
			const updateData = {
				name: 'Updated Pipeline',
				description: 'Updated description',
				tags: ['updated'],
				pipeline: [{ $match: { status: 'updated' } }],
			};

			const response = await request(app)
				.put(`/api/pipelines/saved/${pipelineId}`)
				.set('Authorization', `Bearer ${accessToken}`)
				.send(updateData);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.pipeline).toMatchObject({
				name: 'Updated Pipeline',
				description: 'Updated description',
				tags: ['updated'],
			});
		});

		it('should reject updating pipeline without authentication', async () => {
			const updateData = {
				name: 'Unauthorized Update',
			};

			const response = await request(app)
				.put(`/api/pipelines/saved/${pipelineId}`)
				.send(updateData);

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		it('should return 404 for non-existent pipeline', async () => {
			const updateData = {
				name: 'Non-existent Update',
			};

			const response = await request(app)
				.put('/api/pipelines/saved/507f1f77bcf86cd799439011')
				.set('Authorization', `Bearer ${accessToken}`)
				.send(updateData);

			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
		});
	});

	describe('DELETE /api/pipelines/saved/:id', () => {
		let pipelineId: string;

		beforeAll(async () => {
			const pipeline = await Pipeline.create({
				name: 'Test Pipeline Delete',
				description: 'Pipeline for delete testing',
				tags: ['delete'],
				pipeline: [{ $match: { status: 'delete' } }],
				userId: userId,
				connectionId: 'test-conn',
				database: 'test-db',
				collection: 'test-collection',
				sampleSize: 10,
				isPublic: false,
			});
			pipelineId = pipeline._id.toString();
		});

		it('should delete pipeline successfully', async () => {
			const response = await request(app)
				.delete(`/api/pipelines/saved/${pipelineId}`)
				.set('Authorization', `Bearer ${accessToken}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);

			// Verify pipeline is deleted
			const getResponse = await request(app)
				.get(`/api/pipelines/saved/${pipelineId}`)
				.set('Authorization', `Bearer ${accessToken}`);

			expect(getResponse.status).toBe(404);
		});

		it('should reject deleting pipeline without authentication', async () => {
			const response = await request(app).delete(`/api/pipelines/saved/${pipelineId}`);

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		it('should return 404 for non-existent pipeline', async () => {
			const response = await request(app)
				.delete('/api/pipelines/saved/507f1f77bcf86cd799439011')
				.set('Authorization', `Bearer ${accessToken}`);

			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
		});
	});
});

import bcrypt from 'bcryptjs';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../src/index.js';
import { User } from '../src/models/User.js';

describe('Authentication API', () => {
	beforeAll(async () => {
		// Clear users collection
		await User.deleteMany({});
	});

	afterAll(async () => {
		// Clean up
		await User.deleteMany({});
	});

	describe('POST /api/auth/register', () => {
		it('should register a new user successfully', async () => {
			const userData = {
				name: 'Test User',
				email: 'test@example.com',
				password: 'password123',
			};

			const response = await request(app).post('/api/auth/register').send(userData);

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.user).toMatchObject({
				name: userData.name,
				email: userData.email,
			});
			expect(response.body.data.user.password).toBeUndefined();
			expect(response.body.data.accessToken).toBeDefined();
			expect(response.body.data.refreshToken).toBeDefined();
		});

		it('should reject registration with invalid email', async () => {
			const userData = {
				name: 'Test User',
				email: 'invalid-email',
				password: 'password123',
			};

			const response = await request(app).post('/api/auth/register').send(userData);

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('email');
		});

		it('should reject registration with weak password', async () => {
			const userData = {
				name: 'Test User',
				email: 'test2@example.com',
				password: '123',
			};

			const response = await request(app).post('/api/auth/register').send(userData);

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('password');
		});

		it('should reject duplicate email registration', async () => {
			const userData = {
				name: 'Test User',
				email: 'test@example.com',
				password: 'password123',
			};

			const response = await request(app).post('/api/auth/register').send(userData);

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('already exists');
		});

		it('should reject registration with missing fields', async () => {
			const response = await request(app).post('/api/auth/register').send({});

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});
	});

	describe('POST /api/auth/login', () => {
		beforeAll(async () => {
			// Create a test user for login tests
			const hashedPassword = await bcrypt.hash('password123', 10);
			await User.create({
				name: 'Login Test User',
				email: 'login@example.com',
				password: hashedPassword,
			});
		});

		it('should login with valid credentials', async () => {
			const loginData = {
				email: 'login@example.com',
				password: 'password123',
			};

			const response = await request(app).post('/api/auth/login').send(loginData);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.user).toMatchObject({
				name: 'Login Test User',
				email: 'login@example.com',
			});
			expect(response.body.data.accessToken).toBeDefined();
			expect(response.body.data.refreshToken).toBeDefined();
		});

		it('should reject login with invalid email', async () => {
			const loginData = {
				email: 'nonexistent@example.com',
				password: 'password123',
			};

			const response = await request(app).post('/api/auth/login').send(loginData);

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Invalid credentials');
		});

		it('should reject login with invalid password', async () => {
			const loginData = {
				email: 'login@example.com',
				password: 'wrongpassword',
			};

			const response = await request(app).post('/api/auth/login').send(loginData);

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain('Invalid credentials');
		});

		it('should reject login with missing fields', async () => {
			const response = await request(app).post('/api/auth/login').send({});

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});
	});

	describe('POST /api/auth/refresh', () => {
		let refreshToken: string;

		beforeAll(async () => {
			// Get a refresh token
			const loginData = {
				email: 'login@example.com',
				password: 'password123',
			};

			const response = await request(app).post('/api/auth/login').send(loginData);

			refreshToken = response.body.data.refreshToken;
		});

		it('should refresh access token with valid refresh token', async () => {
			const response = await request(app).post('/api/auth/refresh').send({ refreshToken });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.accessToken).toBeDefined();
		});

		it('should reject refresh with invalid token', async () => {
			const response = await request(app)
				.post('/api/auth/refresh')
				.send({ refreshToken: 'invalid-token' });

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		it('should reject refresh with missing token', async () => {
			const response = await request(app).post('/api/auth/refresh').send({});

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});
	});

	describe('POST /api/auth/logout', () => {
		let accessToken: string;

		beforeAll(async () => {
			// Get an access token
			const loginData = {
				email: 'login@example.com',
				password: 'password123',
			};

			const response = await request(app).post('/api/auth/login').send(loginData);

			accessToken = response.body.data.accessToken;
		});

		it('should logout successfully with valid token', async () => {
			const response = await request(app)
				.post('/api/auth/logout')
				.set('Authorization', `Bearer ${accessToken}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
		});

		it('should reject logout without token', async () => {
			const response = await request(app).post('/api/auth/logout');

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});
	});
});

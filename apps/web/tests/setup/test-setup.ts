import { test as base } from '@playwright/test';
import { seedTestDatabase } from './seed-db.js';

// Global setup for all tests
export async function globalSetup() {
	console.log('🌱 Seeding test database...');
	await seedTestDatabase();
	console.log('✅ Test database seeded successfully');
}

// Global teardown for all tests
export async function globalTeardown() {
	console.log('🧹 Cleaning up test environment...');
	// Add any cleanup logic here if needed
	console.log('✅ Test environment cleaned up');
}
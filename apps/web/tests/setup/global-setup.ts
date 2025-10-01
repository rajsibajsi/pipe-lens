import { seedTestDatabase } from './seed-db';

async function globalSetup() {
	console.log('🌱 Seeding test database...');
	try {
		await seedTestDatabase();
	} catch (error) {
		console.error('Failed to seed database:', error);
		console.log('⚠️ Make sure MongoDB is running: docker compose up -d');
	}
}

export default globalSetup;
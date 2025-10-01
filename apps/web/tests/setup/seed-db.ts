import { MongoClient } from 'mongodb';

/**
 * Seeds the test database with sample data for E2E tests
 */
export async function seedTestDatabase() {
	const uri = 'mongodb://admin:password@localhost:27017';
	const client = new MongoClient(uri);

	try {
		await client.connect();
		const db = client.db('testdb');

		// Drop existing collection if it exists
		try {
			await db.collection('orders').drop();
		} catch (error) {
			// Collection might not exist, ignore error
		}

		// Insert sample orders
		await db.collection('orders').insertMany([
			{
				product: 'Laptop',
				category: 'Electronics',
				price: 1200,
				status: 'shipped',
				quantity: 1,
				date: new Date('2024-01-15'),
			},
			{
				product: 'Mouse',
				category: 'Electronics',
				price: 25,
				status: 'shipped',
				quantity: 3,
				date: new Date('2024-01-16'),
			},
			{
				product: 'Desk',
				category: 'Furniture',
				price: 300,
				status: 'pending',
				quantity: 1,
				date: new Date('2024-01-17'),
			},
			{
				product: 'Chair',
				category: 'Furniture',
				price: 150,
				status: 'shipped',
				quantity: 2,
				date: new Date('2024-01-18'),
			},
			{
				product: 'Monitor',
				category: 'Electronics',
				price: 400,
				status: 'shipped',
				quantity: 1,
				date: new Date('2024-01-19'),
			},
			{
				product: 'Keyboard',
				category: 'Electronics',
				price: 75,
				status: 'cancelled',
				quantity: 2,
				date: new Date('2024-01-20'),
			},
			{
				product: 'Table',
				category: 'Furniture',
				price: 250,
				status: 'shipped',
				quantity: 1,
				date: new Date('2024-01-21'),
			},
			{
				product: 'Lamp',
				category: 'Furniture',
				price: 45,
				status: 'pending',
				quantity: 3,
				date: new Date('2024-01-22'),
			},
		]);

		console.log('✅ Test database seeded successfully');
	} catch (error) {
		console.error('❌ Error seeding test database:', error);
		throw error;
	} finally {
		await client.close();
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	seedTestDatabase()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}
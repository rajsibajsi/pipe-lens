// Initialize MongoDB with sample data for development
db = db.getSiblingDB('pipe-lens');

// Create collections
db.createCollection('users');
db.createCollection('pipelines');
db.createCollection('connections');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.pipelines.createIndex({ userId: 1 });
db.pipelines.createIndex({ createdAt: -1 });
db.connections.createIndex({ userId: 1 });

// Insert sample data for testing
db.users.insertOne({
	email: 'dev@example.com',
	name: 'Dev User',
	tier: 'community',
	createdAt: new Date(),
	updatedAt: new Date(),
});

print('MongoDB initialized successfully');

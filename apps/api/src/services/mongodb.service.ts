import { type Db, MongoClient } from 'mongodb';

class MongoDBService {
	private clients: Map<string, MongoClient> = new Map();
	private databases: Map<string, Db> = new Map();

	async connect(connectionId: string, uri: string): Promise<void> {
		if (this.clients.has(connectionId)) {
			return; // Already connected
		}

		try {
			const client = new MongoClient(uri);
			await client.connect();
			this.clients.set(connectionId, client);
			console.log(`✅ Connected to MongoDB: ${connectionId}`);
		} catch (error) {
			console.error(`❌ MongoDB connection failed: ${connectionId}`, error);
			throw new Error(`Failed to connect to MongoDB: ${error}`);
		}
	}

	async disconnect(connectionId: string): Promise<void> {
		const client = this.clients.get(connectionId);
		if (client) {
			await client.close();
			this.clients.delete(connectionId);
			this.databases.delete(connectionId);
			console.log(`Disconnected from MongoDB: ${connectionId}`);
		}
	}

	async disconnectAll(): Promise<void> {
		const promises = Array.from(this.clients.keys()).map((id) => this.disconnect(id));
		await Promise.all(promises);
	}

	getClient(connectionId: string): MongoClient | undefined {
		return this.clients.get(connectionId);
	}

	getDatabase(connectionId: string, dbName: string): Db | undefined {
		const client = this.clients.get(connectionId);
		if (!client) {
			return undefined;
		}
		return client.db(dbName);
	}

	async listDatabases(connectionId: string): Promise<string[]> {
		const client = this.clients.get(connectionId);
		if (!client) {
			throw new Error(`No active connection: ${connectionId}`);
		}

		const adminDb = client.db().admin();
		const result = await adminDb.listDatabases();
		return result.databases.map((db) => db.name);
	}

	async listCollections(connectionId: string, dbName: string): Promise<string[]> {
		const db = this.getDatabase(connectionId, dbName);
		if (!db) {
			throw new Error(`No active connection: ${connectionId}`);
		}

		const collections = await db.listCollections().toArray();
		return collections.map((col) => col.name);
	}

	async testConnection(uri: string): Promise<boolean> {
		let client: MongoClient | null = null;
		try {
			client = new MongoClient(uri);
			await client.connect();
			await client.db().admin().ping();
			return true;
		} catch (error) {
			console.error('Connection test failed:', error);
			return false;
		} finally {
			if (client) {
				await client.close();
			}
		}
	}

	async executePipeline(
		connectionId: string,
		dbName: string,
		collectionName: string,
		pipeline: object[],
	): Promise<unknown[]> {
		const db = this.getDatabase(connectionId, dbName);
		if (!db) {
			throw new Error(`No active connection: ${connectionId}`);
		}

		const collection = db.collection(collectionName);
		const result = await collection.aggregate(pipeline).toArray();
		return result;
	}
}

export const mongoService = new MongoDBService();

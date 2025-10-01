const API_BASE_URL = 'http://localhost:3001/api';

export interface ConnectionTestResponse {
	success: boolean;
}

export interface ConnectionResponse {
	success: boolean;
	connectionId: string;
}

export interface DatabasesResponse {
	databases: string[];
}

export interface CollectionsResponse {
	collections: string[];
}

export interface PipelineValidationResponse {
	valid: boolean;
	error?: string;
}

export interface PipelineExecutionResponse {
	success: boolean;
	count: number;
	results: unknown[];
	error?: string;
	message?: string;
}

export interface StageResult {
	stageIndex: number;
	stage: object;
	count: number;
	preview: unknown[];
	executionTime: number;
}

export interface PipelineStagesResponse {
	success: boolean;
	stages: StageResult[];
	error?: string;
	message?: string;
}

class ApiClient {
	// Connection endpoints
	async testConnection(uri: string): Promise<ConnectionTestResponse> {
		const response = await fetch(`${API_BASE_URL}/connections/test`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ uri }),
		});
		return response.json();
	}

	async connect(connectionId: string, uri: string): Promise<ConnectionResponse> {
		const response = await fetch(`${API_BASE_URL}/connections/connect`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ connectionId, uri }),
		});
		return response.json();
	}

	async disconnect(connectionId: string): Promise<{ success: boolean }> {
		const response = await fetch(`${API_BASE_URL}/connections/disconnect`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ connectionId }),
		});
		return response.json();
	}

	async listDatabases(connectionId: string): Promise<DatabasesResponse> {
		const response = await fetch(`${API_BASE_URL}/connections/${connectionId}/databases`);
		return response.json();
	}

	async listCollections(connectionId: string, dbName: string): Promise<CollectionsResponse> {
		const response = await fetch(
			`${API_BASE_URL}/connections/${connectionId}/databases/${dbName}/collections`,
		);
		return response.json();
	}

	// Pipeline endpoints
	async validatePipeline(pipeline: unknown[]): Promise<PipelineValidationResponse> {
		const response = await fetch(`${API_BASE_URL}/pipelines/validate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ pipeline }),
		});
		return response.json();
	}

	async executePipeline(
		connectionId: string,
		database: string,
		collection: string,
		pipeline: unknown[],
	): Promise<PipelineExecutionResponse> {
		const response = await fetch(`${API_BASE_URL}/pipelines/execute`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ connectionId, database, collection, pipeline }),
		});
		return response.json();
	}
	async executePipelineWithStages(
		connectionId: string,
		database: string,
		collection: string,
		pipeline: unknown[],
		sampleSize: number = 10,
	): Promise<PipelineStagesResponse> {
		const response = await fetch(`${API_BASE_URL}/pipelines/execute-stages`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ connectionId, database, collection, pipeline, sampleSize }),
		});
		return response.json();
	}
}

export const api = new ApiClient();

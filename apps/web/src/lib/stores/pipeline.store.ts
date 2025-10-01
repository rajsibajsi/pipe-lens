import { writable } from 'svelte/store';

export interface Connection {
	id: string;
	name: string;
	uri: string;
	isConnected: boolean;
	selectedDatabase?: string;
	selectedCollection?: string;
}

export interface StageResult {
	stageIndex: number;
	stage: object;
	count: number;
	preview: unknown[];
	executionTime: number;
}

export interface CachedResult {
	pipeline: unknown[];
	sampleSize: number;
	results: unknown[];
	stageResults: StageResult[];
	timestamp: number;
	connectionId: string;
	database: string;
	collection: string;
}

export interface PipelineState {
	connection: Connection | null;
	databases: string[];
	collections: string[];
	pipeline: unknown[];
	results: unknown[];
	stageResults: StageResult[];
	isExecuting: boolean;
	error: string | null;
	viewMode: 'results' | 'stages';
	sampleSize: number;
	maxSampleSize: number;
	cache: Map<string, CachedResult>;
}

const initialState: PipelineState = {
	connection: null,
	databases: [],
	collections: [],
	pipeline: [],
	results: [],
	stageResults: [],
	isExecuting: false,
	error: null,
	viewMode: 'results',
	sampleSize: 10,
	maxSampleSize: 500,
	cache: new Map(),
};

function createPipelineStore() {
	const { subscribe, set, update } = writable<PipelineState>(initialState);

	return {
		subscribe,
		setConnection: (connection: Connection) => update((state) => ({ ...state, connection })),
		setDatabases: (databases: string[]) => update((state) => ({ ...state, databases })),
		setCollections: (collections: string[]) => update((state) => ({ ...state, collections })),
		setPipeline: (pipeline: unknown[]) => update((state) => ({ ...state, pipeline })),
		setResults: (results: unknown[]) =>
			update((state) => ({ ...state, results, viewMode: 'results' })),
		setStageResults: (stageResults: StageResult[]) =>
			update((state) => ({ ...state, stageResults, viewMode: 'stages' })),
		setExecuting: (isExecuting: boolean) => update((state) => ({ ...state, isExecuting })),
		setError: (error: string | null) => update((state) => ({ ...state, error })),
		setViewMode: (viewMode: 'results' | 'stages') => update((state) => ({ ...state, viewMode })),
		setSampleSize: (sampleSize: number) => update((state) => ({ ...state, sampleSize: Math.min(sampleSize, state.maxSampleSize) })),
		setMaxSampleSize: (maxSampleSize: number) => update((state) => ({ ...state, maxSampleSize })),
		getCacheKey: (pipeline: unknown[], sampleSize: number, connectionId: string, database: string, collection: string) => {
			return `${connectionId}:${database}:${collection}:${sampleSize}:${JSON.stringify(pipeline)}`;
		},
		getCachedResult: (pipeline: unknown[], sampleSize: number, connectionId: string, database: string, collection: string) => {
			const key = `${connectionId}:${database}:${collection}:${sampleSize}:${JSON.stringify(pipeline)}`;
			const cached = initialState.cache.get(key);
			if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes cache
				return cached;
			}
			return null;
		},
		setCachedResult: (pipeline: unknown[], sampleSize: number, connectionId: string, database: string, collection: string, results: unknown[], stageResults: StageResult[]) => {
			const key = `${connectionId}:${database}:${collection}:${sampleSize}:${JSON.stringify(pipeline)}`;
			const cached: CachedResult = {
				pipeline,
				sampleSize,
				results,
				stageResults,
				timestamp: Date.now(),
				connectionId,
				database,
				collection,
			};
			update((state) => {
				const newCache = new Map(state.cache);
				newCache.set(key, cached);
				// Limit cache size to 50 entries
				if (newCache.size > 50) {
					const firstKey = newCache.keys().next().value;
					newCache.delete(firstKey);
				}
				return { ...state, cache: newCache };
			});
		},
		clearCache: () => update((state) => ({ ...state, cache: new Map() })),
		selectDatabase: (database: string) =>
			update((state) => ({
				...state,
				connection: state.connection
					? { ...state.connection, selectedDatabase: database, selectedCollection: undefined }
					: null,
				collections: [],
			})),
		selectCollection: (collection: string) =>
			update((state) => ({
				...state,
				connection: state.connection
					? { ...state.connection, selectedCollection: collection }
					: null,
			})),
		reset: () => set(initialState),
	};
}

export const pipelineStore = createPipelineStore();

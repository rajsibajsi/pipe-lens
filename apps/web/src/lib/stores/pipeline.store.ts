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

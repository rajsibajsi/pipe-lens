import { writable } from 'svelte/store';
import type { DiffResult } from '$lib/utils/diff';

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

export interface DiffState {
	showDiff: boolean;
	diffResult: DiffResult | null;
	selectedStageIndex: number | null;
	diffFilter: 'all' | 'added' | 'removed' | 'modified';
	showUnchanged: boolean;
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
	viewMode: 'results' | 'stages' | 'chart';
	sampleSize: number;
	maxSampleSize: number;
	cache: Map<string, CachedResult>;
	diff: DiffState;
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
	diff: {
		showDiff: false,
		diffResult: null,
		selectedStageIndex: null,
		diffFilter: 'all',
		showUnchanged: false,
	},
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
		setViewMode: (viewMode: 'results' | 'stages' | 'chart') =>
			update((state) => ({ ...state, viewMode })),
		setSampleSize: (sampleSize: number) =>
			update((state) => ({ ...state, sampleSize: Math.min(sampleSize, state.maxSampleSize) })),
		setMaxSampleSize: (maxSampleSize: number) => update((state) => ({ ...state, maxSampleSize })),
		getCacheKey: (
			pipeline: unknown[],
			sampleSize: number,
			connectionId: string,
			database: string,
			collection: string,
		) => {
			return `${connectionId}:${database}:${collection}:${sampleSize}:${JSON.stringify(pipeline)}`;
		},
		getCachedResult: (
			pipeline: unknown[],
			sampleSize: number,
			connectionId: string,
			database: string,
			collection: string,
		) => {
			const key = `${connectionId}:${database}:${collection}:${sampleSize}:${JSON.stringify(pipeline)}`;
			const cached = initialState.cache.get(key);
			if (cached && Date.now() - cached.timestamp < 300000) {
				// 5 minutes cache
				return cached;
			}
			return null;
		},
		setCachedResult: (
			pipeline: unknown[],
			sampleSize: number,
			connectionId: string,
			database: string,
			collection: string,
			results: unknown[],
			stageResults: StageResult[],
		) => {
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
					if (firstKey) {
						newCache.delete(firstKey);
					}
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

		// Diff methods
		toggleDiff: () =>
			update((state) => ({
				...state,
				diff: { ...state.diff, showDiff: !state.diff.showDiff },
			})),

		setDiffResult: (diffResult: DiffResult | null) =>
			update((state) => ({
				...state,
				diff: { ...state.diff, diffResult },
			})),

		setSelectedStageIndex: (stageIndex: number | null) =>
			update((state) => ({
				...state,
				diff: { ...state.diff, selectedStageIndex: stageIndex },
			})),

		setDiffFilter: (filter: 'all' | 'added' | 'removed' | 'modified') =>
			update((state) => ({
				...state,
				diff: { ...state.diff, diffFilter: filter },
			})),

		toggleShowUnchanged: () =>
			update((state) => ({
				...state,
				diff: { ...state.diff, showUnchanged: !state.diff.showUnchanged },
			})),

		resetDiff: () =>
			update((state) => ({
				...state,
				diff: {
					showDiff: false,
					diffResult: null,
					selectedStageIndex: null,
					diffFilter: 'all',
					showUnchanged: false,
				},
			})),

		reset: () => set(initialState),
	};
}

export const pipelineStore = createPipelineStore();

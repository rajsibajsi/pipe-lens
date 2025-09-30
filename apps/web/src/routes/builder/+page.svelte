<script lang="ts">
import MonacoEditor from '$lib/components/MonacoEditor.svelte';
import { api } from '$lib/api';
import ConnectionModal from '$lib/components/ConnectionModal.svelte';
import { pipelineStore } from '$lib/stores/pipeline.store';

const defaultPipeline = `[
  {
    "$match": {
      "status": "active"
    }
  },
  {
    "$group": {
      "_id": "$category",
      "count": { "$sum": 1 }
    }
  }
]`;

let editorContent = $state(defaultPipeline);
let showConnectionModal = $state(false);
let showDatabaseSelector = $state(false);
let showCollectionSelector = $state(false);

let connection = $derived($pipelineStore.connection);
let databases = $derived($pipelineStore.databases);
let collections = $derived($pipelineStore.collections);
let results = $derived($pipelineStore.results);
let isExecuting = $derived($pipelineStore.isExecuting);
let error = $derived($pipelineStore.error);

async function handleSelectDatabase(database: string) {
	if (!connection) return;

	pipelineStore.selectDatabase(database);
	showDatabaseSelector = false;

	// Load collections
	const { collections: cols } = await api.listCollections(connection.id, database);
	pipelineStore.setCollections(cols);
}

function handleSelectCollection(collection: string) {
	pipelineStore.selectCollection(collection);
	showCollectionSelector = false;
}

async function handleRunPipeline() {
	if (!connection?.selectedDatabase || !connection?.selectedCollection) {
		pipelineStore.setError('Please select a database and collection');
		return;
	}

	try {
		const pipeline = JSON.parse(editorContent);

		// Validate pipeline
		const validation = await api.validatePipeline(pipeline);
		if (!validation.valid) {
			pipelineStore.setError(validation.error || 'Invalid pipeline');
			return;
		}

		pipelineStore.setExecuting(true);
		pipelineStore.setError(null);

		const result = await api.executePipeline(
			connection.id,
			connection.selectedDatabase,
			connection.selectedCollection,
			pipeline,
		);

		if (result.success) {
			pipelineStore.setResults(result.results);
		} else {
			pipelineStore.setError(result.message || 'Pipeline execution failed');
		}
	} catch (err) {
		pipelineStore.setError(err instanceof Error ? err.message : 'Failed to run pipeline');
	} finally {
		pipelineStore.setExecuting(false);
	}
}

function handleEditorChange(value: string | undefined) {
	if (value !== undefined) {
		editorContent = value;
	}
}
</script>

<div class="h-screen flex flex-col">
	<!-- Header -->
	<header class="bg-white border-b border-gray-200 px-6 py-4">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">Pipeline Builder</h1>
				<p class="text-sm text-gray-500 mt-1">
					{#if connection?.selectedDatabase && connection?.selectedCollection}
						{connection.selectedDatabase}.{connection.selectedCollection}
					{:else}
						Build and test MongoDB aggregation pipelines
					{/if}
				</p>
			</div>
			<div style="display: flex; gap: 0.75rem;">
				<button
					style="padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; color: #374151; background: white; border: 1px solid #d1d5db; border-radius: 0.5rem; cursor: pointer;"
				>
					Save
				</button>
				<button
					onclick={handleRunPipeline}
					disabled={isExecuting || !connection}
					style="padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; color: white; background: {isExecuting || !connection ? '#93c5fd' : '#2563eb'}; border: none; border-radius: 0.5rem; cursor: {isExecuting || !connection ? 'not-allowed' : 'pointer'}; opacity: {isExecuting || !connection ? 0.5 : 1};"
				>
					{isExecuting ? 'Running...' : 'Run Pipeline'}
				</button>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<div class="flex-1 flex overflow-hidden">
		<!-- Sidebar - Stage Library -->
		<aside class="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
			<div class="p-4">
				<h2 class="text-sm font-semibold text-gray-900 mb-3">Pipeline Stages</h2>
				<div class="space-y-2">
					{#each ['$match', '$project', '$group', '$sort', '$limit', '$skip', '$lookup', '$unwind', '$addFields', '$replaceRoot'] as stage}
						<button
							class="w-full text-left px-3 py-2 text-sm font-mono text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50"
						>
							{stage}
						</button>
					{/each}
				</div>
			</div>

			<div class="p-4 border-t border-gray-200">
				<h2 class="text-sm font-semibold text-gray-900 mb-3">Connection</h2>
				{#if connection}
					<div class="space-y-2">
						<button
							class="w-full px-3 py-2 text-sm text-left text-gray-700 bg-white border border-gray-200 rounded-lg"
						>
							<div class="flex items-center gap-2">
								<div class="w-2 h-2 bg-green-500 rounded-full"></div>
								<span>{connection.name}</span>
							</div>
						</button>

						<div class="relative">
							<button
								onclick={() => (showDatabaseSelector = !showDatabaseSelector)}
								class="w-full px-3 py-2 text-sm text-left text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-blue-500"
							>
								<div class="text-xs text-gray-500">Database</div>
								<div class="font-medium">
									{connection.selectedDatabase || 'Select database...'}
								</div>
							</button>
							{#if showDatabaseSelector}
								<div
									class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
								>
									{#each databases as db}
										<button
											onclick={() => handleSelectDatabase(db)}
											class="w-full px-3 py-2 text-sm text-left hover:bg-blue-50"
										>
											{db}
										</button>
									{/each}
								</div>
							{/if}
						</div>

						{#if connection.selectedDatabase}
							<div class="relative">
								<button
									onclick={() => (showCollectionSelector = !showCollectionSelector)}
									class="w-full px-3 py-2 text-sm text-left text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-blue-500"
								>
									<div class="text-xs text-gray-500">Collection</div>
									<div class="font-medium">
										{connection.selectedCollection || 'Select collection...'}
									</div>
								</button>
								{#if showCollectionSelector}
									<div
										class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
									>
										{#each collections as col}
											<button
												onclick={() => handleSelectCollection(col)}
												class="w-full px-3 py-2 text-sm text-left hover:bg-blue-50"
											>
												{col}
											</button>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{:else}
					<button
						onclick={() => (showConnectionModal = true)}
						class="w-full px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
					>
						Connect to MongoDB
					</button>
				{/if}
			</div>
		</aside>

		<!-- Editor and Results -->
		<div class="flex-1 flex flex-col">
			<!-- Editor -->
			<div class="flex-1 border-b border-gray-200">
				<div class="h-full">
					<MonacoEditor
						value={editorContent}
						language="json"
						theme="vs-dark"
						onChange={handleEditorChange}
					/>
				</div>
			</div>

			<!-- Results Panel -->
			<div class="h-1/3 bg-gray-900 text-white p-4 overflow-auto">
				<div class="flex items-center justify-between mb-3">
					<h3 class="text-sm font-semibold">Pipeline Results</h3>
					{#if results.length > 0}
						<span class="text-xs text-gray-400">{results.length} documents</span>
					{/if}
				</div>

				{#if error}
					<div class="p-3 bg-red-900 border border-red-700 rounded-lg mb-3">
						<p class="text-sm text-red-200">{error}</p>
					</div>
				{/if}

				{#if results.length > 0}
					<pre
						class="text-xs font-mono text-gray-300 whitespace-pre-wrap">{JSON.stringify(
							results,
							null,
							2
						)}</pre>
				{:else if !connection}
					<div class="text-sm text-gray-400">
						<p>Connect to MongoDB and run your pipeline to see results here.</p>
					</div>
				{:else if !connection.selectedDatabase || !connection.selectedCollection}
					<div class="text-sm text-gray-400">
						<p>Select a database and collection to run your pipeline.</p>
					</div>
				{:else}
					<div class="text-sm text-gray-400">
						<p>Click "Run Pipeline" to execute your aggregation.</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<ConnectionModal
	isOpen={showConnectionModal}
	onClose={() => (showConnectionModal = false)}
/>
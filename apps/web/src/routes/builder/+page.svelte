<script lang="ts">
import { api } from '$lib/api';
import ConnectionModal from '$lib/components/ConnectionModal.svelte';
import MonacoEditor from '$lib/components/MonacoEditor.svelte';
import StagePreview from '$lib/components/StagePreview.svelte';
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
let stageResults = $derived($pipelineStore.stageResults);
let viewMode = $derived($pipelineStore.viewMode);
let isExecuting = $derived($pipelineStore.isExecuting);
let error = $derived($pipelineStore.error);
let sampleSize = $derived($pipelineStore.sampleSize);
let maxSampleSize = $derived($pipelineStore.maxSampleSize);
let diff = $derived($pipelineStore.diff);

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

		// Check cache first
		const cached = pipelineStore.getCachedResult(
			pipeline,
			sampleSize,
			connection.id,
			connection.selectedDatabase,
			connection.selectedCollection
		);

		if (cached) {
			pipelineStore.setResults(cached.results);
			return;
		}

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
			// Cache the result
			pipelineStore.setCachedResult(
				pipeline,
				sampleSize,
				connection.id,
				connection.selectedDatabase,
				connection.selectedCollection,
				result.results,
				[]
			);
		} else {
			pipelineStore.setError(result.message || 'Pipeline execution failed');
		}
	} catch (err) {
		pipelineStore.setError(err instanceof Error ? err.message : 'Failed to run pipeline');
	} finally {
		pipelineStore.setExecuting(false);
	}
}

async function handleRunWithPreview() {
	if (!connection?.selectedDatabase || !connection?.selectedCollection) {
		pipelineStore.setError('Please select a database and collection');
		return;
	}

	try {
		const pipeline = JSON.parse(editorContent);

		// Check cache first
		const cached = pipelineStore.getCachedResult(
			pipeline,
			sampleSize,
			connection.id,
			connection.selectedDatabase,
			connection.selectedCollection
		);

		if (cached) {
			pipelineStore.setStageResults(cached.stageResults);
			return;
		}

		// Validate pipeline
		const validation = await api.validatePipeline(pipeline);
		if (!validation.valid) {
			pipelineStore.setError(validation.error || 'Invalid pipeline');
			return;
		}

		pipelineStore.setExecuting(true);
		pipelineStore.setError(null);

		const result = await api.executePipelineWithStages(
			connection.id,
			connection.selectedDatabase,
			connection.selectedCollection,
			pipeline,
			sampleSize,
		);

		if (result.success) {
			pipelineStore.setStageResults(result.stages);
			// Cache the result
			pipelineStore.setCachedResult(
				pipeline,
				sampleSize,
				connection.id,
				connection.selectedDatabase,
				connection.selectedCollection,
				[],
				result.stages
			);
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

<div style="height: 100vh; display: flex; flex-direction: column;">
	<!-- Header -->
	<header style="background: var(--glass-bg); backdrop-filter: blur(16px); border-bottom: 1px solid var(--glass-border); padding: var(--space-lg) var(--space-xl);">
		<div style="display: flex; align-items: center; justify-content: space-between;">
			<div>
				<h1 style="font-size: var(--text-2xl); font-weight: 600; color: var(--color-text-primary); margin-bottom: var(--space-xs);">Pipeline Builder</h1>
				<p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0;">
					{#if connection?.selectedDatabase && connection?.selectedCollection}
						{connection.selectedDatabase}.{connection.selectedCollection}
					{:else}
						Build and test MongoDB aggregation pipelines
					{/if}
				</p>
			</div>
			<div style="display: flex; gap: var(--space-md); align-items: center;">
				<!-- Sample Size Control -->
				<div style="display: flex; align-items: center; gap: var(--space-sm);">
					<label for="sample-size-input" style="font-size: var(--text-xs); color: var(--color-text-secondary);">
						Sample Size:
					</label>
					<input
						id="sample-size-input"
						type="number"
						min="1"
						max={maxSampleSize}
						value={sampleSize}
						oninput={(e) => {
							const value = parseInt((e.target as HTMLInputElement).value) || 10;
							const clampedValue = Math.min(Math.max(value, 1), maxSampleSize);
							pipelineStore.setSampleSize(clampedValue);
							// Update the input value to reflect the clamped value
							if (value !== clampedValue) {
								(e.target as HTMLInputElement).value = clampedValue.toString();
							}
						}}
						style="width: 4rem; padding: var(--space-xs); font-size: var(--text-xs); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); background: var(--color-bg-secondary); color: var(--color-text-primary);"
					/>
					<span style="font-size: var(--text-xs); color: var(--color-text-tertiary);">
						/ {maxSampleSize}
					</span>
				</div>

				<button class="btn btn-secondary">
					Save
				</button>
				<button
					onclick={() => pipelineStore.clearCache()}
					class="btn btn-ghost"
					style="font-size: var(--text-xs);"
					title="Clear cache"
				>
					🗑️ Clear Cache
				</button>
				<button
					onclick={() => pipelineStore.toggleDiff()}
					class="btn btn-ghost"
					style="font-size: var(--text-xs); background: {diff.showDiff ? 'var(--color-primary)' : 'transparent'}; color: {diff.showDiff ? 'white' : 'var(--color-text-secondary)'};"
					title="Toggle diff view"
				>
					🔍 Diff View
				</button>
				<button
					onclick={handleRunWithPreview}
					disabled={isExecuting || !connection}
					class="btn btn-primary"
					style="background: {isExecuting || !connection ? 'var(--color-bg-tertiary)' : '#7c3aed'}; color: white;"
				>
					{#if isExecuting}
						<span class="spinner"></span>
					{/if}
					{isExecuting ? 'Running...' : 'Run with Preview'}
				</button>
				<button
					onclick={handleRunPipeline}
					disabled={isExecuting || !connection}
					class="btn btn-primary"
				>
					{#if isExecuting}
						<span class="spinner"></span>
					{/if}
					{isExecuting ? 'Running...' : 'Run Pipeline'}
				</button>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<div style="flex: 1; display: flex; overflow: hidden;">
		<!-- Sidebar - Stage Library -->
		<aside style="width: 16rem; background: var(--color-bg-secondary); border-right: 1px solid var(--glass-border); overflow-y: auto;">
			<div style="padding: var(--space-lg);">
				<h2 style="font-size: var(--text-sm); font-weight: 600; color: var(--color-text-primary); margin-bottom: var(--space-md);">Pipeline Stages</h2>
				<div style="display: flex; flex-direction: column; gap: var(--space-sm);">
					{#each ['$match', '$project', '$group', '$sort', '$limit', '$skip', '$lookup', '$unwind', '$addFields', '$replaceRoot'] as stage}
						<button
							class="btn btn-ghost"
							style="justify-content: flex-start; font-family: var(--font-mono); width: 100%;"
						>
							{stage}
						</button>
					{/each}
				</div>
			</div>

			<div style="padding: var(--space-lg); border-top: 1px solid var(--glass-border);">
				<h2 style="font-size: var(--text-sm); font-weight: 600; color: var(--color-text-primary); margin-bottom: var(--space-md);">Connection</h2>
				{#if connection}
					<div style="display: flex; flex-direction: column; gap: var(--space-sm);">
						<button
							class="btn btn-secondary"
							style="justify-content: flex-start; width: 100%;"
						>
							<div style="display: flex; align-items: center; gap: var(--space-sm);">
								<div style="width: 0.5rem; height: 0.5rem; background: var(--color-success); border-radius: 50%;"></div>
								<span>{connection.name}</span>
							</div>
						</button>

						<div style="position: relative;">
							<button
								onclick={() => (showDatabaseSelector = !showDatabaseSelector)}
								class="btn btn-secondary"
								style="justify-content: flex-start; width: 100%; flex-direction: column; align-items: flex-start;"
							>
								<div style="font-size: var(--text-xs); color: var(--color-text-tertiary);">Database</div>
								<div style="font-weight: 500;">
									{connection.selectedDatabase || 'Select database...'}
								</div>
							</button>
							{#if showDatabaseSelector}
								<div class="dropdown-menu" style="width: 100%;">
									{#each databases as db}
										<button
											onclick={() => handleSelectDatabase(db)}
											class="dropdown-item"
										>
											{db}
										</button>
									{/each}
								</div>
							{/if}
						</div>

						{#if connection.selectedDatabase}
							<div style="position: relative;">
								<button
									onclick={() => (showCollectionSelector = !showCollectionSelector)}
									class="btn btn-secondary"
									style="justify-content: flex-start; width: 100%; flex-direction: column; align-items: flex-start;"
								>
									<div style="font-size: var(--text-xs); color: var(--color-text-tertiary);">Collection</div>
									<div style="font-weight: 500;">
										{connection.selectedCollection || 'Select collection...'}
									</div>
								</button>
								{#if showCollectionSelector}
									<div class="dropdown-menu" style="width: 100%;">
										{#each collections as col}
											<button
												onclick={() => handleSelectCollection(col)}
												class="dropdown-item"
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
						data-testid="connect-button"
						onclick={() => (showConnectionModal = true)}
						class="btn btn-primary"
						style="width: 100%;"
					>
						Connect to MongoDB
					</button>
				{/if}
			</div>
		</aside>

		<!-- Editor and Results -->
		<div style="flex: 1; display: flex; flex-direction: column;">
			<!-- Editor -->
			<div style="flex: 1; border-bottom: 1px solid var(--glass-border);">
				<div style="height: 100%;">
					<MonacoEditor
						value={editorContent}
						language="json"
						theme="vs-dark"
						onChange={handleEditorChange}
					/>
				</div>
			</div>

			<!-- Results Panel -->
			<div style="height: 33.333%; background: var(--color-bg-secondary); color: var(--color-text-primary); overflow: auto; border-top: 1px solid var(--glass-border);">
				{#if error}
					<div style="padding: var(--space-lg);">
						<div class="alert alert-error">
							<svg style="width: 1.25rem; height: 1.25rem; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
							</svg>
							<p style="font-size: var(--text-sm); margin: 0;">{error}</p>
						</div>
					</div>
				{/if}

				{#if viewMode === 'stages' && stageResults.length > 0}
					<StagePreview 
						stages={stageResults} 
						showDiff={diff.showDiff}
						highlightChanges={true}
					/>
				{:else if viewMode === 'results' && results.length > 0}
					<div style="padding: var(--space-lg);">
						<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-md);">
							<h3 style="font-size: var(--text-sm); font-weight: 600; margin: 0;">Pipeline Results</h3>
							<span class="badge badge-info">{results.length} documents</span>
						</div>
						<div class="code-block">
							<pre style="margin: 0; font-size: var(--text-sm); color: var(--color-text-secondary); white-space: pre-wrap;">{JSON.stringify(
								results,
								null,
								2
							)}</pre>
						</div>
					</div>
				{:else if !connection}
					<div style="padding: var(--space-lg);">
						<div style="font-size: var(--text-sm); color: var(--color-text-tertiary); text-align: center; padding: var(--space-2xl);">
							<svg style="width: 3rem; height: 3rem; margin: 0 auto var(--space-md); opacity: 0.5;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
							</svg>
							<p style="margin: 0;">Connect to MongoDB and run your pipeline to see results here.</p>
						</div>
					</div>
				{:else if !connection.selectedDatabase || !connection.selectedCollection}
					<div style="padding: var(--space-lg);">
						<div style="font-size: var(--text-sm); color: var(--color-text-tertiary); text-align: center; padding: var(--space-2xl);">
							<svg style="width: 3rem; height: 3rem; margin: 0 auto var(--space-md); opacity: 0.5;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
							</svg>
							<p style="margin: 0;">Select a database and collection to run your pipeline.</p>
						</div>
					</div>
				{:else}
					<div style="padding: var(--space-lg);">
						<div style="font-size: var(--text-sm); color: var(--color-text-tertiary); text-align: center; padding: var(--space-2xl);">
							<svg style="width: 3rem; height: 3rem; margin: 0 auto var(--space-md); opacity: 0.5;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
							</svg>
							<p style="margin: 0;">Click "Run Pipeline" or "Run with Preview" to execute your aggregation.</p>
						</div>
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
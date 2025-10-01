<script lang="ts">
import { api } from '$lib/api';
import ConnectionModal from '$lib/components/ConnectionModal.svelte';
import EmptyState from '$lib/components/EmptyState.svelte';
import LazyChartViewer from '$lib/components/LazyChartViewer.svelte';
import LoadingButton from '$lib/components/LoadingButton.svelte';
import MonacoEditor from '$lib/components/MonacoEditor.svelte';
import PipelineLoadingState from '$lib/components/PipelineLoadingState.svelte';
import PipelineManager from '$lib/components/PipelineManager.svelte';
import StagePreview from '$lib/components/StagePreview.svelte';
import { pipelineStore } from '$lib/stores/pipeline.store';
import { toastStore } from '$lib/stores/toast.store';
import { userStore } from '$lib/stores/user.store';
import { keyboardShortcuts } from '$lib/utils/keyboard-shortcuts';
import { onMount } from 'svelte';

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
const showConnectionModal = $state(false);
let showDatabaseSelector = $state(false);
let showCollectionSelector = $state(false);
let showPipelineManager = $state(false);
const showMobileMenu = $state(false);

// Initialize keyboard shortcuts
onMount(() => {
	keyboardShortcuts.register({
		key: 'Enter',
		ctrlKey: true,
		action: handleRunWithPreview,
		description: 'Run pipeline with preview'
	});

	keyboardShortcuts.register({
		key: 's',
		ctrlKey: true,
		action: () => {
			if (authState.isAuthenticated) {
				showPipelineManager = true;
			} else {
				toastStore.warning('Sign in required', 'Please sign in to save pipelines');
			}
		},
		description: 'Save pipeline'
	});

	keyboardShortcuts.register({
		key: 'o',
		ctrlKey: true,
		action: () => {
			if (authState.isAuthenticated) {
				showPipelineManager = true;
			} else {
				toastStore.warning('Sign in required', 'Please sign in to load pipelines');
			}
		},
		description: 'Open pipeline manager'
	});
});

const connection = $derived($pipelineStore.connection);
const databases = $derived($pipelineStore.databases);
const collections = $derived($pipelineStore.collections);
const results = $derived($pipelineStore.results);
const stageResults = $derived($pipelineStore.stageResults);
const viewMode = $derived($pipelineStore.viewMode);
const isExecuting = $derived($pipelineStore.isExecuting);
const error = $derived($pipelineStore.error);
const sampleSize = $derived($pipelineStore.sampleSize);
const maxSampleSize = $derived($pipelineStore.maxSampleSize);
const diff = $derived($pipelineStore.diff);
const authState = $derived($userStore);

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

function handleLoadPipeline(pipeline: any) {
	// Load pipeline data into the editor
	editorContent = JSON.stringify(pipeline.pipeline, null, 2);
	
	// Update pipeline store
	pipelineStore.setPipeline(pipeline.pipeline);
	
	// Set connection if available
	if (pipeline.connectionId && pipeline.database && pipeline.collection) {
		// Note: In a real app, you'd need to ensure the connection exists
		// For now, we'll just update the database and collection
		pipelineStore.selectDatabase(pipeline.database);
		pipelineStore.selectCollection(pipeline.collection);
	}
	
	// Set sample size if available
	if (pipeline.sampleSize) {
		pipelineStore.setSampleSize(pipeline.sampleSize);
	}
}

function openPipelineManager() {
	showPipelineManager = true;
}

function closePipelineManager() {
	showPipelineManager = false;
}

async function handleRunPipeline() {
	if (!connection?.selectedDatabase || !connection?.selectedCollection) {
		pipelineStore.setError('Please select a database and collection');
		toastStore.error('Configuration required', 'Please select a database and collection first');
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
			toastStore.info('Using cached results', 'Pipeline results loaded from cache');
			return;
		}

		// Validate pipeline
		const validation = await api.validatePipeline(pipeline);
		if (!validation.valid) {
			pipelineStore.setError(validation.error || 'Invalid pipeline');
			toastStore.error('Invalid pipeline', validation.error || 'Pipeline validation failed');
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
			toastStore.success('Pipeline executed', `Found ${result.results.length} documents`);
		} else {
			pipelineStore.setError(result.message || 'Pipeline execution failed');
			toastStore.error('Pipeline failed', result.message || 'Pipeline execution failed');
		}
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Failed to run pipeline';
		pipelineStore.setError(errorMessage);
		toastStore.error('Execution error', errorMessage);
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
			<div class="header-controls">
				<!-- Desktop Controls -->
				<div class="desktop-controls">
					<!-- Sample Size Control -->
					<div class="sample-size-control">
						<label for="sample-size-input" class="sample-size-label">
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
							class="sample-size-input"
						/>
						<span class="sample-size-max">
							/ {maxSampleSize}
						</span>
					</div>

					{#if authState.isAuthenticated}
						<button
							onclick={openPipelineManager}
							class="btn btn-secondary"
							title="Manage saved pipelines"
						>
							📚 Pipelines
						</button>
					{/if}
					<button
						onclick={() => pipelineStore.clearCache()}
						class="btn btn-ghost"
						title="Clear cache"
					>
						🗑️ Clear Cache
					</button>
					<button
						onclick={() => pipelineStore.toggleDiff()}
						class="btn btn-ghost"
						class:active={diff.showDiff}
						title="Toggle diff view"
					>
						🔍 Diff View
					</button>
					<LoadingButton
						loading={isExecuting}
						disabled={!connection}
						onclick={handleRunWithPreview}
						className="btn-primary"
						style="background: {!connection ? 'var(--color-bg-tertiary)' : '#7c3aed'}; color: white;"
					>
						Run with Preview
					</LoadingButton>
					<LoadingButton
						loading={isExecuting}
						disabled={!connection}
						onclick={handleRunPipeline}
						className="btn-primary"
					>
						Run Pipeline
					</LoadingButton>
				</div>

				<!-- Mobile Menu Button -->
				<button
					class="mobile-menu-button"
					onclick={() => showMobileMenu = !showMobileMenu}
					title="Toggle mobile menu"
				>
					☰
				</button>
			</div>

			<!-- Mobile Controls -->
			{#if showMobileMenu}
				<div class="mobile-controls">
					<div class="mobile-controls-content">
						<!-- Sample Size Control -->
						<div class="mobile-sample-size">
							<label for="mobile-sample-size-input" class="mobile-sample-size-label">
								Sample Size
							</label>
							<div class="mobile-sample-size-input-group">
								<input
									id="mobile-sample-size-input"
									type="number"
									min="1"
									max={maxSampleSize}
									value={sampleSize}
									oninput={(e) => {
										const value = parseInt((e.target as HTMLInputElement).value) || 10;
										const clampedValue = Math.min(Math.max(value, 1), maxSampleSize);
										pipelineStore.setSampleSize(clampedValue);
										if (value !== clampedValue) {
											(e.target as HTMLInputElement).value = clampedValue.toString();
										}
									}}
									class="mobile-sample-size-input"
								/>
								<span class="mobile-sample-size-max">/ {maxSampleSize}</span>
							</div>
						</div>

						<div class="mobile-buttons">
							{#if authState.isAuthenticated}
								<button
									onclick={() => { openPipelineManager(); showMobileMenu = false; }}
									class="btn btn-secondary mobile-btn"
								>
									📚 Pipelines
								</button>
							{/if}
							<button
								onclick={() => { pipelineStore.clearCache(); showMobileMenu = false; }}
								class="btn btn-ghost mobile-btn"
							>
								🗑️ Clear Cache
							</button>
							<button
								onclick={() => { pipelineStore.toggleDiff(); showMobileMenu = false; }}
								class="btn btn-ghost mobile-btn"
								class:active={diff.showDiff}
							>
								🔍 Diff View
							</button>
							<LoadingButton
								loading={isExecuting}
								disabled={!connection}
								onclick={() => { handleRunWithPreview(); showMobileMenu = false; }}
								className="btn-primary mobile-btn"
								style="background: {!connection ? 'var(--color-bg-tertiary)' : '#7c3aed'}; color: white;"
							>
								Run with Preview
							</LoadingButton>
							<LoadingButton
								loading={isExecuting}
								disabled={!connection}
								onclick={() => { handleRunPipeline(); showMobileMenu = false; }}
								className="btn-primary mobile-btn"
							>
								Run Pipeline
							</LoadingButton>
						</div>
					</div>
				</div>
			{/if}
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
				<!-- View Mode Toggle -->
				{#if results.length > 0 || stageResults.length > 0}
					<div style="padding: var(--space-md); border-bottom: 1px solid var(--glass-border); background: var(--color-bg-tertiary);">
						<div style="display: flex; align-items: center; gap: var(--space-sm);">
							<span style="font-size: var(--text-xs); font-weight: 600; color: var(--color-text-secondary);">
								View Mode:
							</span>
							<div style="display: flex; background: var(--color-bg-primary); border-radius: var(--radius-sm); padding: 2px;">
								<button
									onclick={() => pipelineStore.setViewMode('results')}
									class="btn btn-ghost"
									style="padding: var(--space-xs) var(--space-sm); font-size: var(--text-xs); background: {viewMode === 'results' ? 'var(--color-primary)' : 'transparent'}; color: {viewMode === 'results' ? 'white' : 'var(--color-text-secondary)'};"
								>
									📄 Results
								</button>
								<button
									onclick={() => pipelineStore.setViewMode('stages')}
									class="btn btn-ghost"
									style="padding: var(--space-xs) var(--space-sm); font-size: var(--text-xs); background: {viewMode === 'stages' ? 'var(--color-primary)' : 'transparent'}; color: {viewMode === 'stages' ? 'white' : 'var(--color-text-secondary)'};"
								>
									🔍 Stages
								</button>
								<button
									onclick={() => pipelineStore.setViewMode('chart')}
									class="btn btn-ghost"
									style="padding: var(--space-xs) var(--space-sm); font-size: var(--text-xs); background: {viewMode === 'chart' ? 'var(--color-primary)' : 'transparent'}; color: {viewMode === 'chart' ? 'white' : 'var(--color-text-secondary)'};"
								>
									📊 Chart
								</button>
							</div>
						</div>
					</div>
				{/if}

				{#if isExecuting}
					<PipelineLoadingState 
						stageCount={3}
						showStages={viewMode === 'stages'}
						message="Executing pipeline..."
					/>
				{:else if error}
					<div style="padding: var(--space-lg);">
						<div class="alert alert-error">
							<svg style="width: 1.25rem; height: 1.25rem; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
							</svg>
							<p style="font-size: var(--text-sm); margin: 0;">{error}</p>
						</div>
					</div>
				{:else if viewMode === 'stages' && stageResults.length > 0}
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
				{:else if viewMode === 'chart' && results.length > 0}
					<LazyChartViewer
						data={results}
						title="Pipeline Results Visualization"
						showControls={true}
						width="100%"
						height="100%"
					/>
				{:else if !connection}
					<EmptyState
						icon="🔌"
						title="Connect to MongoDB"
						description="Connect to your MongoDB database to start building and testing aggregation pipelines."
						action={{
							label: 'Connect Database',
							onClick: () => showConnectionModal = true
						}}
					/>
				{:else if !connection.selectedDatabase || !connection.selectedCollection}
					<EmptyState
						icon="📊"
						title="Select Database & Collection"
						description="Choose a database and collection to run your aggregation pipeline against."
						action={{
							label: 'Select Collection',
							onClick: () => showDatabaseSelector = true
						}}
					/>
				{:else}
					<EmptyState
						icon="⚡"
						title="Ready to Execute"
						description="Your pipeline is ready to run. Click the buttons above to execute it and see the results."
					/>
				{/if}
			</div>
		</div>
	</div>
</div>

<ConnectionModal
	isOpen={showConnectionModal}
	onClose={() => (showConnectionModal = false)}
/>

<PipelineManager
	isOpen={showPipelineManager}
	onClose={closePipelineManager}
	onLoadPipeline={handleLoadPipeline}
/>

<style>
	/* Header Controls */
	.header-controls {
		display: flex;
		gap: var(--space-md);
		align-items: center;
	}

	.desktop-controls {
		display: flex;
		gap: var(--space-md);
		align-items: center;
	}

	.mobile-menu-button {
		display: none;
		background: none;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-sm);
		padding: var(--space-sm);
		color: var(--color-text-primary);
		cursor: pointer;
		font-size: var(--text-lg);
		transition: all 0.2s ease;
	}

	.mobile-menu-button:hover {
		background: var(--color-bg-tertiary);
	}

	/* Sample Size Control */
	.sample-size-control {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.sample-size-label {
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
	}

	.sample-size-input {
		width: 4rem;
		padding: var(--space-xs);
		font-size: var(--text-xs);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-secondary);
		color: var(--color-text-primary);
	}

	.sample-size-max {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
	}

	/* Mobile Controls */
	.mobile-controls {
		display: none;
		background: var(--color-bg-secondary);
		border-top: 1px solid var(--glass-border);
		padding: var(--space-md);
		animation: slideDown 0.3s ease-out;
	}

	.mobile-controls-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.mobile-sample-size {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.mobile-sample-size-label {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.mobile-sample-size-input-group {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.mobile-sample-size-input {
		width: 5rem;
		padding: var(--space-sm);
		font-size: var(--text-sm);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-primary);
		color: var(--color-text-primary);
	}

	.mobile-sample-size-max {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
	}

	.mobile-buttons {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.mobile-btn {
		width: 100%;
		justify-content: center;
	}

	/* Button active state */
	.btn.active {
		background: var(--color-primary);
		color: white;
	}

	/* Responsive Design */
	@media (max-width: 1024px) {
		.desktop-controls {
			gap: var(--space-sm);
		}

		.sample-size-control {
			display: none;
		}
	}

	@media (max-width: 768px) {
		.desktop-controls {
			display: none;
		}

		.mobile-menu-button {
			display: block;
		}

		.mobile-controls {
			display: block;
		}

		.header-controls {
			justify-content: space-between;
		}
	}

	@media (max-width: 480px) {
		.mobile-controls {
			padding: var(--space-sm);
		}

		.mobile-buttons {
			gap: var(--space-xs);
		}

		.mobile-btn {
			padding: var(--space-sm);
			font-size: var(--text-sm);
		}
	}

	/* Main content responsive */
	@media (max-width: 768px) {
		.main-content {
			flex-direction: column;
		}

		.sidebar {
			width: 100%;
			height: auto;
			max-height: 200px;
			border-right: none;
			border-bottom: 1px solid var(--glass-border);
		}

		.editor-section {
			height: 50vh;
		}

		.results-section {
			height: 50vh;
		}
	}

	/* Connection selector responsive */
	@media (max-width: 480px) {
		.connection-selector {
			flex-direction: column;
			align-items: stretch;
			gap: var(--space-sm);
		}

		.connection-selector button {
			width: 100%;
			justify-content: center;
		}
	}
</style>
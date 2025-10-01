<script lang="ts">
	import { userStore } from '$lib/stores/user.store';
	import { pipelineStore } from '$lib/stores/pipeline.store';
	import { LocalStorageService, type LocalPipeline } from '$lib/services/local-storage.service';
	import { onMount } from 'svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onLoadPipeline?: (pipeline: any) => void;
	}

	let { isOpen, onClose, onLoadPipeline }: Props = $props();

	let activeTab = $state<'saved' | 'public' | 'templates'>('saved');
	let isLoading = $state(false);
	let error = $state('');
	let searchQuery = $state('');
	let selectedCategory = $state('');
	let selectedDifficulty = $state('');

	// Pipeline data
	let savedPipelines = $state<any[]>([]);
	let publicPipelines = $state<any[]>([]);
	let templates = $state<any[]>([]);
	let localPipelines = $state<LocalPipeline[]>([]);

	// Form data for saving
	let saveName = $state('');
	let saveDescription = $state('');
	let saveTags = $state('');
	let saveIsPublic = $state(false);
	let showSaveForm = $state(false);

	// Reactive state from stores
	let authState = $derived($userStore);
	let pipelineState = $derived($pipelineStore);

	// Initialize data when modal opens
	$effect(() => {
		if (isOpen) {
			loadPipelines();
		}
	});

	async function loadPipelines() {
		isLoading = true;
		error = '';

		try {
			if (authState.isAuthenticated) {
				// Load authenticated user pipelines
				const accessToken = localStorage.getItem('accessToken');
				if (!accessToken) throw new Error('Not authenticated');

				// Load saved pipelines
				const savedResponse = await fetch('/api/pipelines/saved', {
					headers: {
						'Authorization': `Bearer ${accessToken}`,
						'Content-Type': 'application/json'
					}
				});

				if (savedResponse.ok) {
					const savedData = await savedResponse.json();
					savedPipelines = savedData.data.pipelines || [];
				}

				// Load public pipelines
				const publicResponse = await fetch('/api/pipelines/saved/public', {
					headers: {
						'Authorization': `Bearer ${accessToken}`,
						'Content-Type': 'application/json'
					}
				});

				if (publicResponse.ok) {
					const publicData = await publicResponse.json();
					publicPipelines = publicData.data.pipelines || [];
				}

				// Load templates (filter public pipelines that are templates)
				templates = publicPipelines.filter(p => p.isTemplate);
			} else {
				// Load local storage pipelines for guest users
				localPipelines = LocalStorageService.getPipelines();
				
				// Load public pipelines (no auth required)
				const publicResponse = await fetch('/api/pipelines/saved/public');

				if (publicResponse.ok) {
					const publicData = await publicResponse.json();
					publicPipelines = publicData.data.pipelines || [];
					templates = publicPipelines.filter(p => p.isTemplate);
				}
			}

		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load pipelines';
		} finally {
			isLoading = false;
		}
	}

	async function savePipeline() {
		if (!pipelineState.connection) return;

		if (!saveName.trim()) {
			error = 'Pipeline name is required';
			return;
		}

		isLoading = true;
		error = '';

		try {
			const pipelineData = {
				name: saveName.trim(),
				description: saveDescription.trim() || undefined,
				tags: saveTags.split(',').map(tag => tag.trim()).filter(tag => tag),
				pipeline: pipelineState.pipeline,
				connectionId: pipelineState.connection.id,
				database: pipelineState.connection.selectedDatabase,
				collection: pipelineState.connection.selectedCollection,
				sampleSize: pipelineState.sampleSize,
				isPublic: saveIsPublic
			};

			if (authState.isAuthenticated) {
				// Save to server
				const accessToken = localStorage.getItem('accessToken');
				if (!accessToken) throw new Error('Not authenticated');

				const response = await fetch('/api/pipelines/saved', {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${accessToken}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(pipelineData)
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || 'Failed to save pipeline');
				}
			} else {
				// Save to local storage
				LocalStorageService.savePipeline(pipelineData);
			}

			// Reset form and reload pipelines
			saveName = '';
			saveDescription = '';
			saveTags = '';
			saveIsPublic = false;
			showSaveForm = false;
			await loadPipelines();

		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save pipeline';
		} finally {
			isLoading = false;
		}
	}

	async function loadPipeline(pipeline: any) {
		if (onLoadPipeline) {
			onLoadPipeline(pipeline);
		}
		onClose();
	}

	async function deletePipeline(pipelineId: string) {
		if (!confirm('Are you sure you want to delete this pipeline?')) return;

		isLoading = true;
		error = '';

		try {
			if (authState.isAuthenticated) {
				// Delete from server
				const accessToken = localStorage.getItem('accessToken');
				if (!accessToken) throw new Error('Not authenticated');

				const response = await fetch(`/api/pipelines/saved/${pipelineId}`, {
					method: 'DELETE',
					headers: {
						'Authorization': `Bearer ${accessToken}`,
						'Content-Type': 'application/json'
					}
				});

				if (!response.ok) {
					const data = await response.json();
					throw new Error(data.message || 'Failed to delete pipeline');
				}
			} else {
				// Delete from local storage
				LocalStorageService.deletePipeline(pipelineId);
			}

			await loadPipelines();

		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete pipeline';
		} finally {
			isLoading = false;
		}
	}

	async function duplicatePipeline(pipeline: any) {
		const newName = `${pipeline.name} (Copy)`;
		
		isLoading = true;
		error = '';

		try {
			const accessToken = localStorage.getItem('accessToken');
			if (!accessToken) throw new Error('Not authenticated');

			const response = await fetch(`/api/pipelines/saved/${pipeline._id}/duplicate`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name: newName })
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Failed to duplicate pipeline');
			}

			await loadPipelines();

		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to duplicate pipeline';
		} finally {
			isLoading = false;
		}
	}

	async function exportPipeline(pipeline: any) {
		try {
			const accessToken = localStorage.getItem('accessToken');
			if (!accessToken) throw new Error('Not authenticated');

			const response = await fetch(`/api/pipelines/saved/${pipeline._id}/export`, {
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json'
				}
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Failed to export pipeline');
			}

			// Download as JSON file
			const blob = new Blob([JSON.stringify(data.data.export, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${pipeline.name}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to export pipeline';
		}
	}

	function switchTab(tab: 'saved' | 'public' | 'templates') {
		activeTab = tab;
		error = '';
	}

	function getFilteredPipelines() {
		let pipelines: any[] = [];
		
		switch (activeTab) {
			case 'saved':
				pipelines = authState.isAuthenticated ? savedPipelines : localPipelines;
				break;
			case 'public':
				pipelines = publicPipelines;
				break;
			case 'templates':
				pipelines = templates;
				break;
		}

		// Apply filters
		if (searchQuery) {
			pipelines = pipelines.filter(p => 
				p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
			);
		}

		if (selectedCategory) {
			pipelines = pipelines.filter(p => p.metadata?.category === selectedCategory);
		}

		if (selectedDifficulty) {
			pipelines = pipelines.filter(p => p.metadata?.difficulty === selectedDifficulty);
		}

		return pipelines;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => document.removeEventListener('keydown', handleKeydown);
	});
</script>

{#if isOpen}
	<div
		class="pipeline-manager-overlay"
		onclick={onClose}
		role="dialog"
		aria-modal="true"
		aria-labelledby="pipeline-manager-title"
	>
		<div class="pipeline-manager" onclick={(e) => e.stopPropagation()}>
			<div class="pipeline-manager-header">
				<h2 id="pipeline-manager-title">Pipeline Manager</h2>
				<button class="pipeline-manager-close" onclick={onClose} aria-label="Close modal">
					×
				</button>
			</div>

			<div class="pipeline-manager-content">
				<div class="pipeline-tabs">
					<button
						class="pipeline-tab"
						class:active={activeTab === 'saved'}
						onclick={() => switchTab('saved')}
					>
						My Pipelines ({authState.isAuthenticated ? savedPipelines.length : localPipelines.length})
					</button>
					<button
						class="pipeline-tab"
						class:active={activeTab === 'public'}
						onclick={() => switchTab('public')}
					>
						Public ({publicPipelines.length})
					</button>
					<button
						class="pipeline-tab"
						class:active={activeTab === 'templates'}
						onclick={() => switchTab('templates')}
					>
						Templates ({templates.length})
					</button>
				</div>

				<div class="pipeline-filters">
					<input
						type="text"
						placeholder="Search pipelines..."
						bind:value={searchQuery}
						class="pipeline-search"
					/>
					<select bind:value={selectedCategory} class="pipeline-filter">
						<option value="">All Categories</option>
						<option value="data-analysis">Data Analysis</option>
						<option value="reporting">Reporting</option>
						<option value="data-transformation">Data Transformation</option>
						<option value="aggregation">Aggregation</option>
					</select>
					<select bind:value={selectedDifficulty} class="pipeline-filter">
						<option value="">All Difficulties</option>
						<option value="beginner">Beginner</option>
						<option value="intermediate">Intermediate</option>
						<option value="advanced">Advanced</option>
					</select>
				</div>

				{#if error}
					<div class="pipeline-error" role="alert">
						{error}
					</div>
				{/if}

				{#if activeTab === 'saved' && pipelineState.connection}
					<div class="pipeline-save-section">
						<button
							class="pipeline-save-button"
							onclick={() => showSaveForm = !showSaveForm}
							disabled={isLoading}
						>
							{showSaveForm ? 'Cancel' : (authState.isAuthenticated ? 'Save Current Pipeline' : 'Save Locally (Guest)')}
						</button>

						{#if showSaveForm}
							<div class="pipeline-save-form">
								<div class="form-group">
									<label for="save-name">Name *</label>
									<input
										id="save-name"
										type="text"
										bind:value={saveName}
										placeholder="Enter pipeline name"
										disabled={isLoading}
									/>
								</div>
								<div class="form-group">
									<label for="save-description">Description</label>
									<textarea
										id="save-description"
										bind:value={saveDescription}
										placeholder="Enter pipeline description"
										disabled={isLoading}
									></textarea>
								</div>
								<div class="form-group">
									<label for="save-tags">Tags (comma-separated)</label>
									<input
										id="save-tags"
										type="text"
										bind:value={saveTags}
										placeholder="e.g., aggregation, reporting, sales"
										disabled={isLoading}
									/>
								</div>
								{#if authState.isAuthenticated}
									<div class="form-group">
										<label class="checkbox-label">
											<input
												type="checkbox"
												bind:checked={saveIsPublic}
												disabled={isLoading}
											/>
											Make public
										</label>
									</div>
								{/if}
								<button
									class="pipeline-save-submit"
									onclick={savePipeline}
									disabled={isLoading || !saveName.trim()}
								>
									{isLoading ? 'Saving...' : 'Save Pipeline'}
								</button>
							</div>
						{/if}
					</div>
				{/if}

				<div class="pipeline-list">
					{#if isLoading}
						<div class="pipeline-loading">Loading pipelines...</div>
					{:else}
						{#each getFilteredPipelines() as pipeline (pipeline.id || pipeline._id)}
							<div class="pipeline-item">
								<div class="pipeline-info">
									<h3 class="pipeline-name">{pipeline.name}</h3>
									{#if pipeline.description}
										<p class="pipeline-description">{pipeline.description}</p>
									{/if}
									<div class="pipeline-meta">
										<span class="pipeline-stage-count">{pipeline.pipeline.length} stages</span>
										{#if pipeline.tags && pipeline.tags.length > 0}
											<div class="pipeline-tags">
												{#each pipeline.tags as tag}
													<span class="pipeline-tag">{tag}</span>
												{/each}
											</div>
										{/if}
										{#if pipeline.metadata?.category}
											<span class="pipeline-category">{pipeline.metadata.category}</span>
										{/if}
										{#if pipeline.metadata?.difficulty}
											<span class="pipeline-difficulty difficulty-{pipeline.metadata.difficulty}">
												{pipeline.metadata.difficulty}
											</span>
										{/if}
									</div>
								</div>
								<div class="pipeline-actions">
									<button
										class="pipeline-action load"
										onclick={() => loadPipeline(pipeline)}
										disabled={isLoading}
									>
										Load
									</button>
									{#if activeTab === 'saved'}
										<button
											class="pipeline-action duplicate"
											onclick={() => duplicatePipeline(pipeline)}
											disabled={isLoading}
										>
											Duplicate
										</button>
										<button
											class="pipeline-action export"
											onclick={() => exportPipeline(pipeline)}
											disabled={isLoading}
										>
											Export
										</button>
										<button
											class="pipeline-action delete"
											onclick={() => deletePipeline(pipeline._id)}
											disabled={isLoading}
										>
											Delete
										</button>
									{/if}
								</div>
							</div>
						{/each}
						{#if getFilteredPipelines().length === 0}
							<div class="pipeline-empty">
								No pipelines found
							</div>
						{/if}
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.pipeline-manager-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
	}

	.pipeline-manager {
		background: var(--color-bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-xl);
		width: 100%;
		max-width: 800px;
		margin: var(--space-md);
		max-height: 90vh;
		overflow-y: auto;
	}

	.pipeline-manager-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-lg);
		border-bottom: 1px solid var(--glass-border);
	}

	.pipeline-manager-header h2 {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.pipeline-manager-close {
		background: none;
		border: none;
		font-size: var(--text-xl);
		color: var(--color-text-secondary);
		cursor: pointer;
		padding: var(--space-xs);
		border-radius: var(--radius-sm);
		transition: all 0.2s ease;
	}

	.pipeline-manager-close:hover {
		background: var(--color-bg-secondary);
		color: var(--color-text-primary);
	}

	.pipeline-manager-content {
		padding: var(--space-lg);
	}

	.pipeline-tabs {
		display: flex;
		border-bottom: 1px solid var(--glass-border);
		margin-bottom: var(--space-lg);
	}

	.pipeline-tab {
		background: none;
		border: none;
		padding: var(--space-sm) var(--space-md);
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.2s ease;
	}

	.pipeline-tab:hover {
		color: var(--color-text-primary);
	}

	.pipeline-tab.active {
		color: var(--color-primary);
		border-bottom-color: var(--color-primary);
	}

	.pipeline-filters {
		display: flex;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}

	.pipeline-search {
		flex: 1;
		padding: var(--space-sm);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-secondary);
		color: var(--color-text-primary);
		font-size: var(--text-sm);
	}

	.pipeline-filter {
		padding: var(--space-sm);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-secondary);
		color: var(--color-text-primary);
		font-size: var(--text-sm);
		min-width: 120px;
	}

	.pipeline-error {
		background: var(--color-bg-error);
		color: var(--color-text-error);
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		margin-bottom: var(--space-md);
		font-size: var(--text-sm);
	}

	.pipeline-save-section {
		background: var(--color-bg-secondary);
		padding: var(--space-md);
		border-radius: var(--radius-sm);
		margin-bottom: var(--space-lg);
	}

	.pipeline-save-button {
		padding: var(--space-sm) var(--space-md);
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.pipeline-save-button:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}

	.pipeline-save-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.pipeline-save-form {
		margin-top: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.form-group label {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--color-text-primary);
	}

	.form-group input,
	.form-group textarea {
		padding: var(--space-sm);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-primary);
		color: var(--color-text-primary);
		font-size: var(--text-sm);
	}

	.form-group textarea {
		resize: vertical;
		min-height: 60px;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		cursor: pointer;
	}

	.checkbox-label input[type="checkbox"] {
		width: auto;
		margin: 0;
	}

	.pipeline-save-submit {
		padding: var(--space-sm) var(--space-md);
		background: var(--color-success);
		color: white;
		border: none;
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		cursor: pointer;
		transition: all 0.2s ease;
		align-self: flex-start;
	}

	.pipeline-save-submit:hover:not(:disabled) {
		background: var(--color-success-hover);
	}

	.pipeline-save-submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.pipeline-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.pipeline-loading,
	.pipeline-empty {
		text-align: center;
		padding: var(--space-lg);
		color: var(--color-text-secondary);
		font-style: italic;
	}

	.pipeline-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-md);
		background: var(--color-bg-secondary);
		border-radius: var(--radius-sm);
		border: 1px solid var(--glass-border);
		transition: all 0.2s ease;
	}

	.pipeline-item:hover {
		background: var(--color-bg-tertiary);
		border-color: var(--color-primary);
	}

	.pipeline-info {
		flex: 1;
	}

	.pipeline-name {
		margin: 0 0 var(--space-xs) 0;
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.pipeline-description {
		margin: 0 0 var(--space-xs) 0;
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
	}

	.pipeline-meta {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}

	.pipeline-stage-count {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
	}

	.pipeline-tags {
		display: flex;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}

	.pipeline-tag {
		padding: 2px var(--space-xs);
		background: var(--color-bg-primary);
		color: var(--color-text-secondary);
		border-radius: var(--radius-xs);
		font-size: var(--text-xs);
	}

	.pipeline-category {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		text-transform: capitalize;
	}

	.pipeline-difficulty {
		padding: 2px var(--space-xs);
		border-radius: var(--radius-xs);
		font-size: var(--text-xs);
		font-weight: 500;
		text-transform: capitalize;
	}

	.difficulty-beginner {
		background: var(--color-bg-success);
		color: var(--color-text-success);
	}

	.difficulty-intermediate {
		background: var(--color-bg-warning);
		color: var(--color-text-warning);
	}

	.difficulty-advanced {
		background: var(--color-bg-error);
		color: var(--color-text-error);
	}

	.pipeline-actions {
		display: flex;
		gap: var(--space-xs);
	}

	.pipeline-action {
		padding: var(--space-xs) var(--space-sm);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-primary);
		color: var(--color-text-primary);
		font-size: var(--text-xs);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.pipeline-action:hover:not(:disabled) {
		background: var(--color-bg-tertiary);
	}

	.pipeline-action:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.pipeline-action.load {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.pipeline-action.load:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}

	.pipeline-action.delete {
		background: var(--color-error);
		color: white;
		border-color: var(--color-error);
	}

	.pipeline-action.delete:hover:not(:disabled) {
		background: var(--color-error-hover);
	}
</style>

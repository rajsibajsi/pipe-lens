<script lang="ts">
	import type { DiffChange, DiffResult } from '$lib/utils/diff';
	import {
	  filterChangesByType,
	  formatPath,
	  getChangeTypeColor,
	  getChangeTypeIcon
	} from '$lib/utils/diff';
	import { onMount } from 'svelte';

	interface Props {
		diffResult: DiffResult;
		showUnchanged?: boolean;
		filterType?: DiffChange['type'] | 'all';
		maxDepth?: number;
		highlightChanges?: boolean;
	}

	const {
		diffResult,
		showUnchanged: initialShowUnchanged = false,
		filterType: initialFilterType = 'all',
		maxDepth = 10,
		highlightChanges = true
	}: Props = $props();

	let expandedPaths = $state(new Set<string>());
	let selectedChange = $state<DiffChange | null>(null);
	let showUnchanged = $state(initialShowUnchanged);
	let filterType = $state(initialFilterType);

	// Reactive state for filtered changes
	let filteredChanges: DiffChange[] = $state([]);
	
	$effect(() => {
		let changes = diffResult.changes;
		
		// Filter by type
		if (filterType !== 'all') {
			changes = filterChangesByType(changes, filterType);
		}
		
		// Filter out unchanged if not showing them
		if (!showUnchanged) {
			changes = changes.filter(change => change.type !== 'unchanged');
		}
		
		// Filter by depth
		changes = changes.filter(change => {
			const depth = change.path.split('.').length - 1;
			return depth <= maxDepth;
		});
		
		filteredChanges = changes;
	});

	onMount(() => {
		// Reset state when diff result changes
		expandedPaths = new Set();
		selectedChange = null;
	});

	function togglePath(path: string) {
		if (expandedPaths.has(path)) {
			expandedPaths.delete(path);
		} else {
			expandedPaths.add(path);
		}
		expandedPaths = new Set(expandedPaths); // Trigger reactivity
	}

	function isExpanded(path: string): boolean {
		return expandedPaths.has(path);
	}

	function selectChange(change: DiffChange) {
		selectedChange = change;
	}

	function formatValue(value: unknown): string {
		if (value === null) return 'null';
		if (value === undefined) return 'undefined';
		if (typeof value === 'string') return `"${value}"`;
		if (typeof value === 'object') {
			return Array.isArray(value) ? `[${value.length} items]` : `{${Object.keys(value).length} fields}`;
		}
		return String(value);
	}

	function renderChange(change: DiffChange, depth = 0): string {
		const indent = '  '.repeat(depth);
		const icon = getChangeTypeIcon(change.type);
		const color = getChangeTypeColor(change.type);
		const path = formatPath(change.path);
		
		let result = `${indent}${icon} ${path}`;
		
		if (change.type === 'added') {
			result += `: ${formatValue(change.newValue)}`;
		} else if (change.type === 'removed') {
			result += `: ${formatValue(change.oldValue)}`;
		} else if (change.type === 'modified') {
			result += `: ${formatValue(change.oldValue)} → ${formatValue(change.newValue)}`;
		} else if (change.type === 'unchanged') {
			result += `: ${formatValue(change.oldValue)}`;
		}
		
		return result;
	}

	function getChangeCounts() {
		return {
			added: diffResult.summary.added,
			removed: diffResult.summary.removed,
			modified: diffResult.summary.modified,
			unchanged: diffResult.summary.unchanged,
			total: diffResult.summary.total
		};
	}
</script>

<div class="diff-viewer">
	<!-- Header with summary and controls -->
	<div class="diff-header">
		<div class="diff-summary">
			<h4>Document Changes</h4>
			<div class="change-counts">
				{#if getChangeCounts().added > 0}
					<span class="change-count added">+{getChangeCounts().added}</span>
				{/if}
				{#if getChangeCounts().removed > 0}
					<span class="change-count removed">−{getChangeCounts().removed}</span>
				{/if}
				{#if getChangeCounts().modified > 0}
					<span class="change-count modified">~{getChangeCounts().modified}</span>
				{/if}
				{#if getChangeCounts().unchanged > 0 && showUnchanged}
					<span class="change-count unchanged">={getChangeCounts().unchanged}</span>
				{/if}
			</div>
		</div>
		
		<div class="diff-controls">
			<label class="control-item">
				<input 
					type="checkbox" 
					bind:checked={showUnchanged}
				/>
				Show Unchanged
			</label>
			
			<select bind:value={filterType} class="control-item">
				<option value="all">All Changes</option>
				<option value="added">Added Only</option>
				<option value="removed">Removed Only</option>
				<option value="modified">Modified Only</option>
			</select>
		</div>
	</div>

	<!-- Changes list -->
	<div class="diff-content">
		{#if filteredChanges.length === 0}
			<div class="no-changes">
				No changes found
			</div>
		{:else}
			<div class="changes-list">
				{#each filteredChanges as change (change.path)}
					<div
						class="change-item {change.type} {selectedChange === change ? 'selected' : ''}"
						onclick={() => selectChange(change)}
						onkeydown={(e) => e.key === 'Enter' && selectChange(change)}
						style="margin-left: {(change.path.split('.').length - 1) * 1}rem;"
						role="button"
						tabindex="0"
					>
						<div class="change-header">
							<span class="change-icon" style="color: {getChangeTypeColor(change.type)}">
								{getChangeTypeIcon(change.type)}
							</span>
							<span class="change-path">{formatPath(change.path)}</span>
							{#if hasNestedChanges(change)}
								<span 
									class="expand-button"
									onclick={(e) => { e.stopPropagation(); togglePath(change.path); }}
									onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); togglePath(change.path); }}}
									role="button"
									tabindex="0"
								>
									{isExpanded(change.path) ? '−' : '+'}
								</span>
							{/if}
						</div>
						
						<div class="change-values">
							{#if change.type === 'added'}
								<span class="new-value">{formatValue(change.newValue)}</span>
							{:else if change.type === 'removed'}
								<span class="old-value">{formatValue(change.oldValue)}</span>
							{:else if change.type === 'modified'}
								<span class="old-value">{formatValue(change.oldValue)}</span>
								<span class="arrow">→</span>
								<span class="new-value">{formatValue(change.newValue)}</span>
							{:else if change.type === 'unchanged'}
								<span class="unchanged-value">{formatValue(change.oldValue)}</span>
							{/if}
						</div>
						
						{#if hasNestedChanges(change) && isExpanded(change.path) && change.children}
							<div class="nested-changes">
								{#each change.children as childChange (childChange.path)}
									<div class="nested-change {childChange.type}">
										<span class="nested-icon" style="color: {getChangeTypeColor(childChange.type)}">
											{getChangeTypeIcon(childChange.type)}
										</span>
										<span class="nested-path">{formatPath(childChange.path)}</span>
										<span class="nested-value">
											{#if childChange.type === 'added'}
												{formatValue(childChange.newValue)}
											{:else if childChange.type === 'removed'}
												{formatValue(childChange.oldValue)}
											{:else if childChange.type === 'modified'}
												{formatValue(childChange.oldValue)} → {formatValue(childChange.newValue)}
											{:else}
												{formatValue(childChange.oldValue)}
											{/if}
										</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Selected change details -->
	{#if selectedChange}
		<div class="change-details">
			<h5>Change Details</h5>
			<div class="detail-item">
				<strong>Path:</strong> {selectedChange.path}
			</div>
			<div class="detail-item">
				<strong>Type:</strong> {selectedChange.type}
			</div>
			{#if selectedChange.oldValue !== undefined}
				<div class="detail-item">
					<strong>Old Value:</strong> 
					<pre>{JSON.stringify(selectedChange.oldValue, null, 2)}</pre>
				</div>
			{/if}
			{#if selectedChange.newValue !== undefined}
				<div class="detail-item">
					<strong>New Value:</strong> 
					<pre>{JSON.stringify(selectedChange.newValue, null, 2)}</pre>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.diff-viewer {
		display: flex;
		flex-direction: column;
		height: 100%;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: var(--text-xs);
	}

	.diff-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-sm);
		border-bottom: 1px solid var(--glass-border);
		background: var(--color-bg-secondary);
	}

	.diff-summary h4 {
		margin: 0 0 var(--space-xs) 0;
		font-size: var(--text-sm);
		color: var(--color-text-primary);
	}

	.change-counts {
		display: flex;
		gap: var(--space-xs);
	}

	.change-count {
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		font-weight: 600;
	}

	.change-count.added {
		background: var(--color-success);
		color: white;
	}

	.change-count.removed {
		background: var(--color-error);
		color: white;
	}

	.change-count.modified {
		background: var(--color-warning);
		color: white;
	}

	.change-count.unchanged {
		background: var(--color-text-tertiary);
		color: var(--color-bg-primary);
	}

	.diff-controls {
		display: flex;
		gap: var(--space-md);
		align-items: center;
	}

	.control-item {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
	}

	.control-item input[type="checkbox"] {
		margin: 0;
	}

	/* .control-item select styles removed - no longer needed */

	.diff-content {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-sm);
	}

	.no-changes {
		text-align: center;
		color: var(--color-text-tertiary);
		padding: var(--space-lg);
	}

	.changes-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.change-item {
		padding: var(--space-xs);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: background-color 0.2s ease;
		border: none;
		background: transparent;
		text-align: left;
		width: 100%;
	}

	.change-item:hover {
		background: var(--color-bg-secondary);
	}

	.change-item.selected {
		background: var(--color-primary);
		color: white;
	}

	.change-item.added {
		border-left: 3px solid var(--color-success);
	}

	.change-item.removed {
		border-left: 3px solid var(--color-error);
	}

	.change-item.modified {
		border-left: 3px solid var(--color-warning);
	}

	.change-item.unchanged {
		border-left: 3px solid var(--color-text-tertiary);
	}

	.change-header {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		margin-bottom: 2px;
	}

	.change-icon {
		font-weight: bold;
		width: 1rem;
		text-align: center;
	}

	.change-path {
		font-weight: 500;
		color: var(--color-text-primary);
	}

	.expand-button {
		width: 1rem;
		height: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
	}

	.expand-button:hover {
		background: var(--color-bg-secondary);
	}

	.change-values {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		margin-left: 1.5rem;
	}

	.old-value {
		color: var(--color-error);
		background: rgba(var(--color-error-rgb), 0.1);
		padding: 2px 4px;
		border-radius: var(--radius-xs);
	}

	.new-value {
		color: var(--color-success);
		background: rgba(var(--color-success-rgb), 0.1);
		padding: 2px 4px;
		border-radius: var(--radius-xs);
	}

	.unchanged-value {
		color: var(--color-text-secondary);
	}

	.arrow {
		color: var(--color-text-tertiary);
		font-weight: bold;
	}

	.nested-changes {
		margin-left: 1rem;
		margin-top: var(--space-xs);
		border-left: 1px solid var(--glass-border);
		padding-left: var(--space-sm);
	}

	.nested-change {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		padding: 2px 0;
		font-size: 0.75rem;
	}

	.nested-icon {
		width: 0.75rem;
		text-align: center;
		font-weight: bold;
	}

	.nested-path {
		color: var(--color-text-secondary);
	}

	.nested-value {
		color: var(--color-text-tertiary);
	}

	.change-details {
		padding: var(--space-sm);
		border-top: 1px solid var(--glass-border);
		background: var(--color-bg-secondary);
		max-height: 200px;
		overflow-y: auto;
	}

	.change-details h5 {
		margin: 0 0 var(--space-sm) 0;
		font-size: var(--text-sm);
		color: var(--color-text-primary);
	}

	.detail-item {
		margin-bottom: var(--space-xs);
		font-size: var(--text-xs);
	}

	.detail-item strong {
		color: var(--color-text-primary);
	}

	.detail-item pre {
		margin: var(--space-xs) 0 0 0;
		padding: var(--space-xs);
		background: var(--color-bg-primary);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-sm);
		overflow-x: auto;
		font-size: 0.75rem;
	}
</style>
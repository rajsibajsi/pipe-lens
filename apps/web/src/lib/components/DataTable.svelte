<script lang="ts">
	import type { TableData } from '$lib/utils/chart-data';

	interface Props {
		data: TableData;
		title?: string;
		maxHeight?: string;
		showExport?: boolean;
	}

	const { 
		data, 
		title = 'Data Table',
		maxHeight = '400px',
		showExport = true
	}: Props = $props();

	let sortColumn = $state<string | null>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');
	let searchTerm = $state('');
	let currentPage = $state(1);
	let pageSize = $state(50);

	// Computed properties
	let filteredData = $state<(string | number)[][]>([]);
	let sortedData = $state<(string | number)[][]>([]);
	let paginatedData = $state<(string | number)[][]>([]);
	let totalPages = $state(0);

	$effect(() => {
		if (!searchTerm) {
			filteredData = data.rows;
		} else {
			filteredData = data.rows.filter(row => 
				row.some(cell => 
					String(cell).toLowerCase().includes(searchTerm.toLowerCase())
				)
			);
		}
	});

	$effect(() => {
		if (!sortColumn) {
			sortedData = filteredData;
		} else {
			const columnIndex = data.columns.indexOf(sortColumn);
			if (columnIndex === -1) {
				sortedData = filteredData;
			} else {
				sortedData = [...filteredData].sort((a, b) => {
					const aVal = a[columnIndex];
					const bVal = b[columnIndex];
					
					// Try to parse as numbers
					const aNum = parseFloat(String(aVal));
					const bNum = parseFloat(String(bVal));
					
					if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
						return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
					}
					
					// String comparison
					const aStr = String(aVal).toLowerCase();
					const bStr = String(bVal).toLowerCase();
					
					if (sortDirection === 'asc') {
						return aStr.localeCompare(bStr);
					} else {
						return bStr.localeCompare(aStr);
					}
				});
			}
		}
	});

	$effect(() => {
		const start = (currentPage - 1) * pageSize;
		const end = start + pageSize;
		paginatedData = sortedData.slice(start, end);
		totalPages = Math.ceil(sortedData.length / pageSize);
	});

	function sort(column: string) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
		currentPage = 1; // Reset to first page when sorting
	}

	function exportToCSV() {
		const csvContent = [
			data.columns.join(','),
			...data.rows.map(row => 
				row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
			)
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${title || 'data'}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}

	function exportToJSON() {
		const jsonData = data.rows.map(row => {
			const obj: Record<string, unknown> = {};
			data.columns.forEach((column, index) => {
				obj[column] = row[index];
			});
			return obj;
		});

		const jsonContent = JSON.stringify(jsonData, null, 2);
		const blob = new Blob([jsonContent], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${title || 'data'}.json`;
		link.click();
		URL.revokeObjectURL(url);
	}

	function getSortIcon(column: string): string {
		if (sortColumn !== column) return '↕️';
		return sortDirection === 'asc' ? '↑' : '↓';
	}
</script>

<div class="data-table-container">
	<div class="table-header">
		<h4 class="table-title">{title}</h4>
		<div class="table-controls">
			<div class="search-container">
				<input
					type="text"
					placeholder="Search..."
					bind:value={searchTerm}
					class="search-input"
				/>
			</div>
			{#if showExport}
				<div class="export-buttons">
					<button 
						class="btn btn-ghost btn-sm"
						onclick={exportToCSV}
						title="Export as CSV"
					>
						📄 CSV
					</button>
					<button 
						class="btn btn-ghost btn-sm"
						onclick={exportToJSON}
						title="Export as JSON"
					>
						📋 JSON
					</button>
				</div>
			{/if}
		</div>
	</div>

	<div class="table-content" style="max-height: {maxHeight};">
		{#if data.columns.length === 0}
			<div class="empty-state">
				<p>No data to display</p>
			</div>
		{:else}
			<table class="data-table">
				<thead>
					<tr>
						{#each data.columns as column, index}
							<th 
								class="sortable-header"
								onclick={() => sort(column)}
								role="button"
								tabindex="0"
								onkeydown={(e) => e.key === 'Enter' && sort(column)}
							>
								<span class="column-name">{column}</span>
								<span class="sort-icon">{getSortIcon(column)}</span>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each paginatedData as row, rowIndex}
						<tr class="data-row">
							{#each row as cell, cellIndex}
								<td class="data-cell">
									{String(cell)}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>

	{#if data.columns.length > 0 && totalPages > 1}
		<div class="table-footer">
			<div class="pagination-info">
				Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
			</div>
			<div class="pagination-controls">
				<button 
					class="btn btn-ghost btn-sm"
					onclick={() => currentPage = Math.max(1, currentPage - 1)}
					disabled={currentPage === 1}
				>
					← Previous
				</button>
				<span class="page-info">
					Page {currentPage} of {totalPages}
				</span>
				<button 
					class="btn btn-ghost btn-sm"
					onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
					disabled={currentPage === totalPages}
				>
					Next →
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.data-table-container {
		display: flex;
		flex-direction: column;
		background: var(--color-bg-secondary);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.table-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-md);
		border-bottom: 1px solid var(--glass-border);
		background: var(--color-bg-tertiary);
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.table-title {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0;
	}

	.table-controls {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.search-container {
		position: relative;
	}

	.search-input {
		padding: var(--space-xs) var(--space-sm);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-secondary);
		color: var(--color-text-primary);
		font-size: var(--text-xs);
		width: 200px;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.export-buttons {
		display: flex;
		gap: var(--space-xs);
	}

	.table-content {
		overflow: auto;
		flex: 1;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--text-xs);
	}

	.sortable-header {
		background: var(--color-bg-tertiary);
		color: var(--color-text-primary);
		font-weight: 600;
		padding: var(--space-sm);
		text-align: left;
		cursor: pointer;
		user-select: none;
		position: sticky;
		top: 0;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.sortable-header:hover {
		background: var(--color-bg-primary);
	}

	.sortable-header:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: -2px;
	}

	.column-name {
		flex: 1;
	}

	.sort-icon {
		margin-left: var(--space-xs);
		font-size: 0.8em;
	}

	.data-row {
		border-bottom: 1px solid var(--glass-border);
	}

	.data-row:hover {
		background: var(--color-bg-tertiary);
	}

	.data-cell {
		padding: var(--space-sm);
		color: var(--color-text-secondary);
		border-right: 1px solid var(--glass-border);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 200px;
	}

	.data-cell:last-child {
		border-right: none;
	}

	.empty-state {
		text-align: center;
		padding: var(--space-xl);
		color: var(--color-text-tertiary);
	}

	.table-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-sm) var(--space-md);
		border-top: 1px solid var(--glass-border);
		background: var(--color-bg-tertiary);
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.pagination-info {
		flex: 1;
	}

	.pagination-controls {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.page-info {
		font-weight: 500;
		color: var(--color-text-primary);
	}
</style>

<script lang="ts">
	interface DocumentViewerProps {
		documents: unknown[];
		title?: string;
		maxHeight?: string;
		showFieldTypes?: boolean;
		highlightChanges?: boolean;
		previousDocuments?: unknown[];
	}

	let {
		documents,
		title = 'Documents',
		maxHeight = '300px',
		showFieldTypes = true,
		highlightChanges = false,
		previousDocuments = []
	}: DocumentViewerProps = $props();

	let expandedFields = $state<Set<string>>(new Set());
	let selectedDocument = $state<number>(0);

	function toggleField(path: string) {
		if (expandedFields.has(path)) {
			expandedFields.delete(path);
		} else {
			expandedFields.add(path);
		}
		expandedFields = new Set(expandedFields);
	}

	function getFieldType(value: unknown): string {
		if (value === null) return 'null';
		if (Array.isArray(value)) return 'array';
		if (typeof value === 'object') return 'object';
		return typeof value;
	}

	function getFieldIcon(type: string): string {
		switch (type) {
			case 'string': return '📝';
			case 'number': return '🔢';
			case 'boolean': return '✅';
			case 'object': return '📦';
			case 'array': return '📋';
			case 'null': return '❌';
			default: return '❓';
		}
	}

	function formatValue(value: unknown, maxLength = 100): string {
		if (value === null) return 'null';
		if (typeof value === 'string') {
			return value.length > maxLength ? `"${value.substring(0, maxLength)}..."` : `"${value}"`;
		}
		if (typeof value === 'number' || typeof value === 'boolean') {
			return String(value);
		}
		if (Array.isArray(value)) {
			return `[${value.length} items]`;
		}
		if (typeof value === 'object') {
			const keys = Object.keys(value as Record<string, unknown>);
			return `{${keys.length} properties}`;
		}
		return String(value);
	}

	function hasChanged(path: string, currentValue: unknown): boolean {
		if (!highlightChanges || !previousDocuments[selectedDocument]) return false;
		
		const prevDoc = previousDocuments[selectedDocument] as Record<string, unknown>;
		const pathParts = path.split('.');
		let prevValue = prevDoc;
		
		for (const part of pathParts) {
			if (prevValue && typeof prevValue === 'object' && part in prevValue) {
				prevValue = (prevValue as Record<string, unknown>)[part];
			} else {
				return true; // Field was added
			}
		}
		
		return JSON.stringify(prevValue) !== JSON.stringify(currentValue);
	}

	function renderObject(obj: Record<string, unknown>, path = '', depth = 0): unknown[] {
		const items: unknown[] = [];
		
		for (const [key, value] of Object.entries(obj)) {
			const currentPath = path ? `${path}.${key}` : key;
			const fieldType = getFieldType(value);
			const isExpanded = expandedFields.has(currentPath);
			const hasChanged = hasChanged(currentPath, value);
			
			items.push({
				key,
				value,
				path: currentPath,
				type: fieldType,
				isExpanded,
				hasChanged,
				depth
			});
			
			if (isExpanded && (fieldType === 'object' || fieldType === 'array')) {
				if (fieldType === 'object' && typeof value === 'object' && value !== null) {
					items.push(...renderObject(value as Record<string, unknown>, currentPath, depth + 1));
				} else if (fieldType === 'array' && Array.isArray(value)) {
					value.forEach((item, index) => {
						const itemPath = `${currentPath}[${index}]`;
						const itemType = getFieldType(item);
						const itemExpanded = expandedFields.has(itemPath);
						const itemChanged = hasChanged(itemPath, item);
						
						items.push({
							key: `[${index}]`,
							value: item,
							path: itemPath,
							type: itemType,
							isExpanded: itemExpanded,
							hasChanged: itemChanged,
							depth: depth + 1,
							isArrayItem: true
						});
						
						if (itemExpanded && typeof item === 'object' && item !== null) {
							items.push(...renderObject(item as Record<string, unknown>, itemPath, depth + 2));
						}
					});
				}
			}
		}
		
		return items;
	}

	$: documentItems = documents.length > 0 ? renderObject(documents[selectedDocument] as Record<string, unknown>) : [];
</script>

<div style="display: flex; flex-direction: column; height: 100%;">
	<!-- Header -->
	<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-md); padding-bottom: var(--space-sm); border-bottom: 1px solid var(--glass-border);">
		<div style="display: flex; align-items: center; gap: var(--space-sm);">
			<h4 style="font-size: var(--text-sm); font-weight: 600; color: var(--color-text-primary); margin: 0;">
				{title}
			</h4>
			{#if documents.length > 1}
				<div style="display: flex; align-items: center; gap: var(--space-xs);">
					<button
						onclick={() => selectedDocument = Math.max(0, selectedDocument - 1)}
						disabled={selectedDocument === 0}
						class="btn btn-ghost"
						style="padding: var(--space-xs); font-size: var(--text-xs);"
					>
						←
					</button>
					<span style="font-size: var(--text-xs); color: var(--color-text-tertiary);">
						{selectedDocument + 1} of {documents.length}
					</span>
					<button
						onclick={() => selectedDocument = Math.min(documents.length - 1, selectedDocument + 1)}
						disabled={selectedDocument === documents.length - 1}
						class="btn btn-ghost"
						style="padding: var(--space-xs); font-size: var(--text-xs);"
					>
						→
					</button>
				</div>
			{/if}
		</div>
		
		{#if documents.length > 0}
			<span style="font-size: var(--text-xs); color: var(--color-text-tertiary);">
				{Object.keys((documents[selectedDocument] as Record<string, unknown>) || {}).length} fields
			</span>
		{/if}
	</div>

	<!-- Document Content -->
	<div style="flex: 1; overflow-y: auto; max-height: {maxHeight};">
		{#if documents.length === 0}
			<div style="text-align: center; padding: var(--space-xl); color: var(--color-text-tertiary);">
				<svg style="width: 2rem; height: 2rem; margin: 0 auto var(--space-sm); opacity: 0.5;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
				</svg>
				<p style="font-size: var(--text-sm); margin: 0;">No documents to display</p>
			</div>
		{:else}
			<div style="font-family: var(--font-mono); font-size: var(--text-xs); line-height: 1.5;">
				{#each documentItems as item}
					<div
						style="display: flex; align-items: flex-start; gap: var(--space-xs); padding: 2px 0; margin-left: {item.depth * 1}rem;"
					>
						<!-- Expand/Collapse Button -->
						{#if item.type === 'object' || item.type === 'array'}
							<button
								onclick={() => toggleField(item.path)}
								style="width: 1rem; height: 1rem; display: flex; align-items: center; justify-content: center; background: transparent; border: none; cursor: pointer; color: var(--color-text-tertiary); font-size: var(--text-xs);"
							>
								{item.isExpanded ? '−' : '+'}
							</button>
						{:else}
							<span style="width: 1rem; height: 1rem; display: flex; align-items: center; justify-content: center; color: transparent;">•</span>
						{/if}

						<!-- Field Name -->
						<span
							style="color: {item.hasChanged && highlightChanges ? 'var(--color-warning)' : 'var(--color-primary)'}; font-weight: 500;"
						>
							{item.key}:
						</span>

						<!-- Field Type Icon -->
						{#if showFieldTypes}
							<span style="color: var(--color-text-tertiary);" title="Type: {item.type}">
								{getFieldIcon(item.type)}
							</span>
						{/if}

						<!-- Field Value -->
						<span
							style="color: {item.hasChanged && highlightChanges ? 'var(--color-warning)' : 'var(--color-text-secondary)'};"
						>
							{formatValue(item.value)}
						</span>

						<!-- Change Indicator -->
						{#if item.hasChanged && highlightChanges}
							<span style="color: var(--color-warning); font-size: 0.75rem;" title="Field changed">
								●
							</span>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<script lang="ts">
/** biome-ignore-all lint/style/useConst: <explanation> */
/** biome-ignore-all lint/correctness/noUnusedVariables: <explanation> */

import { onMount } from 'svelte';

interface DocumentItem {
	key: string;
	value: unknown;
	type: string;
	path: string;
	depth: number;
	isExpanded: boolean;
	hasChanged: boolean;
}

interface Props {
	documents: unknown[];
	title?: string;
	showFieldTypes?: boolean;
	highlightChanges?: boolean;
	previousDocuments?: unknown[];
	maxHeight?: string;
}

const {
	documents = [],
	title = 'Document Viewer',
	showFieldTypes = true,
	highlightChanges = false,
	previousDocuments = [],
	maxHeight = '400px',
}: Props = $props();
const __use = (..._args: unknown[]) => {};
__use(title, showFieldTypes, maxHeight);

let selectedDocument = $state(0);
let expandedFields = $state(new Set<string>());

// Derived state for document items
const _documentItems = $derived(
	documents.length > 0 ? renderObject(documents[selectedDocument] as Record<string, unknown>) : [],
);

onMount(() => {
	// Reset state when documents change
	selectedDocument = 0;
	expandedFields = new Set();
});

function getType(value: unknown): string {
	if (value === null) return 'null';
	if (Array.isArray(value)) return 'array';
	return typeof value;
}

function getFieldIcon(type: string): string {
	const icons: Record<string, string> = {
		string: '📝',
		number: '🔢',
		boolean: '✅',
		object: '📦',
		array: '📋',
		null: '❌',
		undefined: '❓',
	};
	return icons[type] || '❓';
}

function toggleField(path: string) {
	if (expandedFields.has(path)) {
		expandedFields.delete(path);
	} else {
		expandedFields.add(path);
	}
	expandedFields = new Set(expandedFields); // Trigger reactivity
}

function isExpanded(path: string): boolean {
	return expandedFields.has(path);
}

function hasChanged(path: string, _value: unknown): boolean {
	if (!highlightChanges || !previousDocuments.length) return false;

	const currentDoc = documents[selectedDocument] as Record<string, unknown>;
	const prevDoc = previousDocuments[selectedDocument] as Record<string, unknown>;

	if (!prevDoc) return false;

	const pathParts = path.split('.');
	let currentValue: unknown = currentDoc;
	let prevValue: unknown = prevDoc;

	for (const part of pathParts) {
		if (currentValue && typeof currentValue === 'object' && part in currentValue) {
			currentValue = (currentValue as Record<string, unknown>)[part];
		} else {
			currentValue = undefined;
		}

		if (prevValue && typeof prevValue === 'object' && part in prevValue) {
			prevValue = (prevValue as Record<string, unknown>)[part];
		} else {
			prevValue = undefined;
		}
	}

	return JSON.stringify(currentValue) !== JSON.stringify(prevValue);
}

function formatValue(value: unknown): string {
	if (value === null) return 'null';
	if (value === undefined) return 'undefined';
	if (typeof value === 'string') return `"${value}"`;
	if (typeof value === 'object') {
		return Array.isArray(value)
			? `[${value.length} items]`
			: `{${Object.keys(value).length} fields}`;
	}
	return String(value);
}

function renderObject(obj: Record<string, unknown>, path = '', depth = 0): DocumentItem[] {
	const items: DocumentItem[] = [];

	for (const [key, value] of Object.entries(obj)) {
		const currentPath = path ? `${path}.${key}` : key;
		const type = getType(value);
		const isExpanded = expandedFields.has(currentPath);
		const hasValueChanged = hasChanged(currentPath, value);

		items.push({
			key,
			value,
			type,
			path: currentPath,
			depth,
			isExpanded,
			hasChanged: hasValueChanged,
		});

		// Add children if expanded and is object/array
		if (isExpanded && (type === 'object' || type === 'array')) {
			if (type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
				items.push(...renderObject(value as Record<string, unknown>, currentPath, depth + 1));
			} else if (type === 'array' && Array.isArray(value)) {
				items.push(...renderArray(value, currentPath, depth + 1));
			}
		}
	}

	return items;
}

function renderArray(arr: unknown[], path: string, depth: number): DocumentItem[] {
	const items: DocumentItem[] = [];

	for (let i = 0; i < arr.length; i++) {
		const value = arr[i];
		const currentPath = `${path}[${i}]`;
		const type = getType(value);
		const isExpanded = expandedFields.has(currentPath);
		const hasValueChanged = hasChanged(currentPath, value);

		items.push({
			key: `[${i}]`,
			value,
			type,
			path: currentPath,
			depth,
			isExpanded,
			hasChanged: hasValueChanged,
		});

		// Add children if expanded and is object/array
		if (isExpanded && (type === 'object' || type === 'array')) {
			if (type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
				items.push(...renderObject(value as Record<string, unknown>, currentPath, depth + 1));
			} else if (type === 'array' && Array.isArray(value)) {
				items.push(...renderArray(value, currentPath, depth + 1));
			}
		}
	}

	return items;
}

function nextDocument() {
	if (selectedDocument < documents.length - 1) {
		selectedDocument++;
	}
}

function prevDocument() {
	if (selectedDocument > 0) {
		selectedDocument--;
	}
}
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
						onclick={prevDocument}
						disabled={selectedDocument === 0}
						style="padding: var(--space-xs); background: transparent; border: 1px solid var(--glass-border); border-radius: var(--radius-sm); color: var(--color-text-secondary); cursor: pointer; font-size: var(--text-xs);"
					>
						←
					</button>
					<span style="font-size: var(--text-xs); color: var(--color-text-secondary);">
						{selectedDocument + 1} of {documents.length}
					</span>
					<button
						onclick={nextDocument}
						disabled={selectedDocument === documents.length - 1}
						style="padding: var(--space-xs); background: transparent; border: 1px solid var(--glass-border); border-radius: var(--radius-sm); color: var(--color-text-secondary); cursor: pointer; font-size: var(--text-xs);"
					>
						→
					</button>
				</div>
			{/if}
		</div>
		<div style="display: flex; align-items: center; gap: var(--space-sm);">
			<span style="font-size: var(--text-xs); color: var(--color-text-tertiary);">
                        {_documentItems.length} fields
			</span>
		</div>
	</div>

	<!-- Document Content -->
	<div style="flex: 1; overflow-y: auto; padding: var(--space-sm); max-height: {maxHeight};">
		{#if documents.length === 0}
			<div style="text-align: center; color: var(--color-text-tertiary); padding: var(--space-lg);">
				No documents to display
			</div>
		{:else}
			<div style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: var(--text-xs); line-height: 1.5;">
                {#each _documentItems as item (item.path)}
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
							<span style="width: 1rem; display: inline-block;"></span>
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
								*
							</span>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Document viewer specific styles */
</style>

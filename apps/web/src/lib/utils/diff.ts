/**
 * Deep object comparison and diff utilities for stage visualization
 */

export interface DiffChange {
	type: 'added' | 'removed' | 'modified' | 'unchanged';
	path: string;
	oldValue?: unknown;
	newValue?: unknown;
	children?: DiffChange[];
}

export interface DiffResult {
	changes: DiffChange[];
	summary: {
		added: number;
		removed: number;
		modified: number;
		unchanged: number;
		total: number;
	};
}

/**
 * Deep comparison function for objects
 */
export function deepEqual(obj1: unknown, obj2: unknown): boolean {
	if (obj1 === obj2) return true;

	if (obj1 == null || obj2 == null) return obj1 === obj2;

	if (typeof obj1 !== typeof obj2) return false;

	if (typeof obj1 !== 'object') return obj1 === obj2;

	if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

	if (Array.isArray(obj1)) {
		if (obj1.length !== (obj2 as unknown[]).length) return false;
		return obj1.every((item, index) => deepEqual(item, (obj2 as unknown[])[index]));
	}

	const keys1 = Object.keys(obj1 as Record<string, unknown>);
	const keys2 = Object.keys(obj2 as Record<string, unknown>);

	if (keys1.length !== keys2.length) return false;

	return keys1.every(
		(key) =>
			keys2.includes(key) &&
			deepEqual((obj1 as Record<string, unknown>)[key], (obj2 as Record<string, unknown>)[key]),
	);
}

/**
 * Create a deep diff between two objects
 */
export function createDiff(oldObj: unknown, newObj: unknown, path = ''): DiffResult {
	const changes: DiffChange[] = [];

	function compareValues(oldVal: unknown, newVal: unknown, currentPath: string): DiffChange {
		// Handle null/undefined cases
		if (oldVal == null && newVal == null) {
			return { type: 'unchanged', path: currentPath, oldValue: oldVal, newValue: newVal };
		}

		if (oldVal == null && newVal != null) {
			return { type: 'added', path: currentPath, newValue: newVal };
		}

		if (oldVal != null && newVal == null) {
			return { type: 'removed', path: currentPath, oldValue: oldVal };
		}

		// Handle primitive types
		if (typeof oldVal !== 'object' || typeof newVal !== 'object') {
			if (oldVal === newVal) {
				return { type: 'unchanged', path: currentPath, oldValue: oldVal, newValue: newVal };
			} else {
				return { type: 'modified', path: currentPath, oldValue: oldVal, newValue: newVal };
			}
		}

		// Handle arrays
		if (Array.isArray(oldVal) && Array.isArray(newVal)) {
			return compareArrays(oldVal, newVal, currentPath);
		}

		// Handle objects
		if (Array.isArray(oldVal) || Array.isArray(newVal)) {
			return { type: 'modified', path: currentPath, oldValue: oldVal, newValue: newVal };
		}

		return compareObjects(
			oldVal as Record<string, unknown>,
			newVal as Record<string, unknown>,
			currentPath,
		);
	}

	function compareArrays(oldArr: unknown[], newArr: unknown[], currentPath: string): DiffChange {
		const maxLength = Math.max(oldArr.length, newArr.length);
		const children: DiffChange[] = [];

		for (let i = 0; i < maxLength; i++) {
			const itemPath = `${currentPath}[${i}]`;
			const oldItem = i < oldArr.length ? oldArr[i] : undefined;
			const newItem = i < newArr.length ? newArr[i] : undefined;

			children.push(compareValues(oldItem, newItem, itemPath));
		}

		const hasChanges = children.some((child) => child.type !== 'unchanged');
		const type = hasChanges ? 'modified' : 'unchanged';

		return {
			type,
			path: currentPath,
			oldValue: oldArr,
			newValue: newArr,
			children,
		};
	}

	function compareObjects(
		oldObj: Record<string, unknown>,
		newObj: Record<string, unknown>,
		currentPath: string,
	): DiffChange {
		const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
		const children: DiffChange[] = [];

		for (const key of allKeys) {
			const keyPath = currentPath ? `${currentPath}.${key}` : key;
			const oldVal = oldObj[key];
			const newVal = newObj[key];

			children.push(compareValues(oldVal, newVal, keyPath));
		}

		const hasChanges = children.some((child) => child.type !== 'unchanged');
		const type = hasChanges ? 'modified' : 'unchanged';

		return {
			type,
			path: currentPath,
			oldValue: oldObj,
			newValue: newObj,
			children,
		};
	}

	const rootChange = compareValues(oldObj, newObj, path);
	changes.push(rootChange);

	// Flatten all changes for summary
	const allChanges = flattenChanges(changes);

	const summary = {
		added: allChanges.filter((c) => c.type === 'added').length,
		removed: allChanges.filter((c) => c.type === 'removed').length,
		modified: allChanges.filter((c) => c.type === 'modified').length,
		unchanged: allChanges.filter((c) => c.type === 'unchanged').length,
		total: allChanges.length,
	};

	return { changes: allChanges, summary };
}

/**
 * Flatten nested changes into a single array
 */
function flattenChanges(changes: DiffChange[]): DiffChange[] {
	const result: DiffChange[] = [];

	for (const change of changes) {
		result.push(change);
		if (change.children) {
			result.push(...flattenChanges(change.children));
		}
	}

	return result;
}

/**
 * Get value at a specific path in an object
 */
export function getValueAtPath(obj: unknown, path: string): unknown {
	if (!path) return obj;

	const parts = path.split('.');
	let current = obj;

	for (const part of parts) {
		if (current == null || typeof current !== 'object') return undefined;

		// Handle array indices
		if (part.includes('[') && part.includes(']')) {
			const [key, indexStr] = part.split('[');
			const index = parseInt(indexStr.replace(']', ''), 10);

			if (key) {
				current = (current as Record<string, unknown>)[key];
			}

			if (Array.isArray(current)) {
				current = current[index];
			} else {
				return undefined;
			}
		} else {
			current = (current as Record<string, unknown>)[part];
		}
	}

	return current;
}

/**
 * Format path for display
 */
export function formatPath(path: string): string {
	return path
		.replace(/\./g, ' → ')
		.replace(/\[(\d+)\]/g, '[$1]')
		.replace(/^root/, 'Document');
}

/**
 * Get change type color
 */
export function getChangeTypeColor(type: DiffChange['type']): string {
	switch (type) {
		case 'added':
			return 'var(--color-success)';
		case 'removed':
			return 'var(--color-error)';
		case 'modified':
			return 'var(--color-warning)';
		case 'unchanged':
			return 'var(--color-text-secondary)';
		default:
			return 'var(--color-text-primary)';
	}
}

/**
 * Get change type icon
 */
export function getChangeTypeIcon(type: DiffChange['type']): string {
	switch (type) {
		case 'added':
			return '+';
		case 'removed':
			return '−';
		case 'modified':
			return '~';
		case 'unchanged':
			return '=';
		default:
			return '?';
	}
}

/**
 * Check if a change has nested changes
 */
export function hasNestedChanges(change: DiffChange): boolean {
	return change.children?.some((child) => child.type !== 'unchanged') ?? false;
}

/**
 * Filter changes by type
 */
export function filterChangesByType(changes: DiffChange[], type: DiffChange['type']): DiffChange[] {
	return changes.filter((change) => change.type === type);
}

/**
 * Get changes at a specific path level
 */
export function getChangesAtLevel(changes: DiffChange[], level: number): DiffChange[] {
	return changes.filter((change) => {
		const pathDepth = change.path.split('.').length - 1;
		return pathDepth === level;
	});
}

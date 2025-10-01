// Lazy loading utilities for performance optimization

import { onMount } from 'svelte';

/**
 * Lazy load a component with a loading fallback
 */
export function createLazyComponent<T>(
	importFn: () => Promise<{ default: T }>,
	fallback?: any
) {
	let component: T | null = null;
	let loading = true;
	let error: Error | null = null;

	onMount(async () => {
		try {
			const module = await importFn();
			component = module.default;
		} catch (err) {
			error = err instanceof Error ? err : new Error('Failed to load component');
		} finally {
			loading = false;
		}
	});

	return {
		get component() {
			return component;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get fallback() {
			return fallback;
		}
	};
}

/**
 * Intersection Observer for lazy loading images and components
 */
export function createIntersectionObserver(
	callback: (entries: IntersectionObserverEntry[]) => void,
	options: IntersectionObserverInit = {}
) {
	if (typeof window === 'undefined') {
		return null;
	}

	const defaultOptions: IntersectionObserverInit = {
		rootMargin: '50px',
		threshold: 0.1,
		...options
	};

	return new IntersectionObserver(callback, defaultOptions);
}

/**
 * Lazy load images with placeholder
 */
export function createLazyImage(src: string, placeholder?: string) {
	let loaded = false;
	let error = false;
	let imageSrc = placeholder || '';

	const loadImage = () => {
		const img = new Image();
		img.onload = () => {
			imageSrc = src;
			loaded = true;
		};
		img.onerror = () => {
			error = true;
		};
		img.src = src;
	};

	return {
		get src() {
			return imageSrc;
		},
		get loaded() {
			return loaded;
		},
		get error() {
			return error;
		},
		load: loadImage
	};
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout;
	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle: boolean;
	return (...args: Parameters<T>) => {
		if (!inThrottle) {
			func(...args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}

/**
 * Virtual scrolling helper
 */
export function createVirtualScroll(
	itemHeight: number,
	containerHeight: number,
	totalItems: number
) {
	let scrollTop = 0;

	const getVisibleRange = () => {
		const start = Math.floor(scrollTop / itemHeight);
		const end = Math.min(
			start + Math.ceil(containerHeight / itemHeight) + 1,
			totalItems
		);
		return { start, end };
	};

	const getOffsetY = (index: number) => {
		return index * itemHeight;
	};

	return {
		updateScrollTop: (newScrollTop: number) => {
			scrollTop = newScrollTop;
		},
		getVisibleRange,
		getOffsetY,
		get totalHeight() {
			return totalItems * itemHeight;
		}
	};
}

/**
 * Memory management utilities
 */
export class MemoryManager {
	private static instances = new Map<string, any>();
	private static cleanupFunctions = new Map<string, () => void>();

	static register(id: string, instance: any, cleanup?: () => void) {
		MemoryManager.instances.set(id, instance);
		if (cleanup) {
			MemoryManager.cleanupFunctions.set(id, cleanup);
		}
	}

	static unregister(id: string) {
		const cleanup = MemoryManager.cleanupFunctions.get(id);
		if (cleanup) {
			cleanup();
			MemoryManager.cleanupFunctions.delete(id);
		}
		MemoryManager.instances.delete(id);
	}

	static cleanup() {
		for (const [id, cleanup] of MemoryManager.cleanupFunctions) {
			cleanup();
		}
		MemoryManager.instances.clear();
		MemoryManager.cleanupFunctions.clear();
	}
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
	private static metrics = new Map<string, number[]>();

	static startTiming(label: string): () => void {
		const start = performance.now();
		return () => {
			const end = performance.now();
			const duration = end - start;
			
			if (!PerformanceMonitor.metrics.has(label)) {
				PerformanceMonitor.metrics.set(label, []);
			}
			
			const times = PerformanceMonitor.metrics.get(label)!;
			times.push(duration);
			
			// Keep only last 100 measurements
			if (times.length > 100) {
				times.shift();
			}
		};
	}

	static getAverageTime(label: string): number {
		const times = PerformanceMonitor.metrics.get(label);
		if (!times || times.length === 0) return 0;
		
		return times.reduce((sum, time) => sum + time, 0) / times.length;
	}

	static getMetrics(): Record<string, number> {
		const result: Record<string, number> = {};
		for (const [label, times] of PerformanceMonitor.metrics) {
			result[label] = PerformanceMonitor.getAverageTime(label);
		}
		return result;
	}

	static clearMetrics() {
		PerformanceMonitor.metrics.clear();
	}
}

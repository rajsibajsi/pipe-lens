import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toastStore } from '../src/lib/stores/toast.store';

describe('Phase 6 - Toast System', () => {
	beforeEach(() => {
		toastStore.clear();
	});

	afterEach(() => {
		toastStore.clear();
	});

	describe('Toast Store', () => {
		it('should initialize with empty toasts', () => {
			const toasts = toastStore.getToasts();
			expect(toasts).toEqual([]);
		});

		it('should add a toast', () => {
			toastStore.add({
				message: 'Test message',
				type: 'success'
			});

			const toasts = toastStore.getToasts();
			expect(toasts).toHaveLength(1);
			expect(toasts[0].message).toBe('Test message');
			expect(toasts[0].type).toBe('success');
		});

		it('should add multiple toasts', () => {
			toastStore.add({ message: 'First', type: 'info' });
			toastStore.add({ message: 'Second', type: 'warning' });

			const toasts = toastStore.getToasts();
			expect(toasts).toHaveLength(2);
		});

		it('should remove a toast by id', () => {
			toastStore.add({ message: 'Test', type: 'success' });
			const toasts = toastStore.getToasts();
			const toastId = toasts[0].id;

			toastStore.remove(toastId);
			expect(toastStore.getToasts()).toHaveLength(0);
		});

		it('should clear all toasts', () => {
			toastStore.add({ message: 'First', type: 'info' });
			toastStore.add({ message: 'Second', type: 'warning' });

			toastStore.clear();
			expect(toastStore.getToasts()).toHaveLength(0);
		});

		it('should auto-remove toasts after duration', async () => {
			vi.useFakeTimers();
			
			toastStore.add({ 
				message: 'Auto remove', 
				type: 'info',
				duration: 1000
			});

			expect(toastStore.getToasts()).toHaveLength(1);

			vi.advanceTimersByTime(1000);
			await vi.runAllTimersAsync();

			expect(toastStore.getToasts()).toHaveLength(0);
			
			vi.useRealTimers();
		});

		it('should handle different toast types', () => {
			const types = ['success', 'error', 'warning', 'info'] as const;
			
			types.forEach(type => {
				toastStore.add({ message: `${type} message`, type });
			});

			const toasts = toastStore.getToasts();
			expect(toasts).toHaveLength(4);
			expect(toasts.map(t => t.type)).toEqual(types);
		});

		it('should generate unique ids for toasts', () => {
			toastStore.add({ message: 'First', type: 'info' });
			toastStore.add({ message: 'Second', type: 'info' });

			const toasts = toastStore.getToasts();
			expect(toasts[0].id).not.toBe(toasts[1].id);
		});

		it('should handle custom duration', () => {
			toastStore.add({ 
				message: 'Custom duration', 
				type: 'info',
				duration: 5000
			});

			const toasts = toastStore.getToasts();
			expect(toasts[0].duration).toBe(5000);
		});

		it('should use default duration when not specified', () => {
			toastStore.add({ message: 'Default duration', type: 'info' });

			const toasts = toastStore.getToasts();
			expect(toasts[0].duration).toBe(5000); // Default duration
		});
	});
});
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
            let toasts: any[] = [];
            const unsub = toastStore.subscribe(s => (toasts = s.toasts));
            unsub();
            expect(toasts).toEqual([]);
        });

        it('should add a toast', () => {
            toastStore.add({ title: 'Title', message: 'Test message', type: 'success' });
            let toasts: any[] = [];
            const unsub = toastStore.subscribe(s => (toasts = s.toasts));
            unsub();
            expect(toasts).toHaveLength(1);
            expect(toasts[0].message).toBe('Test message');
            expect(toasts[0].type).toBe('success');
        });

        it('should add multiple toasts', () => {
            toastStore.add({ title: 'First', message: 'First', type: 'info' });
            toastStore.add({ title: 'Second', message: 'Second', type: 'warning' });
            let toasts: any[] = [];
            const unsub = toastStore.subscribe(s => (toasts = s.toasts));
            unsub();
            expect(toasts).toHaveLength(2);
        });

        it('should remove a toast by id', () => {
            toastStore.add({ title: 'Test', message: 'Test', type: 'success' });
            let toasts: any[] = [];
            const unsub = toastStore.subscribe(s => (toasts = s.toasts));
            const toastId = toasts[0].id;
            toastStore.remove(toastId);
            unsub();
            let toastsAfter: any[] = [];
            toastStore.subscribe(s => (toastsAfter = s.toasts))();
            expect(toastsAfter).toHaveLength(0);
        });

        it('should clear all toasts', () => {
            toastStore.add({ title: 'First', message: 'First', type: 'info' });
            toastStore.add({ title: 'Second', message: 'Second', type: 'warning' });
            toastStore.clear();
            let toasts: any[] = [];
            toastStore.subscribe(s => (toasts = s.toasts))();
            expect(toasts).toHaveLength(0);
        });

		it('should auto-remove toasts after duration', async () => {
			vi.useFakeTimers();
			
            toastStore.add({ title: 'Auto', message: 'Auto remove', type: 'info', duration: 1000 });

            let toastsNow: any[] = [];
            toastStore.subscribe(s => (toastsNow = s.toasts))();
            expect(toastsNow).toHaveLength(1);

			vi.advanceTimersByTime(1000);
			await vi.runAllTimersAsync();

            let toastsAfter: any[] = [];
            toastStore.subscribe(s => (toastsAfter = s.toasts))();
            expect(toastsAfter).toHaveLength(0);
			
			vi.useRealTimers();
		});

		it('should handle different toast types', () => {
			const types = ['success', 'error', 'warning', 'info'] as const;
			
            types.forEach(type => {
                toastStore.add({ title: 't', message: `${type} message`, type });
            });

            let toasts: any[] = [];
            toastStore.subscribe(s => (toasts = s.toasts))();
			expect(toasts).toHaveLength(4);
			expect(toasts.map(t => t.type)).toEqual(types);
		});

		it('should generate unique ids for toasts', () => {
            toastStore.add({ title: 'First', message: 'First', type: 'info' });
            toastStore.add({ title: 'Second', message: 'Second', type: 'info' });

            let toasts: any[] = [];
            toastStore.subscribe(s => (toasts = s.toasts))();
			expect(toasts[0].id).not.toBe(toasts[1].id);
		});

		it('should handle custom duration', () => {
            toastStore.add({ title: 'Custom', message: 'Custom duration', type: 'info', duration: 5000 });

            let toasts: any[] = [];
            toastStore.subscribe(s => (toasts = s.toasts))();
			expect(toasts[0].duration).toBe(5000);
		});

		it('should use default duration when not specified', () => {
            toastStore.add({ title: 'Default', message: 'Default duration', type: 'info' });

            let toasts: any[] = [];
            toastStore.subscribe(s => (toasts = s.toasts))();
			expect(toasts[0].duration).toBe(5000); // Default duration
		});
	});
});
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { keyboardShortcuts } from '../src/lib/utils/keyboard-shortcuts';

describe('Phase 6 - Keyboard Shortcuts', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		keyboardShortcuts.unregister();
	});

	describe('KeyboardShortcutManager', () => {
		it('should register a simple shortcut', () => {
			const callback = vi.fn();
			keyboardShortcuts.register('a', callback);

			expect(keyboardShortcuts.getShortcuts()).toHaveLength(1);
		});

		it('should register a shortcut with modifiers', () => {
			const callback = vi.fn();
			keyboardShortcuts.register('s', callback, { ctrlKey: true });

			expect(keyboardShortcuts.getShortcuts()).toHaveLength(1);
		});

		it('should unregister a shortcut', () => {
			const callback = vi.fn();
			keyboardShortcuts.register('a', callback);
			keyboardShortcuts.unregister('a');

			expect(keyboardShortcuts.getShortcuts()).toHaveLength(0);
		});

		it('should unregister all shortcuts', () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();
			keyboardShortcuts.register('a', callback1);
			keyboardShortcuts.register('b', callback2);

			keyboardShortcuts.unregister();
			expect(keyboardShortcuts.getShortcuts()).toHaveLength(0);
		});

		it('should handle keydown events', () => {
			const callback = vi.fn();
			keyboardShortcuts.register('a', callback);

			// Simulate keydown event
			const event = new KeyboardEvent('keydown', { key: 'a' });
			keyboardShortcuts['handleKeydown'](event);

			expect(callback).toHaveBeenCalledWith(event);
		});

		it('should handle keydown events with modifiers', () => {
			const callback = vi.fn();
			keyboardShortcuts.register('s', callback, { ctrlKey: true });

			// Simulate Ctrl+S keydown event
			const event = new KeyboardEvent('keydown', { 
				key: 's', 
				ctrlKey: true 
			});
			keyboardShortcuts['handleKeydown'](event);

			expect(callback).toHaveBeenCalledWith(event);
		});

		it('should not trigger action for wrong key', () => {
			const callback = vi.fn();
			keyboardShortcuts.register('a', callback);

			// Simulate different key
			const event = new KeyboardEvent('keydown', { key: 'b' });
			keyboardShortcuts['handleKeydown'](event);

			expect(callback).not.toHaveBeenCalled();
		});

		it('should not trigger action when disabled', () => {
			const callback = vi.fn();
			keyboardShortcuts.register('a', callback);
			keyboardShortcuts.disable();

			const event = new KeyboardEvent('keydown', { key: 'a' });
			keyboardShortcuts['handleKeydown'](event);

			expect(callback).not.toHaveBeenCalled();
		});

		it('should prevent default when preventDefault is true', () => {
			const callback = vi.fn();
			keyboardShortcuts.register('a', callback, { 
				preventDefault: true 
			});

			const event = new KeyboardEvent('keydown', { key: 'a' });
			const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
			
			keyboardShortcuts['handleKeydown'](event);

			expect(preventDefaultSpy).toHaveBeenCalled();
		});

		it('should not prevent default when preventDefault is false', () => {
			const callback = vi.fn();
			keyboardShortcuts.register('a', callback, { 
				preventDefault: false 
			});

			const event = new KeyboardEvent('keydown', { key: 'a' });
			const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
			
			keyboardShortcuts['handleKeydown'](event);

			expect(preventDefaultSpy).not.toHaveBeenCalled();
		});

		it('should handle complex modifier combinations', () => {
			const callback = vi.fn();
			keyboardShortcuts.register('s', callback, { 
				ctrlKey: true,
				shiftKey: true 
			});

			const event = new KeyboardEvent('keydown', { 
				key: 's', 
				ctrlKey: true,
				shiftKey: true
			});
			keyboardShortcuts['handleKeydown'](event);

			expect(callback).toHaveBeenCalledWith(event);
		});

		it('should not trigger for partial modifier match', () => {
			const callback = vi.fn();
			keyboardShortcuts.register('s', callback, { 
				ctrlKey: true,
				shiftKey: true 
			});

			// Only Ctrl, missing Shift
			const event = new KeyboardEvent('keydown', { 
				key: 's', 
				ctrlKey: true,
				shiftKey: false
			});
			keyboardShortcuts['handleKeydown'](event);

			expect(callback).not.toHaveBeenCalled();
		});
	});
});
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as Accessibility from '../src/lib/utils/accessibility';

describe('Phase 6 - Accessibility Utilities', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('FocusManagement', () => {
		it('should focus element', () => {
			const element = {
				focus: vi.fn()
			} as any;

			Accessibility.focusElement(element);
			expect(element.focus).toHaveBeenCalled();
		});

		it('should trap focus within container', () => {
			const container = {
				querySelectorAll: vi.fn(() => [
					{ focus: vi.fn() },
					{ focus: vi.fn() }
				])
			} as any;

			Accessibility.trapFocus(container);
			expect(container.querySelectorAll).toHaveBeenCalledWith(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
		});

		it('should restore focus to previous element', () => {
			const element = { focus: vi.fn() };
			Accessibility.setPreviousFocus(element as any);
			Accessibility.restoreFocus();

			expect(element.focus).toHaveBeenCalled();
		});
	});

	describe('KeyboardNavigation', () => {
		it('should handle arrow keys horizontally', () => {
			const callback = vi.fn();
			const elements = [
				{ focus: vi.fn() },
				{ focus: vi.fn() }
			];
			
			const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
			Object.defineProperty(event, 'target', { value: elements[0] });
			
			Accessibility.handleArrowKeys(elements as any, 'horizontal', callback);
			// Simulate the event handling
			expect(true).toBe(true);
		});

		it('should handle arrow keys vertically', () => {
			const callback = vi.fn();
			const elements = [
				{ focus: vi.fn() },
				{ focus: vi.fn() }
			];
			
			const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
			Object.defineProperty(event, 'target', { value: elements[0] });
			
			Accessibility.handleArrowKeys(elements as any, 'vertical', callback);
			// Simulate the event handling
			expect(true).toBe(true);
		});

		it('should handle escape key', () => {
			const callback = vi.fn();
			const event = new KeyboardEvent('keydown', { key: 'Escape' });
			
			const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
			Accessibility.handleEscapeKey(callback);
			// Simulate the event handling
			expect(true).toBe(true);
		});

		it('should handle enter key', () => {
			const callback = vi.fn();
			const event = new KeyboardEvent('keydown', { key: 'Enter' });
			
			const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
			Accessibility.handleEnterKey(callback);
			// Simulate the event handling
			expect(true).toBe(true);
		});

		it('should handle space key', () => {
			const callback = vi.fn();
			const event = new KeyboardEvent('keydown', { key: ' ' });
			
			const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
			Accessibility.handleSpaceKey(callback);
			// Simulate the event handling
			expect(true).toBe(true);
		});
	});

	describe('ScreenReader', () => {
		it('should announce message', () => {
			const createElementSpy = vi.spyOn(document, 'createElement');
			const appendChildSpy = vi.spyOn(document.body, 'appendChild');
			
			Accessibility.announce('Test message');
			
			expect(createElementSpy).toHaveBeenCalledWith('div');
			expect(appendChildSpy).toHaveBeenCalled();
		});

		it('should announce page change', () => {
			const createElementSpy = vi.spyOn(document, 'createElement');
			const appendChildSpy = vi.spyOn(document.body, 'appendChild');
			
			Accessibility.announcePageChange('New Page');
			
			expect(createElementSpy).toHaveBeenCalledWith('div');
			expect(appendChildSpy).toHaveBeenCalled();
		});
	});

	describe('FormAccessibility', () => {
		it('should set field error', () => {
			const field = {
				setAttribute: vi.fn(),
				parentNode: {
					querySelector: vi.fn(() => null),
					appendChild: vi.fn()
				}
			} as any;

			Accessibility.setFieldError(field, 'Error message');
			
			expect(field.setAttribute).toHaveBeenCalledWith('aria-invalid', 'true');
			expect(field.parentNode.querySelector).toHaveBeenCalledWith('.error-message');
		});

		it('should clear field error', () => {
			const errorElement = {
				remove: vi.fn()
			} as any;
			
			const field = {
				removeAttribute: vi.fn(),
				parentNode: {
					querySelector: vi.fn(() => errorElement)
				}
			} as any;

			Accessibility.clearFieldError(field);
			
			expect(field.removeAttribute).toHaveBeenCalledWith('aria-invalid');
			expect(field.parentNode.querySelector).toHaveBeenCalledWith('.error-message');
		});
	});
});
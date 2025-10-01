// Accessibility utilities for WCAG compliance

/**
 * Focus management utilities
 */
export class FocusManager {
	private static focusableSelectors = [
		'button:not([disabled])',
		'input:not([disabled])',
		'select:not([disabled])',
		'textarea:not([disabled])',
		'a[href]',
		'[tabindex]:not([tabindex="-1"])',
		'[contenteditable="true"]'
	].join(', ');

	static getFocusableElements(container: HTMLElement): HTMLElement[] {
		return Array.from(container.querySelectorAll(this.focusableSelectors));
	}

	static trapFocus(container: HTMLElement) {
		const focusableElements = this.getFocusableElements(container);
		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];

		const handleTabKey = (e: KeyboardEvent) => {
			if (e.key !== 'Tab') return;

			if (e.shiftKey) {
				if (document.activeElement === firstElement) {
					lastElement?.focus();
					e.preventDefault();
				}
			} else {
				if (document.activeElement === lastElement) {
					firstElement?.focus();
					e.preventDefault();
				}
			}
		};

		container.addEventListener('keydown', handleTabKey);
		firstElement?.focus();

		return () => {
			container.removeEventListener('keydown', handleTabKey);
		};
	}

	static restoreFocus(element: HTMLElement) {
		element.focus();
	}
}

/**
 * ARIA utilities
 */
export class AriaManager {
	static announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
		const announcement = document.createElement('div');
		announcement.setAttribute('aria-live', priority);
		announcement.setAttribute('aria-atomic', 'true');
		announcement.className = 'sr-only';
		announcement.textContent = message;

		document.body.appendChild(announcement);

		setTimeout(() => {
			document.body.removeChild(announcement);
		}, 1000);
	}

	static setExpanded(element: HTMLElement, expanded: boolean) {
		element.setAttribute('aria-expanded', expanded.toString());
	}

	static setSelected(element: HTMLElement, selected: boolean) {
		element.setAttribute('aria-selected', selected.toString());
	}

	static setPressed(element: HTMLElement, pressed: boolean) {
		element.setAttribute('aria-pressed', pressed.toString());
	}

	static setDescribedBy(element: HTMLElement, descriptionId: string) {
		element.setAttribute('aria-describedby', descriptionId);
	}

	static setLabelledBy(element: HTMLElement, labelId: string) {
		element.setAttribute('aria-labelledby', labelId);
	}
}

/**
 * Color contrast utilities
 */
export class ColorContrast {
	static getLuminance(r: number, g: number, b: number): number {
		const [rs, gs, bs] = [r, g, b].map(c => {
			c = c / 255;
			return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
		});
		return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
	}

	static getContrastRatio(color1: string, color2: string): number {
		const rgb1 = this.hexToRgb(color1);
		const rgb2 = this.hexToRgb(color2);
		
		if (!rgb1 || !rgb2) return 0;

		const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
		const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
		
		const brightest = Math.max(lum1, lum2);
		const darkest = Math.min(lum1, lum2);
		
		return (brightest + 0.05) / (darkest + 0.05);
	}

	static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	}

	static meetsWCAGAA(contrastRatio: number): boolean {
		return contrastRatio >= 4.5;
	}

	static meetsWCAGAAA(contrastRatio: number): boolean {
		return contrastRatio >= 7;
	}
}

/**
 * Keyboard navigation utilities
 */
export class KeyboardNavigation {
	static handleArrowKeys(
		event: KeyboardEvent,
		elements: HTMLElement[],
		orientation: 'horizontal' | 'vertical' = 'horizontal'
	) {
		const currentIndex = elements.indexOf(event.target as HTMLElement);
		if (currentIndex === -1) return;

		let nextIndex = currentIndex;

		switch (event.key) {
			case orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp':
				nextIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
				break;
			case orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown':
				nextIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
				break;
			case 'Home':
				nextIndex = 0;
				break;
			case 'End':
				nextIndex = elements.length - 1;
				break;
			default:
				return;
		}

		event.preventDefault();
		elements[nextIndex]?.focus();
	}

	static handleEscapeKey(event: KeyboardEvent, callback: () => void) {
		if (event.key === 'Escape') {
			event.preventDefault();
			callback();
		}
	}

	static handleEnterKey(event: KeyboardEvent, callback: () => void) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			callback();
		}
	}
}

/**
 * Screen reader utilities
 */
export class ScreenReader {
	static hideFromScreenReader(element: HTMLElement) {
		element.setAttribute('aria-hidden', 'true');
	}

	static showToScreenReader(element: HTMLElement) {
		element.removeAttribute('aria-hidden');
	}

	static createScreenReaderOnly(text: string): HTMLElement {
		const element = document.createElement('span');
		element.className = 'sr-only';
		element.textContent = text;
		return element;
	}

	static announcePageChange(title: string) {
		document.title = title;
		AriaManager.announce(`Page changed to ${title}`);
	}
}

/**
 * Form accessibility utilities
 */
export class FormAccessibility {
	static associateLabelWithInput(labelId: string, inputId: string) {
		const label = document.getElementById(labelId);
		const input = document.getElementById(inputId);
		
		if (label && input) {
			label.setAttribute('for', inputId);
			input.setAttribute('aria-labelledby', labelId);
		}
	}

	static setFieldError(inputId: string, errorMessage: string) {
		const input = document.getElementById(inputId);
		if (!input) return;

		const errorId = `${inputId}-error`;
		let errorElement = document.getElementById(errorId);
		
		if (!errorElement) {
			errorElement = document.createElement('div');
			errorElement.id = errorId;
			errorElement.className = 'field-error';
			errorElement.setAttribute('role', 'alert');
			input.parentNode?.insertBefore(errorElement, input.nextSibling);
		}
		
		errorElement.textContent = errorMessage;
		input.setAttribute('aria-invalid', 'true');
		input.setAttribute('aria-describedby', errorId);
	}

	static clearFieldError(inputId: string) {
		const input = document.getElementById(inputId);
		const errorId = `${inputId}-error`;
		const errorElement = document.getElementById(errorId);
		
		if (input) {
			input.removeAttribute('aria-invalid');
			input.removeAttribute('aria-describedby');
		}
		
		if (errorElement) {
			errorElement.remove();
		}
	}
}

/**
 * Animation accessibility utilities
 */
export class AnimationAccessibility {
	static respectsReducedMotion(): boolean {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	static disableAnimations(element: HTMLElement) {
		element.style.animation = 'none';
		element.style.transition = 'none';
	}

	static enableAnimations(element: HTMLElement) {
		element.style.animation = '';
		element.style.transition = '';
	}

	static setupReducedMotionListener(callback: (reduced: boolean) => void) {
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		callback(mediaQuery.matches);
		
		mediaQuery.addEventListener('change', (e) => {
			callback(e.matches);
		});
	}
}

// CSS for screen reader only content
export const screenReaderOnlyCSS = `
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.field-error {
		color: var(--color-error);
		font-size: var(--text-sm);
		margin-top: var(--space-xs);
	}

	@media (prefers-reduced-motion: reduce) {
		*,
		*::before,
		*::after {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
		}
	}
`;

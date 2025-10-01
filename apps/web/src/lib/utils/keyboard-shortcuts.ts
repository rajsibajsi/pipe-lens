export interface KeyboardShortcut {
	key: string;
	ctrlKey?: boolean;
	shiftKey?: boolean;
	altKey?: boolean;
	metaKey?: boolean;
	action: () => void;
	description: string;
	preventDefault?: boolean;
}

class KeyboardShortcutManager {
	private shortcuts: Map<string, KeyboardShortcut> = new Map();
	private isEnabled = true;

	register(shortcut: KeyboardShortcut) {
		const key = this.getShortcutKey(shortcut);
		this.shortcuts.set(key, shortcut);
	}

	unregister(shortcut: KeyboardShortcut) {
		const key = this.getShortcutKey(shortcut);
		this.shortcuts.delete(key);
	}

	unregisterAll() {
		this.shortcuts.clear();
	}

	enable() {
		this.isEnabled = true;
	}

	disable() {
		this.isEnabled = false;
	}

	private getShortcutKey(shortcut: KeyboardShortcut): string {
		const modifiers = [];
		if (shortcut.ctrlKey) modifiers.push('ctrl');
		if (shortcut.shiftKey) modifiers.push('shift');
		if (shortcut.altKey) modifiers.push('alt');
		if (shortcut.metaKey) modifiers.push('meta');
		
		return [...modifiers, shortcut.key.toLowerCase()].join('+');
	}

	private handleKeydown = (event: KeyboardEvent) => {
		if (!this.isEnabled) return;

		const modifiers = [];
		if (event.ctrlKey) modifiers.push('ctrl');
		if (event.shiftKey) modifiers.push('shift');
		if (event.altKey) modifiers.push('alt');
		if (event.metaKey) modifiers.push('meta');
		
		const key = [...modifiers, event.key.toLowerCase()].join('+');
		const shortcut = this.shortcuts.get(key);

		if (shortcut) {
			if (shortcut.preventDefault !== false) {
				event.preventDefault();
			}
			shortcut.action();
		}
	};

	init() {
		document.addEventListener('keydown', this.handleKeydown);
	}

	destroy() {
		document.removeEventListener('keydown', this.handleKeydown);
	}

	getAllShortcuts(): KeyboardShortcut[] {
		return Array.from(this.shortcuts.values());
	}

	getShortcutsByCategory(category: string): KeyboardShortcut[] {
		// This would be used if we categorize shortcuts
		return this.getAllShortcuts();
	}
}

export const keyboardShortcuts = new KeyboardShortcutManager();

// Common shortcuts
export const COMMON_SHORTCUTS = {
	SAVE: 'Ctrl+S',
	RUN: 'Ctrl+Enter',
	NEW: 'Ctrl+N',
	OPEN: 'Ctrl+O',
	CLOSE: 'Ctrl+W',
	FIND: 'Ctrl+F',
	HELP: 'F1',
	ESCAPE: 'Escape'
} as const;

// Initialize on module load
if (typeof document !== 'undefined') {
	keyboardShortcuts.init();
}

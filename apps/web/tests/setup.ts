import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
	length: 0,
	key: vi.fn()
};

// Mock window object
Object.defineProperty(global, 'window', {
	value: {
		localStorage: localStorageMock,
		document: {
			createElement: vi.fn((tagName) => ({
				tagName,
				textContent: '',
				className: '',
				setAttribute: vi.fn(),
				remove: vi.fn(),
				appendChild: vi.fn(),
				style: {}
			})),
			body: {
				appendChild: vi.fn(),
				removeChild: vi.fn()
			}
		}
	},
	writable: true
});

// Mock localStorage globally
Object.defineProperty(global, 'localStorage', {
	value: localStorageMock,
	writable: true
});

// Mock browser environment from SvelteKit
Object.defineProperty(global, 'browser', {
	value: true,
	writable: true
});

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
	value: {
		randomUUID: vi.fn(() => 'mock-uuid-123')
	},
	writable: true
});

// Mock KeyboardEvent
class MockKeyboardEvent {
	key: string;
	ctrlKey: boolean;
	shiftKey: boolean;
	altKey: boolean;
	metaKey: boolean;
	target: any;
	preventDefault: any;
	stopPropagation: any;

	constructor(type: string, init: any = {}) {
		this.key = init.key || '';
		this.ctrlKey = init.ctrlKey || false;
		this.shiftKey = init.shiftKey || false;
		this.altKey = init.altKey || false;
		this.metaKey = init.metaKey || false;
		this.target = init.target || null;
		this.preventDefault = vi.fn();
		this.stopPropagation = vi.fn();
	}
}

// Mock KeyboardEvent globally
Object.defineProperty(global, 'KeyboardEvent', {
	value: MockKeyboardEvent,
	writable: true
});

// Mock SvelteKit browser environment
vi.mock('$app/environment', () => ({
	browser: true
}));

// Reset mocks before each test
beforeEach(() => {
	vi.clearAllMocks();
	localStorageMock.getItem.mockReturnValue(null);
	localStorageMock.setItem.mockImplementation(() => {});
	localStorageMock.removeItem.mockImplementation(() => {});
	localStorageMock.clear.mockImplementation(() => {});
});
import { vi } from 'vitest';

// Mock SvelteKit modules
vi.mock('$app/environment', () => ({
	browser: true,
	dev: false,
	prerendering: false
}));

vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn(() => () => {}),
		url: new URL('http://localhost:3000')
	},
	navigating: {
		subscribe: vi.fn(() => () => {})
	}
}));

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
	length: 0,
	key: vi.fn()
};

// Mock window and localStorage for Node.js environment
if (typeof window === 'undefined') {
	global.window = {} as any;
}

Object.defineProperty(global.window, 'localStorage', {
	value: localStorageMock
});

// Mock URL methods
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock crypto
Object.defineProperty(global, 'crypto', {
	value: {
		randomUUID: vi.fn(() => 'mock-uuid-123')
	}
});

// Mock document methods
const mockAnchor = {
	href: '',
	download: '',
	click: vi.fn()
};

// Mock document for Node.js environment
if (typeof document === 'undefined') {
	global.document = {
		createElement: vi.fn((tagName) => {
			if (tagName === 'a') {
				return mockAnchor as any;
			}
			return { tagName } as any;
		}),
		body: {
			appendChild: vi.fn(() => mockAnchor as any),
			removeChild: vi.fn(() => mockAnchor as any)
		}
	} as any;
} else {
	vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
		if (tagName === 'a') {
			return mockAnchor as any;
		}
		return document.createElement(tagName);
	});

	vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
	vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);
}

// Mock confirm dialog
global.confirm = vi.fn(() => true);

// Mock window methods
Object.defineProperty(global.window, 'location', {
	value: {
		href: 'http://localhost:3000',
		reload: vi.fn()
	},
	writable: true
});

// Reset all mocks before each test
beforeEach(() => {
	vi.clearAllMocks();
	localStorageMock.getItem.mockReturnValue(null);
});

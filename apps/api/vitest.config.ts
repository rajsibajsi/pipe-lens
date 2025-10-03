import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['tests/**/*.test.ts'],
		globals: true,
		reporters: 'default',
		testTimeout: 10000,
		hookTimeout: 10000,
	},
});

import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	webServer: {
		command: 'pnpm run dev',
		port: 5173,
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},
	testDir: 'tests',
	testMatch: /(.+\.)?(test|spec)\.[jt]s$/,
	testIgnore: /setup\/.*/,
	use: {
		baseURL: 'http://localhost:5173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
	},
	timeout: 60000,
	expect: {
		timeout: 10000,
	},
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	globalSetup: './tests/setup/global-setup.ts',
};

export default config;

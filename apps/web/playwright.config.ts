import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.WEB_BASE_URL || 'http://localhost:5173',
    headless: true
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});

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

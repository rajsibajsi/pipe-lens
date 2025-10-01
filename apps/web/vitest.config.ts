import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/lib/utils/__tests__/**/*.test.ts',
      'tests/phase5-auth.test.ts',
      'tests/phase5-pipeline-management.test.ts',
      'tests/phase5-integration.test.ts',
      'tests/phase6-*.test.ts'
    ],
    globals: true,
    reporters: 'default',
    setupFiles: ['tests/setup.ts']
  },
  resolve: {
    alias: {
      '$lib': '/home/lukar/Documents/privateProjects/pipe-lens/apps/web/src/lib'
    }
  }
});



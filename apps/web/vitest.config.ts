import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte()],
  test: {
    environment: 'node',
    include: [
      'src/lib/utils/__tests__/**/*.test.ts',
      'tests/phase5-auth.test.ts',
      'tests/phase5-pipeline-management.test.ts',
      'tests/phase5-integration.test.ts',
      'tests/phase6-*.test.ts',
      'tests/monaco-editor-reactivity.test.ts',
      'tests/editor-sync.test.ts'
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



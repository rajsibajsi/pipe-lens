import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/lib/utils/__tests__/**/*.test.ts'],
    globals: true,
    reporters: 'default',
  },
});



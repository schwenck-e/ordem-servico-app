import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // SQLite doesn't support concurrent connections from multiple workers —
    // run test files sequentially to avoid database lock contention.
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 15000,
    exclude: ['dist/**', 'node_modules/**'],
  },
});

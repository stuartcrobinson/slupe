import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['proj/**/*.test.ts'],
    exclude: [
      'node_modules/**'
    ],
    poolMatchGlobs: [
      // Use forks pool for entry test since it needs process.chdir()
      ['**/test/integration/entry.test.ts', 'forks']
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'proj/test/',
        '**/*.test.ts'
      ],
    }
  },
  resolve: {
    alias: {}
  }
});
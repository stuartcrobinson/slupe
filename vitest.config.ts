import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['proj/**/*.test.ts'],
    exclude: [
      'node_modules/**',
      '**/listener/test/unit/stopListener.test.ts',
      '**/listener/test/integration/listener-workflow-v2.test.ts'
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
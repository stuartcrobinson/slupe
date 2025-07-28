import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { startListener, stopListener } from '../../src/listener.js';
import { ListenerError } from '../../src/errors.js';
import type { ListenerConfig } from '../../src/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Mock fs.watchFile
vi.mock('fs', () => ({
  watchFile: vi.fn(),
  unwatchFile: vi.fn()
}));

describe('startListener', async () => {
  const testDataPath = join(__dirname, '../../test-data/startListener.json');
  const testData = JSON.parse(await readFile(testDataPath, 'utf-8'));

  // Track active listeners for cleanup
  const activeListeners: any[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up any active listeners
    for (const listener of activeListeners) {
      await listener.stop();
    }
    activeListeners.length = 0;
  });

  for (const testCase of testData.cases) {
    it(testCase.name, async () => {
      const [config] = testCase.input as [ListenerConfig];

      // Setup test environment
      if (testCase.setup?.createFile) {
        await mkdir(dirname(testCase.setup.createFile), { recursive: true });
        await writeFile(testCase.setup.createFile, testCase.setup.content || '');
      }

      try {
        if (testCase.setup?.alreadyWatching) {
          // Simulate already watching by starting first
          const firstHandle = await startListener(config);
          activeListeners.push(firstHandle);
        }

        if (testCase.throws) {
          await expect(startListener(config)).rejects.toThrow(ListenerError);
        } else {
          const handle = await startListener(config);
          activeListeners.push(handle);

          // Verify handle structure
          expect(handle.filePath).toBe(config.filePath);
          expect(typeof handle.id).toBe('string');
          expect(typeof handle.stop).toBe('function');
        }
      } finally {
        // Cleanup
        if (testCase.setup?.createFile) {
          await rm(dirname(testCase.setup.createFile), { recursive: true, force: true });
        }
      }
    });
  }
});
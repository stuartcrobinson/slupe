import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { dirname } from 'path';
import { startListener, stopListener } from '../../src/listener.js';
import type { ListenerHandle } from '../../src/types.js';

// import { test } from 'vitest';
// test.concurrent = false;

export function stopListenerTests() {
  const testDir = '/tmp/t_stop_listener';
  const testFile = `${testDir}/test.md`;
  let handle: ListenerHandle | null = null;

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
    await writeFile(testFile, 'initial content');
  });

  afterEach(async () => {
    if (handle) {
      await handle.stop();
      handle = null;
    }
    await rm(testDir, { recursive: true, force: true });
  });

  it('stops watching and cleans up', async () => {
    // Start listener - this now waits for initial processing
    handle = await startListener({ filePath: testFile });

    // Check that initial content was processed
    let content = await readFile(testFile, 'utf-8');
    expect(content).toContain('=== SLUPE RESULTS ===');

    // Stop the listener
    await stopListener(handle);
    handle = null;

    // Write new content
    await writeFile(testFile, 'changed content after stop');
    await new Promise(resolve => setTimeout(resolve, 700));

    // File should still have the new content without processing
    content = await readFile(testFile, 'utf-8');
    expect(content).toBe('changed content after stop');
    expect(content).not.toContain('=== SLUPE RESULTS ===');
  });

  it('allows watching again after stop', async () => {
    // Start first listener
    handle = await startListener({ filePath: testFile });
    await new Promise(resolve => setTimeout(resolve, 600));

    // Stop it
    await stopListener(handle);
    handle = null;

    // Should be able to start again
    handle = await startListener({ filePath: testFile });
    expect(handle.filePath).toBe(testFile);

    // Verify new listener works
    await writeFile(testFile, '```sh nesl\n#!nesl [@three-char-SHA-256: tst]\naction = "exec"\nlang = "bash"\ncode = "echo test"\n#!end_tst\n```');

    // Poll for the processed content (up to 2 seconds)
    const startTime = Date.now();
    let content = '';
    while (Date.now() - startTime < 2000) {
      content = await readFile(testFile, 'utf-8');
      if (content.includes('=== SLUPE RESULTS ===')) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    expect(content).toContain('=== SLUPE RESULTS ===');
  });
}

describe('stopListener', () => {
  stopListenerTests();
});
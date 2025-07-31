import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { startListener, stopListener } from '../../src/listener.js';
import { ListenerError } from '../../src/errors.js';
import type { ListenerConfig } from '../../src/types.js';

describe('startListener', () => {
  let testDir: string;
  let testFile: string;
  const activeListeners: any[] = [];

  beforeEach(async () => {
    const testId = `slupe-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    testDir = join(tmpdir(), testId);
    await mkdir(testDir, { recursive: true });
    testFile = join(testDir, 'test-input.md');
  });

  afterEach(async () => {
    for (const listener of activeListeners) {
      try {
        await listener.stop();
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
    activeListeners.length = 0;

    try {
      await rm(testDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  it('successful start with default config', async () => {
    await writeFile(testFile, '# Test content\n\nSome text here');

    const config: ListenerConfig = {
      filePath: testFile
    };

    const handle = await startListener(config);
    activeListeners.push(handle);

    expect(handle.filePath).toBe(testFile);
    expect(typeof handle.id).toBe('string');
    expect(handle.id).toMatch(/^listener-\d+-\w+$/);
    expect(typeof handle.stop).toBe('function');

    await new Promise(resolve => setTimeout(resolve, 300));

    const outputPath = join(testDir, '.slupe-output-latest.txt');
    const outputContent = await readFile(outputPath, 'utf-8');
    expect(outputContent).toContain('SLUPE RESULTS');
  });

  it('file not found error', async () => {
    const nonExistentFile = join(testDir, 'does-not-exist.md');
    
    const config: ListenerConfig = {
      filePath: nonExistentFile
    };

    await expect(startListener(config)).rejects.toThrow(ListenerError);
    await expect(startListener(config)).rejects.toThrow('FILE_NOT_FOUND');
  });

  it('already watching error', async () => {
    await writeFile(testFile, '# Test content');

    const config: ListenerConfig = {
      filePath: testFile
    };

    const firstHandle = await startListener(config);
    activeListeners.push(firstHandle);

    await expect(startListener(config)).rejects.toThrow(ListenerError);
    await expect(startListener(config)).rejects.toThrow('ALREADY_WATCHING');
  });

  it('custom debounce time works', async () => {
    await writeFile(testFile, `# Initial content

\`\`\`sh nesl
#!nesl [@three-char-SHA-256: abc]
action = "file_write"
path = "/tmp/test-initial.txt"
content = <<'EOT_abc'
Initial test file
EOT_abc
#!end_abc
\`\`\`
`);

    const config: ListenerConfig = {
      filePath: testFile,
      debounceMs: 100
    };

    const handle = await startListener(config);
    activeListeners.push(handle);

    // Wait for initial processing
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const outputPath = join(testDir, '.slupe-output-latest.txt');
    const initialOutput = await readFile(outputPath, 'utf-8');
    // The output file contains SLUPE execution results
    expect(initialOutput).toContain('SLUPE RESULTS');
    expect(initialOutput).toContain('file_write /tmp/test-initial.txt');
    
    // The original content is written back to the input file with summary prepended
    const inputFileContent = await readFile(testFile, 'utf-8');
    expect(inputFileContent).toContain('Initial content');
    expect(inputFileContent).toContain('SLUPE RESULTS');
    
    // Update the file
    await writeFile(testFile, `# Updated content

This is the new content

\`\`\`sh nesl
#!nesl [@three-char-SHA-256: def]
action = "file_write"
path = "/tmp/test-updated.txt"
content = <<'EOT_def'
Updated test file
EOT_def
#!end_def
\`\`\`
`);
    
    // Wait longer than debounce time
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Check that the output was updated
    const updatedOutput = await readFile(outputPath, 'utf-8');
    expect(updatedOutput).toContain('SLUPE RESULTS');
    expect(updatedOutput).toContain('file_write /tmp/test-updated.txt');
    
    // Check the input file has the updated content
    const updatedInputContent = await readFile(testFile, 'utf-8');
    expect(updatedInputContent).toContain('Updated content');
    expect(updatedInputContent).toContain('This is the new content');
  });

  it('custom output filename', async () => {
    await writeFile(testFile, '# Test content');

    const customOutputName = 'my-custom-output.txt';
    const config: ListenerConfig = {
      filePath: testFile,
      outputFilename: customOutputName
    };

    const handle = await startListener(config);
    activeListeners.push(handle);

    await new Promise(resolve => setTimeout(resolve, 300));

    const customOutputPath = join(testDir, customOutputName);
    const outputContent = await readFile(customOutputPath, 'utf-8');
    expect(outputContent).toContain('SLUPE RESULTS');

    const defaultOutputPath = join(testDir, '.slupe-output-latest.txt');
    await expect(readFile(defaultOutputPath, 'utf-8')).rejects.toThrow();
  });

  it('validates filePath is absolute', async () => {
    const config: ListenerConfig = {
      filePath: 'relative/path.md'
    };

    await expect(startListener(config)).rejects.toThrow('filePath must be absolute');
  });

  it('validates minimum debounceMs', async () => {
    await writeFile(testFile, '# Test content');

    const config: ListenerConfig = {
      filePath: testFile,
      debounceMs: 50
    };

    await expect(startListener(config)).rejects.toThrow('debounceMs must be at least 100');
  });
});
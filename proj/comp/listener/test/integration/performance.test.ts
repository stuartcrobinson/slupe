import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { startListener } from '../../src/listener.js';
import type { ListenerConfig } from '../../src/types.js';

describe('listener performance', () => {
  let testDir: string;
  let testFile: string;
  let outputFile: string;

  beforeEach(async () => {
    const testId = `slupe-perf-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    testDir = join(tmpdir(), testId);
    await mkdir(testDir, { recursive: true });
    testFile = join(testDir, 'test-input.md');
    outputFile = join(testDir, '.slupe-output-latest.txt');
  });

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch (e) {
    }
  });

  it('processes changes quickly with minimal debounce', async () => {
    await writeFile(testFile, `# Initial

\`\`\`sh nesl
#!nesl [@three-char-SHA-256: ini]
action = "file_write"
path = "/tmp/perf-test-initial.txt"
content = <<'EOT_ini'
initial
EOT_ini
#!end_ini
\`\`\``);

    const config: ListenerConfig = {
      filePath: testFile,
      debounceMs: 100, // Minimum allowed
      debug: true
    };

    const handle = await startListener(config);

    // Time a file update
    const updateStartTime = Date.now();
    
    await writeFile(testFile, `# Updated

\`\`\`sh nesl
#!nesl [@three-char-SHA-256: upd]
action = "file_write"
path = "/tmp/perf-test-updated.txt"
content = <<'EOT_upd'
updated
EOT_upd
#!end_upd
\`\`\``);

    // Poll for output change
    let outputContent = '';
    let attempts = 0;
    const maxAttempts = 100; // 1 second max with 10ms intervals
    
    while (attempts < maxAttempts) {
      try {
        outputContent = await readFile(outputFile, 'utf-8');
        if (outputContent.includes('upd')) {
          break;
        }
      } catch (e) {
      }
      await new Promise(resolve => setTimeout(resolve, 10));
      attempts++;
    }

    const totalTime = Date.now() - updateStartTime;
    console.log(`Total time from file write to output: ${totalTime}ms`);
    
    expect(outputContent).toContain('upd');
    expect(totalTime).toBeLessThan(300); // Should be under 300ms total
    
    await handle.stop();
  });

  it('measures actual debounce effect', async () => {
    await writeFile(testFile, '# Test');

    const timings: number[] = [];
    let processCount = 0;
    
    // Monkey patch processContent to count calls
    const originalProcessContent = await import('../../src/content-processor.js').then(m => m.processContent);
    const processContentModule = await import('../../src/content-processor.js');
    
    processContentModule.processContent = async (...args: any[]) => {
      processCount++;
      console.log(`Process called ${processCount} at ${Date.now()}`);
      return originalProcessContent(...args);
    };

    const config: ListenerConfig = {
      filePath: testFile,
      debounceMs: 200
    };

    const handle = await startListener(config);
    processCount = 0; // Reset after initial processing

    // Write multiple times quickly
    const writeStart = Date.now();
    for (let i = 0; i < 5; i++) {
      await writeFile(testFile, `# Test ${i}`);
      await new Promise(resolve => setTimeout(resolve, 50)); // 50ms between writes
    }

    // Wait for debounce to settle
    await new Promise(resolve => setTimeout(resolve, 400));

    console.log(`Total process calls: ${processCount}`);
    
    // Should only process once due to debouncing
    expect(processCount).toBe(1);
    
    await handle.stop();
  });
});
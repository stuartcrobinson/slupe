import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawn } from 'child_process';

describe('CLI performance', () => {
  let testDir: string;
  let testFile: string;
  let outputFile: string;

  beforeEach(async () => {
    const testId = `slupe-cli-perf-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    testDir = join(tmpdir(), testId);
    await mkdir(testDir, { recursive: true });
    testFile = join(testDir, 'slupe_input.md');
    outputFile = join(testDir, '.slupe_output.md');
  });

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch (e) {
    }
  });

  it('CLI adds 500ms debounce delay', async () => {
    // Create initial file
    await writeFile(testFile, '# Initial content');

    // Start the CLI in the test directory
    const cliProcess = spawn('npx', ['tsx', join(process.cwd(), 'proj/src/index.ts')], {
      cwd: testDir,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Wait for startup
    await new Promise(resolve => {
      cliProcess.stdout.once('data', (data) => {
        console.log('CLI output:', data.toString());
        resolve(undefined);
      });
    });

    // Give it time to start watching
    await new Promise(resolve => setTimeout(resolve, 500));

    // Time an update
    const updateStart = Date.now();
    
    await writeFile(testFile, `# Updated

\`\`\`sh nesl
#!nesl [@three-char-SHA-256: cli]
action = "file_write"
path = "/tmp/cli-perf-test.txt"
content = <<'EOT_cli'
cli test
EOT_cli
#!end_cli
\`\`\``);

    // Poll for output
    let outputContent = '';
    let attempts = 0;
    const maxAttempts = 200; // 2 seconds max
    
    while (attempts < maxAttempts) {
      try {
        outputContent = await readFile(outputFile, 'utf-8');
        if (outputContent.includes('cli')) {
          break;
        }
      } catch (e) {
      }
      await new Promise(resolve => setTimeout(resolve, 10));
      attempts++;
    }

    const totalTime = Date.now() - updateStart;
    console.log(`CLI total time: ${totalTime}ms`);
    
    // Kill the CLI process
    cliProcess.kill();

    expect(outputContent).toContain('cli');
    
    // With 500ms debounce, it should take at least 500ms
    expect(totalTime).toBeGreaterThanOrEqual(500);
    expect(totalTime).toBeLessThan(1000); // But not more than 1 second
  });
});
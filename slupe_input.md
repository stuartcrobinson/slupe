Ah, I see the issue! The main entry point (`proj/src/index.ts`) is hardcoding the debounce to 500ms:

```typescript
debounceMs: 500,
```

That's half a second of delay right there! Plus, there might be additional delays from the file watching mechanism. Let's create a proper test in the listener test directory to verify this:

```sh nesl
#!nesl [@three-char-SHA-256: q3x]
action = "file_write"
path = "/Users/stuart/repos/slupe/proj/comp/listener/test/integration/performance.test.ts"
content = <<'EOT_q3x'
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
EOT_q3x
#!end_q3x
```

Now let's also check if the main CLI is adding delays. Let's add a timing test for the full CLI:

```sh nesl
#!nesl [@three-char-SHA-256: r4y]
action = "file_write"
path = "/Users/stuart/repos/slupe/proj/comp/listener/test/integration/cli-performance.test.ts"
content = <<'EOT_r4y'
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
EOT_r4y
#!end_r4y
```

The issue is clear: the main CLI hardcodes `debounceMs: 500`. That's a half-second delay before processing even starts! Let's fix it by making it configurable:

```sh nesl
#!nesl [@three-char-SHA-256: s5z]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/src/index.ts"
old_text = <<'EOT_s5z'
  const handle = await startListener({
    filePath,
    debounceMs: 500,
    outputFilename: outputFile,
    useClipboard
  });
EOT_s5z
new_text = <<'EOT_s5z'
  const debounceMs = parseInt(process.env.SLUPE_DEBOUNCE || '200', 10);
  
  const handle = await startListener({
    filePath,
    debounceMs,
    outputFilename: outputFile,
    useClipboard
  });
EOT_s5z
#!end_s5z
```

Now you can run slupe with a lower debounce:

```bash
SLUPE_DEBOUNCE=100 slupe
```

Or let's make it a config option too:

```sh nesl
#!nesl [@three-char-SHA-256: t6a]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/src/index.ts"
old_text = <<'EOT_t6a'
Config file options (slupe.yml):
  clipboard: boolean       Enable clipboard by default
  input_file: string       Default input file path
  output_file: string      Default output file path
EOT_t6a
new_text = <<'EOT_t6a'
Config file options (slupe.yml):
  clipboard: boolean       Enable clipboard by default
  input_file: string       Default input file path
  output_file: string      Default output file path
  debounce_ms: number      File watch debounce in milliseconds (default: 200)
EOT_t6a
#!end_t6a
```

```sh nesl
#!nesl [@three-char-SHA-256: u7b]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/src/index.ts"
old_text = <<'EOT_u7b'
  const debounceMs = parseInt(process.env.SLUPE_DEBOUNCE || '200', 10);
EOT_u7b
new_text = <<'EOT_u7b'
  const debounceMs = config['debounce_ms'] || parseInt(process.env.SLUPE_DEBOUNCE || '200', 10);
EOT_u7b
#!end_u7b
```

Now run the performance tests to see the timing:

```bash
npm test -- proj/comp/listener/test/integration/performance.test.ts
```
You're right, execution should be instant after file changes. Looking at the code, I see several issues that are likely causing the slowness:

1. **Still using the old `fs.watchFile` in file-watcher.ts** - The code shows `watch` from 'fs' is imported but it's not clear if it's actually being used vs `watchFile`. Let me check:

```sh nesl
#!nesl [@three-char-SHA-256: g2k]
action = "file_read"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/file-watcher.ts"
#!end_g2k
```

Good! It's using `fs.watch` which is fast. But I notice a few other issues:

2. **The debounce time is still defaulting to 200ms** in `listener.ts`:
   ```typescript
   config.debounceMs || 200
   ```

3. **The Slupe instance is being created on every file change** - I can see in `processContent` that it creates a new Slupe instance each time unless one is passed in, but the state management for reusing the instance might not be working properly.

Let's add some debug timing to see where the slowness is:

```sh nesl
#!nesl [@three-char-SHA-256: h3p]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/listener.ts"
old_text = <<'EOT_h3p'
async function processFileChange(filePath: string, state: ListenerState): Promise<void> {
  if (state.isProcessing) {
    console.log('DEBUG: Already processing, skipping');
    return;
  }

  try {
    state.isProcessing = true;

    const fullContent = await readFile(filePath, 'utf-8');
    // console.log('DEBUG: Read content:', fullContent);
    
    if (state.debug) console.time('processContent-total');
    const result = await processContent(
      fullContent,
      state.lastExecutedHash,
      state.debug,
      dirname(filePath),
      state.slupeInstance
    );
    if (state.debug) console.timeEnd('processContent-total');
EOT_h3p
new_text = <<'EOT_h3p'
async function processFileChange(filePath: string, state: ListenerState): Promise<void> {
  if (state.isProcessing) {
    console.log('DEBUG: Already processing, skipping');
    return;
  }

  console.time('total-processing');
  try {
    state.isProcessing = true;

    console.time('read-file');
    const fullContent = await readFile(filePath, 'utf-8');
    console.timeEnd('read-file');
    
    console.time('processContent-total');
    const result = await processContent(
      fullContent,
      state.lastExecutedHash,
      state.debug || true, // Force debug on for timing
      dirname(filePath),
      state.slupeInstance
    );
    console.timeEnd('processContent-total');
EOT_h3p
#!end_h3p
```

```sh nesl
#!nesl [@three-char-SHA-256: i4m]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/listener.ts"
old_text = <<'EOT_i4m'
  } finally {
    state.isProcessing = false;
  }
}
EOT_i4m
new_text = <<'EOT_i4m'
  } finally {
    state.isProcessing = false;
    console.timeEnd('total-processing');
  }
}
EOT_i4m
#!end_i4m
```

Let's also reduce the default debounce time to 100ms:

```sh nesl
#!nesl [@three-char-SHA-256: j5n]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/listener.ts"
old_text = <<'EOT_j5n'
    config.debounceMs || 200
EOT_j5n
new_text = <<'EOT_j5n'
    config.debounceMs || 100
EOT_j5n
#!end_j5n
```

Now let's make sure the Slupe instance is properly cached and reused:

```sh nesl
#!nesl [@three-char-SHA-256: k6r]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/content-processor.ts"
old_text = <<'EOT_k6r'
  if (debug) console.time('slupe-create');
  const slupe = slupeInstance || await Slupe.create({ 
    gitCommit: false,
    repoPath 
  });
  if (debug && !slupeInstance) console.timeEnd('slupe-create');
EOT_k6r
new_text = <<'EOT_k6r'
  let slupe = slupeInstance;
  if (!slupe) {
    if (debug) console.time('slupe-create');
    slupe = await Slupe.create({ 
      gitCommit: false,
      repoPath 
    });
    if (debug) console.timeEnd('slupe-create');
  }
EOT_k6r
#!end_k6r
```

Now let's add a test script to manually test the performance:

```sh nesl
#!nesl [@three-char-SHA-256: l7s]
action = "file_write"
path = "/Users/stuart/repos/slupe/test-listener-speed.js"
content = <<'EOT_l7s'
import { startListener } from './proj/comp/listener/src/index.js';
import { writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const testFile = join(tmpdir(), 'slupe-speed-test.md');

console.log('Test file:', testFile);

await writeFile(testFile, `# Speed Test

\`\`\`sh nesl
#!nesl [@three-char-SHA-256: tst]
action = "file_write"
path = "/tmp/speed-test.txt"
content = <<'EOT_tst'
Speed test content
EOT_tst
#!end_tst
\`\`\`
`);

console.log('Starting listener...');
const handle = await startListener({
  filePath: testFile,
  debounceMs: 50, // Even lower for testing
  debug: true
});

console.log('Listener started. Now updating file...');

setTimeout(async () => {
  console.time('file-update-to-output');
  await writeFile(testFile, `# Updated Speed Test

\`\`\`sh nesl
#!nesl [@three-char-SHA-256: upd]
action = "file_write"
path = "/tmp/speed-test-updated.txt"
content = <<'EOT_upd'
Updated speed test content
EOT_upd
#!end_upd
\`\`\`
`);
  
  // Check when output appears
  const checkInterval = setInterval(async () => {
    try {
      const outputPath = join(tmpdir(), '.slupe-output-latest.txt');
      const { readFile } = await import('fs/promises');
      const content = await readFile(outputPath, 'utf-8');
      if (content.includes('upd')) {
        console.timeEnd('file-update-to-output');
        clearInterval(checkInterval);
        await handle.stop();
        process.exit(0);
      }
    } catch (e) {}
  }, 10);
}, 1000);
EOT_l7s
#!end_l7s
```

Run this test to see the timing breakdown:

```bash
cd /Users/stuart/repos/slupe && node test-listener-speed.js
```

This will show us exactly where the time is being spent - whether it's in file watching, debouncing, Slupe creation, or execution.
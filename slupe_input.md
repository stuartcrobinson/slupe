Great! Now I can see what's happening. The debug output shows that:

1. For the first test ("stops watching and cleans up"), the file processing is NOT happening at all - there's no debug output for this test showing the writes
2. For the second test ("allows watching again after stop"), the writes ARE happening and we can see the verification working

This suggests that the first test is not waiting long enough for the initial processing to complete. Looking at the test structure, I notice that both tests are running concurrently, which might be causing interference.

Let's look at the timing more carefully. The first test waits 700ms, but the processing might not have started yet. Let's increase the wait time and also ensure the tests run sequentially:

```sh nesl
#!nesl [@three-char-SHA-256: seq]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/test/unit/stopListener.test.ts"
old_text = <<'EOT_seq'
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
EOT_seq
new_text = <<'EOT_seq'
import { describe, it, expect, beforeEach, afterEach, test } from 'vitest';
EOT_seq
#!end_seq
```

```sh nesl
#!nesl [@three-char-SHA-256: tim]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/test/unit/stopListener.test.ts"
old_text = <<'EOT_tim'
  it('stops watching and cleans up', async () => {
    // Start listener
    handle = await startListener({ filePath: testFile });

    // Wait for initial processing to complete
    await new Promise(resolve => setTimeout(resolve, 700));

    // Check that initial content was processed
    let content = await readFile(testFile, 'utf-8');
    expect(content).toContain('=== SLUPE RESULTS ===');
EOT_tim
new_text = <<'EOT_tim'
  it('stops watching and cleans up', async () => {
    // Start listener
    handle = await startListener({ filePath: testFile });

    // Wait for initial processing to complete with polling
    const startTime = Date.now();
    let content = '';
    while (Date.now() - startTime < 2000) {
      content = await readFile(testFile, 'utf-8');
      if (content.includes('=== SLUPE RESULTS ===')) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check that initial content was processed
    expect(content).toContain('=== SLUPE RESULTS ===');
EOT_tim
#!end_tim
```

However, I think the real issue might be that the file watcher is not triggering for the initial file. Let's check if `processHandler()` is being called correctly after setting up the watcher:

```sh nesl
#!nesl [@three-char-SHA-256: deb]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/listener.ts"
old_text = <<'EOT_deb'
  const watchHandle = await fileWatcher.watch(
    config.filePath,
    processHandler,
    config.debounceMs || 500
  );

  processHandler();
EOT_deb
new_text = <<'EOT_deb'
  const watchHandle = await fileWatcher.watch(
    config.filePath,
    processHandler,
    config.debounceMs || 500
  );

  console.log('DEBUG: Calling processHandler for initial processing');
  await processHandler();
  console.log('DEBUG: Initial processHandler complete');
EOT_deb
#!end_deb
```

Also, let's make `processFileChange` properly async:

```sh nesl
#!nesl [@three-char-SHA-256: asy]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/listener.ts"
old_text = <<'EOT_asy'
  const processHandler = () => processFileChange(config.filePath, state);
EOT_asy
new_text = <<'EOT_asy'
  const processHandler = async () => processFileChange(config.filePath, state);
EOT_asy
#!end_asy
```

Now let's run the test again to see if this helps:

```bash
cd /Users/stuart/repos/slupe && npm test -- /Users/stuart/repos/slupe/proj/comp/listener/test/unit/stopListener.test.ts
```
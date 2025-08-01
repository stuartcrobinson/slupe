Looking at your timing data, I can see the issue. The slow part is `slupe-execute: 1.069s`, while everything else is fast (milliseconds). Let me trace through the code to find the bottleneck.

From the timing breakdown:
- `slupe-create: 3.59ms` - Fast
- `guard-check: 4.095ms` - Fast  
- `handler-execute: 0.395ms` - Fast
- But `slupe-execute: 1.069s` - This is the problem

The issue appears to be in the `Slupe.create()` method or the initialization process. Looking at the orchestrator code:

```typescript
static async create(options: SlupeOptions = {}): Promise<Slupe> {
    const repoPath = options.repoPath || process.cwd();

    // Load configuration
    const config = await loadConfig(repoPath);

    // Update instructions file if needed
    await updateInstructions(repoPath, config['allowed-actions']);  // <-- This could be slow

    // Initialize executors
    const executors = await Slupe.initializeExecutors(config, repoPath);

    // ... rest of initialization
}
```

The `updateInstructions` function is being called on every `Slupe.create()`, which likely involves file I/O operations. This is happening inside the `slupe-execute` timer but outside the `slupe-create` timer based on your output.

To confirm this is the issue and fix it, you could:

1. **Add more granular timing** to pinpoint the exact slow operation:

```sh nesl
#!nesl [@three-char-SHA-256: a4k]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/orch/src/index.ts"
old_text = <<'EOT_a4k'
    // Load configuration
    const config = await loadConfig(repoPath);

    // Update instructions file if needed
    await updateInstructions(repoPath, config['allowed-actions']);

    // Initialize executors
    const executors = await Slupe.initializeExecutors(config, repoPath);
EOT_a4k
new_text = <<'EOT_a4k'
    // Load configuration
    console.time('loadConfig');
    const config = await loadConfig(repoPath);
    console.timeEnd('loadConfig');

    // Update instructions file if needed
    console.time('updateInstructions');
    await updateInstructions(repoPath, config['allowed-actions']);
    console.timeEnd('updateInstructions');

    // Initialize executors
    console.time('initializeExecutors');
    const executors = await Slupe.initializeExecutors(config, repoPath);
    console.timeEnd('initializeExecutors');
EOT_a4k
#!end_a4k
```

2. **Cache the Slupe instance** in the listener to avoid recreating it. Looking at your code, you're already doing this partially, but the caching might not be working correctly. The issue is that `slupe-create` only happens once (3.59ms), but `slupe-execute` is still slow (1.069s).

Let me check if there's another initialization happening inside `execute()`:

```sh nesl
#!nesl [@three-char-SHA-256: b7x]
action = "file_read"
path = "/Users/stuart/repos/slupe/proj/comp/orch/src/index.ts"
#!end_b7x
```
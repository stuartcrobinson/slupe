You're right - those timing statements aren't showing up because the `FsOpsExecutor` code runs inside the `slupe` instance that's created by the listener. Let me trace through the code flow to find where we need to add timing.

Looking at the code flow from your paste:

1. `listener.ts` → `processFileChange()` → `processContent()`
2. Inside `processContent()` there's timing for `slupe-create` and `slupe-execute`
3. The actual `FsOpsExecutor` runs inside that slupe instance

The issue is that the console output from inside the slupe instance might not be visible. Let's add timing at a higher level that we know will be visible.

Looking at your test output, I can see these timings are already being logged:
- `read-file: 0.311ms`
- `slupe-create: 5.77ms` 
- `slupe-execute: 8.061ms`
- `processContent-total: 16.292ms`
- `write-outputs: 1.205ms`
- `total-processing: 18.591ms`

This shows the actual processing is very fast (~18ms total). But you mentioned experiencing 1.2 seconds in real usage.

The issue might be:
1. The debounce setting in your actual config file
2. File system watcher latency on macOS
3. Something in the slupe instance creation/execution that's slower with real files

Can you check what debounce value is actually being used? Add this to `proj/src/index.ts`:

```sh nesl
#!nesl [@three-char-SHA-256: d3m]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/src/index.ts"
old_text = <<'EOT_d3m'
  const handle = await startListener({
    filePath,
    debounceMs,
    outputFilename: outputFile,
    useClipboard
  });
EOT_d3m
new_text = <<'EOT_d3m'
  console.log(`Using debounceMs: ${debounceMs}`);
  
  const handle = await startListener({
    filePath,
    debounceMs,
    outputFilename: outputFile,
    useClipboard
  });
EOT_d3m
#!end_d3m
```

This will show what debounce value is actually being used when you start the listener.
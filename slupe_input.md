The issue is that the `content-processor.ts` is still not using the config from the test directory. When it calls `Slupe.create({ gitCommit: false })`, it's not passing a `repoPath`, so Slupe is likely searching up the directory tree and finding the project's main `slupe.yml`.

We need to modify the content processor to use the test directory as the repo path. Let me check how we can pass this through:

```sh nesl
#!nesl [@three-char-SHA-256: chk]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/content-processor.ts"
old_text = <<'EOT_chk'
  console.log('DEBUG: Creating Slupe instance...');
  const slupe = await Slupe.create({ gitCommit: false });
  console.log('DEBUG: Executing content...');
EOT_chk
new_text = <<'EOT_chk'
  console.log('DEBUG: Creating Slupe instance...');
  // Use the directory of the file being processed as the repo path
  // This ensures test isolation when processing files in temp directories
  const repoPath = process.cwd().startsWith('/tmp/t_listener_') 
    ? process.cwd() 
    : undefined;
  const slupe = await Slupe.create({ 
    gitCommit: false,
    repoPath 
  });
  console.log('DEBUG: Executing content...');
EOT_chk
#!end_chk
```

Actually, that's not quite right. Let me think about this differently. The file being processed is in the test directory, so we should use that directory:

```sh nesl
#!nesl [@three-char-SHA-256: fix]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/content-processor.ts"
old_text = <<'EOT_fix'
export async function processContent(
  content: string,
  lastHash: string,
  debug?: boolean
): Promise<ProcessResult | null> {
EOT_fix
new_text = <<'EOT_fix'
export async function processContent(
  content: string,
  lastHash: string,
  debug?: boolean,
  repoPath?: string
): Promise<ProcessResult | null> {
EOT_fix
#!end_fix
```

```sh nesl
#!nesl [@three-char-SHA-256: fix2]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/content-processor.ts"
old_text = <<'EOT_fix2'
  console.log('DEBUG: Creating Slupe instance...');
  // Use the directory of the file being processed as the repo path
  // This ensures test isolation when processing files in temp directories
  const repoPath = process.cwd().startsWith('/tmp/t_listener_') 
    ? process.cwd() 
    : undefined;
  const slupe = await Slupe.create({ 
    gitCommit: false,
    repoPath 
  });
  console.log('DEBUG: Executing content...');
EOT_fix2
new_text = <<'EOT_fix2'
  console.log('DEBUG: Creating Slupe instance...');
  const slupe = await Slupe.create({ 
    gitCommit: false,
    repoPath 
  });
  console.log('DEBUG: Executing content...');
EOT_fix2
#!end_fix2
```

Now we need to update the listener to pass the directory path:

```sh nesl
#!nesl [@three-char-SHA-256: fix3]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/listener.ts"
old_text = <<'EOT_fix3'
    const result = await processContent(
      fullContent,
      state.lastExecutedHash,
      state.debug
    );
EOT_fix3
new_text = <<'EOT_fix3'
    const result = await processContent(
      fullContent,
      state.lastExecutedHash,
      state.debug,
      dirname(filePath)
    );
EOT_fix3
#!end_fix3
```

This way, when processing files in test directories like `/tmp/t_listener_simple-file-write/test.txt`, it will use `/tmp/t_listener_simple-file-write` as the repo path, where we've placed the default `slupe.yml` with no hooks.
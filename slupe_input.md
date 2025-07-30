Now I see the pattern clearly! Looking at the debug output:

1. **First test ("stops watching and cleans up")**: Only shows "DEBUG: Read content: initial content" but NO processContent result
2. **Second test ("allows watching again after stop")**: Shows processContent result with git hook failures

The difference is that the second test is somehow getting git hooks to run, while the first test isn't. This tells me that the two tests are creating `Slupe` instances differently.

Let me check if there's a difference in how the tests are set up. The issue might be that `Slupe.create()` is picking up a `slupe.yml` config file with git hooks from the project directory in one test but not the other.

Let's add more debug info to see what's happening in processContent:

```sh nesl
#!nesl [@three-char-SHA-256: m9k]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/content-processor.ts"
old_text = <<'EOT_m9k'
export async function processContent(
  content: string,
  lastHash: string,
  debug?: boolean
): Promise<ProcessResult | null> {
  if (content.trim() === '') {
    return null;
  }
EOT_m9k
new_text = <<'EOT_m9k'
export async function processContent(
  content: string,
  lastHash: string,
  debug?: boolean
): Promise<ProcessResult | null> {
  console.log('DEBUG processContent called with:', { 
    contentLength: content.length, 
    lastHash,
    contentPreview: content.substring(0, 50)
  });
  
  if (content.trim() === '') {
    console.log('DEBUG: Empty content, returning null');
    return null;
  }
EOT_m9k
#!end_m9k
```

```sh nesl
#!nesl [@three-char-SHA-256: n7x]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/content-processor.ts"
old_text = <<'EOT_n7x'
  const slupe = await Slupe.create({ gitCommit: false });
  const orchResult = await slupe.execute(content);
EOT_n7x
new_text = <<'EOT_n7x'
  console.log('DEBUG: Creating Slupe instance...');
  const slupe = await Slupe.create({ gitCommit: false });
  console.log('DEBUG: Executing content...');
  const orchResult = await slupe.execute(content);
  console.log('DEBUG: Execution complete, hookErrors:', orchResult.hookErrors);
EOT_n7x
#!end_n7x
```

Now run the test again:

```bash
cd /Users/stuart/repos/slupe && npm test -- /Users/stuart/repos/slupe/proj/comp/listener/test/unit/stopListener.test.ts
```
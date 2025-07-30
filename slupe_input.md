=== SLUPE RESULTS ===
x8j ✅ file_replace_text /Users/stuart/repos/slupe/proj/comp/listener/src/content-processor.ts
=== END ===
Excellent! Now I can see the real issue. The debug output shows:

1. For the first test ("stops watching and cleans up"):
   - It reads "initial content"
   - But there's NO debug output for `processContent result` or "Writing outputs"
   - This means `processContent` is returning `null`

2. For the second test ("allows watching again after stop"):
   - It processes successfully multiple times
   - We can see the git hook failing (which is expected in test environment)
   - The outputs are being written

The key difference is that the first test is missing the `processContent` result. Looking at the `processContent` function, it returns `null` when:
- Content is empty (not the case)
- The content hash hasn't changed from the last execution

Since this is the first run, `lastExecutedHash` is empty string. Let's check if there's an issue with the initial hash comparison:

```sh nesl
#!nesl [@three-char-SHA-256: x8j]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/content-processor.ts"
old_text = <<'EOT_x8j'
  const stripped = stripSummarySection(content);
  const hash = computeContentHash(stripped.trim());

  if (hash === lastHash) {
    return null;
  }
EOT_x8j
new_text = <<'EOT_x8j'
  const stripped = stripSummarySection(content);
  const hash = computeContentHash(stripped.trim());

  if (hash === lastHash) {
    console.log('DEBUG: Hash unchanged, skipping processing', { hash, lastHash });
    return null;
  }
EOT_x8j
#!end_x8j
```

Let's run the test again to see if it's a hash issue:

```bash
cd /Users/stuart/repos/slupe && npm test -- /Users/stuart/repos/slupe/proj/comp/listener/test/unit/stopListener.test.ts
```
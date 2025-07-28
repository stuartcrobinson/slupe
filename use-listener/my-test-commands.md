
=== SLUPE RESULTS ===
t6m ✅ file_replace_all_text /Users/stuart/repos/slupe/proj/comp/listener/src/formatters.ts
r2d ✅ file_replace_all_text /Users/stuart/repos/slupe/proj/comp/listener/src/formatters.ts
=== END ===


=== SLUPE RESULTS ===
t6m ❌ file_replace_all_text /Users/stuart/repos/slupe/proj/comp/listener/src/formatters.ts - old_text appears 2 times, must appear exactly once
r2d ❌ file_replace_all_text /Users/stuart/repos/slupe/proj/comp/listener/src/formatters.ts - old_text appears 2 times, must appear exactly once
=== END ===

Now I understand. When the exec command fails (like `false` which always exits with code 1), it throws an error with a message. Let me check what the error message format is:

```sh nesl
#!nesl [@three-char-SHA-256: t6m]
action = "file_replace_all_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/formatters.ts"
old_text = <<'EOT_t6m'
  // Handle hook errors first
  if (orchResult.hookErrors?.before) {
    for (const error of orchResult.hookErrors.before) {
      const [cmd, ...rest] = error.split(':');
      const errorMsg = rest.join(':').trim();
      lines.push(`${orchResult.results?.[0]?.blockId || 'def'} ❌ -          ERROR: Hook '${cmd}' failed with ${errorMsg}`);
    }
  }
EOT_t6m
new_text = <<'EOT_t6m'
  // Handle hook errors first
  if (orchResult.hookErrors?.before) {
    for (const error of orchResult.hookErrors.before) {
      // Extract hook command from error message
      // Format is "command: error message"
      const match = error.match(/^(.+?):\s*(.+)$/);
      if (match) {
        const [, cmd, errorMsg] = match;
        // Check if errorMsg contains "exit code"
        if (errorMsg.includes('exit code')) {
          lines.push(`def ❌ -          ERROR: Hook '${cmd}' failed with ${errorMsg}`);
        } else {
          lines.push(`def ❌ -          ERROR: Hook '${cmd}' failed: ${errorMsg}`);
        }
      } else {
        lines.push(`def ❌ -          ERROR: ${error}`);
      }
    }
  }
EOT_t6m
#!end_t6m
```

Also update the formatFullOutput function:

```sh nesl
#!nesl [@three-char-SHA-256: r2d]
action = "file_replace_all_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/formatters.ts"
old_text = <<'EOT_r2d'
  // Handle hook errors first
  if (orchResult.hookErrors?.before) {
    for (const error of orchResult.hookErrors.before) {
      const [cmd, ...rest] = error.split(':');
      const errorMsg = rest.join(':').trim();
      lines.push(`${orchResult.results?.[0]?.blockId || 'def'} ❌ -          ERROR: Hook '${cmd}' failed with ${errorMsg}`);
    }
  }
EOT_r2d
new_text = <<'EOT_r2d'
  // Handle hook errors first
  if (orchResult.hookErrors?.before) {
    for (const error of orchResult.hookErrors.before) {
      // Extract hook command from error message
      // Format is "command: error message"
      const match = error.match(/^(.+?):\s*(.+)$/);
      if (match) {
        const [, cmd, errorMsg] = match;
        // Check if errorMsg contains "exit code"
        if (errorMsg.includes('exit code')) {
          lines.push(`def ❌ -          ERROR: Hook '${cmd}' failed with ${errorMsg}`);
        } else {
          lines.push(`def ❌ -          ERROR: Hook '${cmd}' failed: ${errorMsg}`);
        }
      } else {
        lines.push(`def ❌ -          ERROR: ${error}`);
      }
    }
  }
EOT_r2d
#!end_r2d
```

Now let's run the tests to see if they pass:

```bash
cd /Users/stuart/repos/slupe && npm test -- proj/test/integration/entry.test.ts
```
=== SLUPE RESULTS ===
7x2 ✅ file_replace_text /Users/stuart/repos/slupe/proj/comp/listener/src/formatters.ts
9m4 ✅ file_read /Users/stuart/repos/slupe/proj/comp/listener/src/content-processor.ts
=== END ===
I see the issue. The error occurs because `formatters.ts` is trying to call `.match()` on the `error` property, but hooks now return error objects instead of strings. The code at line 212 expects `error` to be a string, but it's actually a `HookError` object with properties like `command`, `error`, `stdout`, and `stderr`.

Let me fix the `formatFullOutput` function to handle the new hook error structure:

```sh nesl
#!nesl [@three-char-SHA-256: 7x2]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/formatters.ts"
old_text = <<'EOT_7x2'
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
EOT_7x2
new_text = <<'EOT_7x2'
  // Handle hook errors first
  if (orchResult.hookErrors?.before) {
    for (const error of orchResult.hookErrors.before) {
      lines.push(`def ❌ - Hook failed: ${error.command}`);
      lines.push(`          Error: ${error.error}`);
      if (error.stderr?.trim()) {
        lines.push(`          stderr: ${error.stderr.trim()}`);
      }
      if (error.stdout?.trim()) {
        lines.push(`          stdout: ${error.stdout.trim()}`);
      }
    }
  }
EOT_7x2
#!end_7x2
```

Now let's also fix any hook error handling in the `after` hooks section if it exists:

```sh nesl
#!nesl [@three-char-SHA-256: 9m4]
action = "file_read"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/content-processor.ts"
#!end_9m4
```
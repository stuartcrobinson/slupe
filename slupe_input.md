I see the issue. The `HookResult` type is defined in `index.ts`, not in `types.ts`. Let me fix the remaining files correctly:

```sh nesl
#!nesl [@three-char-SHA-256: h6x]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/hooks/src/index.ts"
old_text = <<'EOT_h6x'
export interface HookResult {
  success: boolean;
  executed: number;
  errors?: Array<{
    command: string;
    error: string;
  }>;
}
EOT_h6x
new_text = <<'EOT_h6x'
export interface HookResult {
  success: boolean;
  executed: number;
  errors?: Array<{
    command: string;
    error: string;
    stdout?: string;
    stderr?: string;
  }>;
}
EOT_h6x
#!end_h6x
```

```sh nesl
#!nesl [@three-char-SHA-256: h7x]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/formatters.ts"
old_text = <<'EOT_h7x'
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
EOT_h7x
new_text = <<'EOT_h7x'
  // Handle hook errors first
  if (orchResult.hookErrors?.before) {
    for (const error of orchResult.hookErrors.before) {
      if (typeof error === 'string') {
        // Legacy string format
        const match = error.match(/^(.+?):\s*(.+)$/);
        if (match) {
          const [, cmd, errorMsg] = match;
          if (errorMsg.includes('exit code')) {
            lines.push(`def ❌ -          ERROR: Hook '${cmd}' failed with ${errorMsg}`);
          } else {
            lines.push(`def ❌ -          ERROR: Hook '${cmd}' failed: ${errorMsg}`);
          }
        } else {
          lines.push(`def ❌ -          ERROR: ${error}`);
        }
      } else {
        // New object format with details
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
  }
EOT_h7x
#!end_h7x
```

```sh nesl
#!nesl [@three-char-SHA-256: h8x]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/orch/src/index.ts"
old_text = <<'EOT_h8x'
              hookErrors: {
                before: beforeResult.errors?.map(e => `${e.command}: ${e.error.trim()}`) || ['Unknown before hook error']
              },
EOT_h8x
new_text = <<'EOT_h8x'
              hookErrors: {
                before: beforeResult.errors || [{command: 'unknown', error: 'Unknown before hook error'}]
              },
EOT_h8x
#!end_h8x
```

```sh nesl
#!nesl [@three-char-SHA-256: h9x]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/orch/src/index.ts"
old_text = <<'EOT_h9x'
          const afterResult = await this.hooksManager.runAfter(afterContext);
          if (!afterResult.success) {
            // After hook failure affects overall success
            hookErrors.after = afterResult.errors?.map(e => `${e.command}: ${e.error}`) || ['Unknown after hook error'];
          }
EOT_h9x
new_text = <<'EOT_h9x'
          const afterResult = await this.hooksManager.runAfter(afterContext);
          if (!afterResult.success) {
            // After hook failure affects overall success
            hookErrors.after = afterResult.errors || [{command: 'unknown', error: 'Unknown after hook error'}];
          }
EOT_h9x
#!end_h9x
```
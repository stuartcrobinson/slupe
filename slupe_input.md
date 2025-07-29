=== SLUPE RESULTS ===
f1x ✅ file_replace_text /Users/stuart/repos/slupe/proj/comp/hooks/src/index.ts
f2x ✅ file_replace_text /Users/stuart/repos/slupe/proj/comp/orch/src/index.ts
f3x ✅ file_replace_text /Users/stuart/repos/slupe/proj/comp/orch/src/index.ts
f4x ✅ file_replace_text /Users/stuart/repos/slupe/proj/comp/orch/src/index.ts
f5x ✅ file_replace_text /Users/stuart/repos/slupe/proj/comp/listener/src/formatters.ts
=== END ===
```sh nesl
#!nesl [@three-char-SHA-256: f1x]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/hooks/src/index.ts"
old_text = <<'EOT_f1x'
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
EOT_f1x
new_text = <<'EOT_f1x'
export interface HookError {
  command: string;
  error: string;
  stdout?: string;
  stderr?: string;
}

export interface HookResult {
  success: boolean;
  executed: number;
  errors?: HookError[];
}
EOT_f1x
#!end_f1x
```

```sh nesl
#!nesl [@three-char-SHA-256: f2x]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/orch/src/index.ts"
old_text = <<'EOT_f2x'
import type { HooksConfig, HookContext } from '../../hooks/src/index.js';
EOT_f2x
new_text = <<'EOT_f2x'
import type { HooksConfig, HookContext, HookError } from '../../hooks/src/index.js';
EOT_f2x
#!end_f2x
```

```sh nesl
#!nesl [@three-char-SHA-256: f3x]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/orch/src/index.ts"
old_text = <<'EOT_f3x'
  hookErrors?: {
    before?: string[];
    after?: string[];
  };
EOT_f3x
new_text = <<'EOT_f3x'
  hookErrors?: {
    before?: HookError[];
    after?: HookError[];
  };
EOT_f3x
#!end_f3x
```

```sh nesl
#!nesl [@three-char-SHA-256: f4x]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/orch/src/index.ts"
old_text = <<'EOT_f4x'
          // After hook unexpected errors also affect success
          hookErrors.after = [`After hooks threw unexpected error: ${error instanceof Error ? error.message : String(error)}`];
EOT_f4x
new_text = <<'EOT_f4x'
          // After hook unexpected errors also affect success
          hookErrors.after = [{
            command: 'after hooks',
            error: `After hooks threw unexpected error: ${error instanceof Error ? error.message : String(error)}`
          }];
EOT_f4x
#!end_f4x
```

```sh nesl
#!nesl [@three-char-SHA-256: f5x]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/formatters.ts"
old_text = <<'EOT_f5x'
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
EOT_f5x
new_text = <<'EOT_f5x'
      lines.push(`def ❌ - Hook failed: ${error.command}`);
      lines.push(`          Error: ${error.error}`);
      if (error.stderr?.trim()) {
        lines.push(`          stderr: ${error.stderr.trim()}`);
      }
      if (error.stdout?.trim()) {
        lines.push(`          stdout: ${error.stdout.trim()}`);
      }
EOT_f5x
#!end_f5x
```
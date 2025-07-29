```sh nesl
#!nesl [@three-char-SHA-256: h1x]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/hooks/src/formatHookResult.ts"
old_text = <<'EOT_h1x'
      errors.push({
        command: result.command,
        error: result.error || 'Command failed'
      });
EOT_h1x
new_text = <<'EOT_h1x'
      errors.push({
        command: result.command,
        error: result.error || 'Command failed',
        stdout: result.stdout,
        stderr: result.stderr
      });
EOT_h1x
#!end_h1x
```

```sh nesl
#!nesl [@three-char-SHA-256: h2x]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/hooks/src/types.ts"
old_text = <<'EOT_h2x'
  errors?: Array<{
    command: string;
    error: string;
  }>;
EOT_h2x
new_text = <<'EOT_h2x'
  errors?: Array<{
    command: string;
    error: string;
    stdout?: string;
    stderr?: string;
  }>;
EOT_h2x
#!end_h2x
```

```sh nesl
#!nesl [@three-char-SHA-256: h3x]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/formatters.ts"
old_text = <<'EOT_h3x'
    if (result.hookErrors?.before) {
      summary.push('Before hooks had errors:');
      result.hookErrors.before.forEach(err => 
        summary.push(`  - ${err}`)
      );
    }
    
    if (result.hookErrors?.after) {
      summary.push('After hooks had errors:');
      result.hookErrors.after.forEach(err => 
        summary.push(`  - ${err}`)
      );
    }
EOT_h3x
new_text = <<'EOT_h3x'
    if (result.hookErrors?.before) {
      summary.push('Before hooks had errors:');
      result.hookErrors.before.forEach(err => {
        if (typeof err === 'string') {
          summary.push(`  - ${err}`);
        } else {
          summary.push(`  ❌ Hook failed: ${err.command}`);
          if (err.stderr?.trim()) summary.push(`     stderr: ${err.stderr.trim()}`);
          if (err.stdout?.trim()) summary.push(`     stdout: ${err.stdout.trim()}`);
        }
      });
    }
    
    if (result.hookErrors?.after) {
      summary.push('After hooks had errors:');
      result.hookErrors.after.forEach(err => {
        if (typeof err === 'string') {
          summary.push(`  - ${err}`);
        } else {
          summary.push(`  ❌ Hook failed: ${err.command}`);
          if (err.stderr?.trim()) summary.push(`     stderr: ${err.stderr.trim()}`);
          if (err.stdout?.trim()) summary.push(`     stdout: ${err.stdout.trim()}`);
        }
      });
    }
EOT_h3x
#!end_h3x
```

```sh nesl
#!nesl [@three-char-SHA-256: h4x]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/orch/src/index.ts"
old_text = <<'EOT_h4x'
      const errors = result.errors.map(e => 
        `Hook '${e.command}' failed: ${e.error}`
      );
EOT_h4x
new_text = <<'EOT_h4x'
      const errors = result.errors.map(e => ({
        command: e.command,
        error: e.error,
        stdout: e.stdout,
        stderr: e.stderr
      }));
EOT_h4x
#!end_h4x
```

Note: The formatters.ts needs defensive handling since we're changing the type from `string[]` to an object array. The `typeof err === 'string'` check maintains backward compatibility.
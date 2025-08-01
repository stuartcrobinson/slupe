Now we're getting somewhere! Look at the timing:

- `parseNeslResponse: 3.779ms` - Fast
- `execute-action-1: 4.903ms` - Fast
- `execute-all-actions: 4.951ms` - Fast
- But `slupe-execute: 935.784ms` - Still slow!

So there's ~930ms unaccounted for in the `execute()` method. Looking at the code, I see hooks! Let's add timing for the hooks:

```sh nesl
#!nesl [@three-char-SHA-256: e5k]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/orch/src/index.ts"
old_text = <<'EOT_e5k'
      // Run before hooks
      if (this.hooksManager) {
        try {
          const beforeResult = await this.hooksManager.runBefore();
EOT_e5k
new_text = <<'EOT_e5k'
      // Run before hooks
      if (this.hooksManager) {
        console.time('before-hooks');
        try {
          const beforeResult = await this.hooksManager.runBefore();
EOT_e5k
#!end_e5k
```

```sh nesl
#!nesl [@three-char-SHA-256: f3m]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/orch/src/index.ts"
old_text = <<'EOT_f3m'
            };
          }
        } catch (error) {
          return {
EOT_f3m
new_text = <<'EOT_f3m'
            };
          }
        } catch (error) {
          console.timeEnd('before-hooks');
          return {
EOT_f3m
#!end_f3m
```

```sh nesl
#!nesl [@three-char-SHA-256: g7n]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/orch/src/index.ts"
old_text = <<'EOT_g7n'
          }
        } catch (error) {
          return {
            success: false,
            totalBlocks: 0,
            executedActions: 0,
            results: [],
            parseErrors: [],
            fatalError: `Before hooks threw unexpected error: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
EOT_g7n
new_text = <<'EOT_g7n'
          }
          console.timeEnd('before-hooks');
        } catch (error) {
          console.timeEnd('before-hooks');
          return {
            success: false,
            totalBlocks: 0,
            executedActions: 0,
            results: [],
            parseErrors: [],
            fatalError: `Before hooks threw unexpected error: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
EOT_g7n
#!end_g7n
```

```sh nesl
#!nesl [@three-char-SHA-256: h2p]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/orch/src/index.ts"
old_text = <<'EOT_h2p'
      // Run after hooks with context
      if (this.hooksManager) {
        try {
EOT_h2p
new_text = <<'EOT_h2p'
      // Run after hooks with context
      if (this.hooksManager) {
        console.time('after-hooks');
        try {
EOT_h2p
#!end_h2p
```

```sh nesl
#!nesl [@three-char-SHA-256: i9q]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/orch/src/index.ts"
old_text = <<'EOT_i9q'
          }
        } catch (error) {
          // After hook unexpected errors also affect success
          hookErrors.after = [{
EOT_i9q
new_text = <<'EOT_i9q'
          }
          console.timeEnd('after-hooks');
        } catch (error) {
          console.timeEnd('after-hooks');
          // After hook unexpected errors also affect success
          hookErrors.after = [{
EOT_i9q
#!end_i9q
```

Now run it again. My suspicion is that either:
1. The hooks are running some slow operation (like git commands)
2. There's some async initialization happening on first call

The hooks are likely the culprit since they would explain the ~930ms gap between the actual action execution (5ms) and the total execute time (935ms).
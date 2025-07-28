
**Recommendation:**
- Use lodash.template for consistency and battle-tested implementation
- Your spec (escape, defaults, no nesting) aligns with lodash capabilities
- Default pattern: `${VAR}` with optional `${VAR:-default}`

## Test Strategy for Hooks

Since hooks execute external commands, test with:

1. **Mock commands** - Create test shell scripts:
```json
{
  "name": "basic git flow",
  "config": {
    "hooks": {
      "before": [
        { "run": "echo 'before' > /tmp/t_hooks/before.txt" }
      ],
      "after": [
        { "run": "echo 'after' > /tmp/t_hooks/after.txt" }
      ]
    }
  },
  "verify": {
    "beforeFile": "/tmp/t_hooks/before.txt",
    "afterFile": "/tmp/t_hooks/after.txt"
  }
}
```


3. **Test cases:**
- Variable interpolation edge cases
- Command failures with/without continueOnError
- Timeout behavior
- Missing variables
- Shell injection attempts

**Missing piece:** How does slupe integrate hooks? Need to update slupe's API.md to show hooks dependency and call points.


## Shell Detection Strategy

Node.js `exec()` accepts a shell option. Default behavior:
- Unix: `/bin/sh`
- Windows: `process.env.ComSpec` (typically `cmd.exe`)

## Recommended Implementation

```yaml
# slupe.yaml
shell: auto  # auto | cmd | powershell | bash | sh | /path/to/shell
```


Clean Integration: orch would depend on hooks, not implement it:

```ts
// In orch/src/index.ts
const hooks = new HooksManager(options.hooks);
await hooks.runBefore();
// ... existing execute logic ...
await hooks.runAfter({ success, changeCount });
```

https://claude.ai/chat/d344370c-aaf5-46ec-9786-93cc208f7613
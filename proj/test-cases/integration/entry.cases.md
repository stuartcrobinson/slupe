# Entry Point Integration Tests

## Basic Operations

### simple file write

```yaml
# config overrides (empty for defaults)
```

```sh nesl
#!nesl [@three-char-SHA-256: abc]
action = "file_write"
path = "/tmp/test.txt"
content = "hello world"
#!end_abc
```

```md
=== SLUPE RESULTS ===
abc ✅ file_write /tmp/test.txt
=== END ===

=== OUTPUTS ===
=== END ===
```

### hook failure

```yaml
hooks:
  before:
    - run: "false"  # always fails with exit code 1
```

```sh nesl
#!nesl [@three-char-SHA-256: def]
action = "file_write"
path = "/tmp/test2.txt"
content = "should not write"
#!end_def
```

```md
=== SLUPE RESULTS ===
def ❌ -          ERROR: Hook 'false' failed with exit code 1
=== END ===

=== OUTPUTS ===
=== END ===
```
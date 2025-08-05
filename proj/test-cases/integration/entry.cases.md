# Entry Point Integration Tests

## Basic Operations

### simple file write

```yaml
# config overrides (empty for defaults)
```

```sh nesl
#!nesl [@three-char-SHA-256: abc]
action = "write_file"
path = "/tmp/slupe-entry-tests/test.txt"
content = "hello world"
#!end_abc
```

```md
=== SLUPE RESULTS ===
abc ✅ write_file /tmp/slupe-entry-tests/test.txt
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
action = "write_file"
path = "/tmp/slupe-entry-tests/test2.txt"
content = "should not write"
#!end_def
```

```md
=== SLUPE RESULTS ===
def ❌ - Hook failed: false
          Error: Command failed: false

=== END ===

=== OUTPUTS ===
=== END ===
```
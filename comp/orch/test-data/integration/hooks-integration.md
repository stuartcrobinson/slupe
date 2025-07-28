# Hooks Integration Test Cases

## 001-basic-hooks-execution

Tests that before and after hooks execute correctly around NESL operations.

```yaml
config:
  repoPath: /tmp/t_hooks_integration_001
  hooks:
    before:
      - run: echo 'BEFORE_RAN' > hook-trace.txt
    after:
      - run: echo 'AFTER_RAN' >> hook-trace.txt
      - run: echo 'FILES_MODIFIED=${modifiedFiles}' >> hook-trace.txt
```

```sh nesl
#!nesl [@three-char-SHA-256: bhe]
action = "file_write"
path = "/tmp/t_hooks_integration_001/test.txt"
content = "Hello from NESL"
#!end_bhe
```

```json
{
  "success": true,
  "totalBlocks": 1,
  "executedActions": 1,
  "results": [
    {
      "seq": 1,
      "blockId": "bhe",
      "action": "file_write",
      "params": {
        "path": "test.txt",
        "content": "Hello from NESL"
      },
      "success": true
    }
  ],
  "parseErrors": []
}
```

Verify:
- hook-trace.txt contains "BEFORE_RAN\nAFTER_RAN\nFILES_MODIFIED=test.txt"

## 002-hooks-with-failures

Tests hook behavior when NESL operations fail.

```yaml
config:
  repoPath: /tmp/t_hooks_integration_002
  hooks:
    before:
      - run: mkdir -p nested/dir
    after:
      - run: echo 'SUCCESS=${success}' > result.txt
      - run: echo 'ERRORS=${errorCount}' >> result.txt
```

```sh nesl
#!nesl [@three-char-SHA-256: hwf]
action = "file_write"
path = "/dev/null/cannot/create/subdirs/test.txt"
content = "This will fail"
#!end_hwf
```

```json
{
  "success": false,
  "totalBlocks": 1,
  "executedActions": 1,
  "results": [
    {
      "seq": 1,
      "blockId": "hwf",
      "action": "file_write",
      "params": {
        "path": "/invalid\\0path/test.txt",
        "content": "This will fail"
      },
      "success": false,
      "error": "Invalid path: contains null character"
    }
  ],
  "parseErrors": []
}
```

Verify:
- result.txt contains "SUCCESS=false\nERRORS=1"

## 003-before-hook-failure-aborts

Tests that before hook failures prevent NESL execution.

```yaml
config:
  repoPath: /tmp/t_hooks_integration_003
  hooks:
    before:
      - run: "false"  # Always fails
    after:
      - run: echo 'SHOULD_NOT_RUN' > after.txt
```

```sh nesl
#!nesl [@three-char-SHA-256: bhf]
action = "file_write"
path = "/tmp/t_hooks_integration_003/test.txt"
content = "Should not be written"
#!end_bhf
```

```json
{
  "success": false,
  "totalBlocks": 0,
  "executedActions": 0,
  "results": [],
  "parseErrors": [],
  "hookErrors": {
    "before": ["false: Command failed with exit code 1"]
  },
  "fatalError": "Before hooks failed - aborting execution"
}
```

Verify:
- test.txt does not exist
- after.txt does not exist

## 004-context-variables-in-hooks

Tests that context variables are properly passed to hooks.

```yaml
config:
  repoPath: /tmp/t_hooks_integration_004
  hooks:
    after:
      - run: |
          cat > summary.txt << EOF
          Total blocks: ${totalBlocks}
          Executed: ${executedActions}
          Operations: ${operations}
          EOF
  vars:
    CUSTOM_VAR: "test123"
```

```sh nesl
#!nesl [@three-char-SHA-256: cv1]
action = "file_write"
path = "/tmp/t_hooks_integration_004/file1.txt"
content = "First file"
#!end_cv1

#!nesl [@three-char-SHA-256: cv2]
action = "file_read"
path = "/tmp/t_hooks_integration_004/file1.txt"
#!end_cv2
```

```json
{
  "success": true,
  "totalBlocks": 2,
  "executedActions": 2,
  "results": [
    {
      "seq": 1,
      "blockId": "cv1",
      "action": "file_write",
      "params": {
        "path": "file1.txt",
        "content": "First file"
      },
      "success": true
    },
    {
      "seq": 2,
      "blockId": "cv2",
      "action": "file_read",
      "params": {
        "path": "file1.txt"
      },
      "success": true,
      "data": "First file"
    }
  ],
  "parseErrors": []
}
```

Verify:
- summary.txt contains:
  ```
  Total blocks: 2
  Executed: 2
  Operations: file_write,file_read
  ```

## 005-slupe-yml-default-config

Tests that default config is used when slupe.yml is missing.

```yaml
config:
  repoPath: /tmp/t_hooks_integration_005
  enableHooks: true
```

```sh nesl
#!nesl [@three-char-SHA-256: lac]
action = "file_write"
path = "/tmp/t_hooks_integration_005/test.txt"
content = "Trigger config creation"
#!end_lac
```

```json
{
  "success": true,
  "totalBlocks": 1,
  "executedActions": 1,
  "results": [
    {
      "seq": 1,
      "blockId": "lac",
      "action": "file_write",
      "params": {
        "path": "test.txt",
        "content": "Trigger config creation"
      },
      "success": true
    }
  ],
  "parseErrors": [],
  "configCreated": true
}
```

Verify:
- test.txt exists
- execution succeeds with default config (no slupe.yml created)
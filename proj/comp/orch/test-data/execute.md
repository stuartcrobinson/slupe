# Execute Tests

## basic operations

### 001-single-file-create

```sh nesl
#!nesl [@three-char-SHA-256: abc]
action = "write_file"
path = "/tmp/test.txt"
content = "hello world"
#!end_abc
```

```json
{
  "success": true,
  "totalBlocks": 1,
  "executedActions": 1,
  "results": [{
    "seq": 1,
    "blockId": "abc",
    "action": "write_file",
    "params": {
      "action": "write_file",
      "path": "/tmp/test.txt",
      "content": "hello world"
    },
    "success": true
  }],
  "parseErrors": []
}
```

### 002-multiple-blocks-mixed-success

```sh nesl
#!nesl [@three-char-SHA-256: f1r]
action = "write_file"
path = "/tmp/first.txt"
content = "first"
#!end_f1r

Some text between blocks

#!nesl [@three-char-SHA-256: s3c]
action = "write_file"
path = "/tmp/nonexistent/second.txt"
content = "fails"
#!end_s3c
```

```json
{
  "success": false,
  "totalBlocks": 2,
  "executedActions": 2,
  "results": [{
    "seq": 1,
    "blockId": "f1r",
    "action": "write_file",
    "params": {
      "action": "write_file",
      "path": "/tmp/first.txt",
      "content": "first"
    },
    "success": true
  }, {
    "seq": 2,
    "blockId": "s3c",
    "action": "write_file",
    "params": {
      "action": "write_file",
      "path": "/tmp/nonexistent/second.txt",
      "content": "fails"
    },
    "success": false,
    "error": "ENOENT: no such file or directory"
  }],
  "parseErrors": []
}
```

## error handling

### 003-invalid-action

```sh nesl
#!nesl [@three-char-SHA-256: inv]
action = "invalid_action"
path = "/tmp/test.txt"
#!end_inv
```

```json
{
  "success": false,
  "totalBlocks": 1,
  "executedActions": 0,
  "results": [{
    "seq": 1,
    "blockId": "inv",
    "action": "invalid_action",
    "params": {
      "action": "invalid_action",
      "path": "/tmp/test.txt"
    },
    "success": false,
    "error": "Unknown action: invalid_action"
  }],
  "parseErrors": []
}
```

### 004-parser-error-continues

```sh nesl
#!nesl [@three-char-SHA-256: dup]
key = "first"
key = "second"
#!end_dup

#!nesl [@three-char-SHA-256: ok]
action = "write_file"
path = "/tmp/after-error.txt"
content = "should work"
#!end_ok
```

```json
{
  "success": false,
  "totalBlocks": 2,
  "executedActions": 1,
  "results": [{
    "seq": 1,
    "blockId": "ok",
    "action": "write_file",
    "params": {
      "action": "write_file",
      "path": "/tmp/after-error.txt",
      "content": "should work"
    },
    "success": true
  }],
  "parseErrors": [{
    "blockId": "dup",
    "error": {
      "code": "DUPLICATE_KEY",
      "message": "Duplicate key 'key' in block 'dup'"
    }
  }]
}
```

## command execution

### 005-exec-bash

```sh nesl
#!nesl [@three-char-SHA-256: cmd]
action = "exec"
code = "echo 'hello from shell'"
lang = "bash"
#!end_cmd
```

```json
{
  "success": true,
  "totalBlocks": 1,
  "executedActions": 1,
  "results": [{
    "seq": 1,
    "blockId": "cmd",
    "action": "exec",
    "params": {
      "action": "exec",
      "code": "echo 'hello from shell'",
      "lang": "bash"
    },
    "success": true,
    "data": {
      "stdout": "hello from shell\n",
      "stderr": "",
      "exit_code": 0
    }
  }],
  "parseErrors": []
}
```
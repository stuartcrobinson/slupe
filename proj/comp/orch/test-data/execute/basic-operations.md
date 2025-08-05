# Execute Test Cases

## Single Action Success

### 001-simple-file-write

```sh nesl
#!nesl [@three-char-SHA-256: abc]
action = "write_file"
path = "/tmp/001-simple-file-write/test.txt"
content = "Hello, World!"
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
      "path": "/tmp/001-simple-file-write/test.txt",
      "content": "Hello, World!"
    },
    "success": true,
    "data": {
      "path": "/tmp/001-simple-file-write/test.txt",
      "bytesWritten": 13
    }
  }],
  "parseErrors": []
}
```

## Multiple Actions Mixed

### 002-mixed-implemented-unimplemented

```sh nesl
#!nesl [@three-char-SHA-256: fw1]
action = "write_file"
path = "/tmp/002-mixed-implemented-unimplemented/first.txt"
content = "First file"
#!end_fw1

#!nesl [@three-char-SHA-256: ex1]
action = "exec"
code = "echo 'hello'"
lang = "bash"
#!end_ex1

#!nesl [@three-char-SHA-256: fw2]
action = "write_file"
path = "/tmp/002-mixed-implemented-unimplemented/second.txt"
content = "Second file"
#!end_fw2
```

```json
{
  "success": true,
  "totalBlocks": 3,
  "executedActions": 3,
  "results": [{
    "seq": 1,
    "blockId": "fw1",
    "action": "write_file",
    "params": {
      "path": "/tmp/002-mixed-implemented-unimplemented/first.txt",
      "content": "First file"
    },
    "success": true,
    "data": {
      "path": "/tmp/002-mixed-implemented-unimplemented/first.txt",
      "bytesWritten": 10
    }
  }, {
    "seq": 2,
    "blockId": "ex1",
    "action": "exec",
    "params": {
      "code": "echo 'hello'",
      "lang": "bash"
    },
    "success": true,
    "data": {
      "command": "echo 'hello'",
      "stdout": "hello\n",
      "stderr": "",
      "exit_code": 0
    }
  }, {
    "seq": 3,
    "blockId": "fw2",
    "action": "write_file",
    "params": {
      "path": "/tmp/002-mixed-implemented-unimplemented/second.txt",
      "content": "Second file"
    },
    "success": true,
    "data": {
      "path": "/tmp/002-mixed-implemented-unimplemented/second.txt",
      "bytesWritten": 11
    }
  }],
  "parseErrors": []
}
```

## Parse Errors

### 003-parse-error-with-valid-action

```sh nesl
#!nesl [@three-char-SHA-256: bad]
action = "write_file"
path = "/tmp/003-parse-error-with-valid-action/bad.txt"
path = "/tmp/003-parse-error-with-valid-action/duplicate.txt"
#!end_bad

#!nesl [@three-char-SHA-256: gud]
action = "write_file"
path = "/tmp/003-parse-error-with-valid-action/good.txt"
content = "Valid content"
#!end_gud
```

```json
{
  "success": false,
  "totalBlocks": 2,
  "executedActions": 1,
  "results": [{
    "seq": 1,
    "blockId": "gud",
    "action": "write_file",
    "params": {
      "path": "/tmp/003-parse-error-with-valid-action/good.txt",
      "content": "Valid content"
    },
    "success": true,
    "data": {
      "path": "/tmp/003-parse-error-with-valid-action/good.txt",
      "bytesWritten": 13
    }
  }],
  "parseErrors": [{
    "blockId": "bad",
    "action": "write_file",
    "errorType": "syntax",
    "message": "Duplicate key 'path' in block 'bad'",
    "blockStartLine": 1,
    "neslContent": "#!nesl [@three-char-SHA-256: bad]\naction = \"write_file\"\npath = \"/tmp/003-parse-error-with-valid-action/bad.txt\"\npath = \"/tmp/003-parse-error-with-valid-action/duplicate.txt\"\n#!end_bad"
  }]
}
```

## Execution Failures

### 004-file-operation-failure

```sh nesl
#!nesl [@three-char-SHA-256: nop]
action = "delete_file"
path = "/tmp/004-file-operation-failure/does-not-exist.txt"
#!end_nop
```

```json
{
  "success": false,
  "totalBlocks": 1,
  "executedActions": 1,
  "results": [{
    "seq": 1,
    "blockId": "nop",
    "action": "delete_file",
    "params": {
      "path": "/tmp/004-file-operation-failure/does-not-exist.txt"
    },
    "success": false,
    "error": "ENOENT: no such file or directory, unlink '/tmp/004-file-operation-failure/does-not-exist.txt'"
  }],
  "parseErrors": []
}
```

## Empty Input

### 005-no-nesl-blocks

```
This is just regular text without any NESL blocks.
```

```json
{
  "success": true,
  "totalBlocks": 0,
  "executedActions": 0,
  "results": [],
  "parseErrors": []
}
```

## File Operations

### 006-file-read-success

```sh nesl
#!nesl [@three-char-SHA-256: rd1]
action = "write_file"
path = "/tmp/006-file-read-success/read-test.txt"
content = "Content to read later"
#!end_rd1

#!nesl [@three-char-SHA-256: rd2]
action = "read_file"
path = "/tmp/006-file-read-success/read-test.txt"
#!end_rd2
```

```json
{
  "success": true,
  "totalBlocks": 2,
  "executedActions": 2,
  "results": [{
    "seq": 1,
    "blockId": "rd1",
    "action": "write_file",
    "params": {
      "path": "/tmp/006-file-read-success/read-test.txt",
      "content": "Content to read later"
    },
    "success": true,
    "data": {
      "path": "/tmp/006-file-read-success/read-test.txt",
      "bytesWritten": 21
    }
  }, {
    "seq": 2,
    "blockId": "rd2",
    "action": "read_file",
    "params": {
      "path": "/tmp/006-file-read-success/read-test.txt"
    },
    "success": true,
    "data": {
      "path": "/tmp/006-file-read-success/read-test.txt",
      "content": "Content to read later"
    }
  }],
  "parseErrors": []
}
```

### 007-file-move-success

```sh nesl
#!nesl [@three-char-SHA-256: mv1]
action = "write_file"
path = "/tmp/007-file-move-success/source-file.txt"
content = "File to be moved"
#!end_mv1

#!nesl [@three-char-SHA-256: mv2]
action = "move_file"
old_path = "/tmp/007-file-move-success/source-file.txt"
new_path = "/tmp/007-file-move-success/destination-file.txt"
#!end_mv2
```

```json
{
  "success": true,
  "totalBlocks": 2,
  "executedActions": 2,
  "results": [{
    "seq": 1,
    "blockId": "mv1",
    "action": "write_file",
    "params": {
      "path": "/tmp/007-file-move-success/source-file.txt",
      "content": "File to be moved"
    },
    "success": true,
    "data": {
      "path": "/tmp/007-file-move-success/source-file.txt",
      "bytesWritten": 16
    }
  }, {
    "seq": 2,
    "blockId": "mv2",
    "action": "move_file",
    "params": {
      "old_path": "/tmp/007-file-move-success/source-file.txt",
      "new_path": "/tmp/007-file-move-success/destination-file.txt"
    },
    "success": true,
    "data": {
      "old_path": "/tmp/007-file-move-success/source-file.txt",
      "new_path": "/tmp/007-file-move-success/destination-file.txt"
    }
  }],
  "parseErrors": []
}
```

### 008-file-replace-text-single

```sh nesl
#!nesl [@three-char-SHA-256: rp1]
action = "write_file"
path = "/tmp/008-file-replace-text-single/replace-single.txt"
content = "Hello world! This is a test."
#!end_rp1

#!nesl [@three-char-SHA-256: rp2]
action = "replace_text_in_file"
path = "/tmp/008-file-replace-text-single/replace-single.txt"
old_text = "world"
new_text = "universe"
#!end_rp2
```

```json
{
  "success": true,
  "totalBlocks": 2,
  "executedActions": 2,
  "results": [{
    "seq": 1,
    "blockId": "rp1",
    "action": "write_file",
    "params": {
      "path": "/tmp/008-file-replace-text-single/replace-single.txt",
      "content": "Hello world! This is a test."
    },
    "success": true,
    "data": {
      "path": "/tmp/008-file-replace-text-single/replace-single.txt",
      "bytesWritten": 28
    }
  }, {
    "seq": 2,
    "blockId": "rp2",
    "action": "replace_text_in_file",
    "params": {
      "path": "/tmp/008-file-replace-text-single/replace-single.txt",
      "old_text": "world",
      "new_text": "universe"
    },
    "success": true,
    "data": {
      "path": "/tmp/008-file-replace-text-single/replace-single.txt",
      "replacements": 1
    }
  }],
  "parseErrors": []
}
```

### 009-file-replace-all-text

```sh nesl
#!nesl [@three-char-SHA-256: ra1]
action = "write_file"
path = "/tmp/009-file-replace-all-text/replace-all.txt"
content = "foo bar foo baz foo"
#!end_ra1

#!nesl [@three-char-SHA-256: ra2]
action = "replace_all_text_in_file"
path = "/tmp/009-file-replace-all-text/replace-all.txt"
old_text = "foo"
new_text = "qux"
#!end_ra2
```

```json
{
  "success": true,
  "totalBlocks": 2,
  "executedActions": 2,
  "results": [{
    "seq": 1,
    "blockId": "ra1",
    "action": "write_file",
    "params": {
      "path": "/tmp/009-file-replace-all-text/replace-all.txt",
      "content": "foo bar foo baz foo"
    },
    "success": true,
    "data": {
      "path": "/tmp/009-file-replace-all-text/replace-all.txt",
      "bytesWritten": 19
    }
  }, {
    "seq": 2,
    "blockId": "ra2",
    "action": "replace_all_text_in_file",
    "params": {
      "path": "/tmp/009-file-replace-all-text/replace-all.txt",
      "old_text": "foo",
      "new_text": "qux"
    },
    "success": true,
    "data": {
      "path": "/tmp/009-file-replace-all-text/replace-all.txt",
      "replacements": 3
    }
  }],
  "parseErrors": []
}
```

### 010-multiline-content-handling

```sh nesl
#!nesl [@three-char-SHA-256: ml1]
action = "write_file"
path = "/tmp/010-multiline-content-handling/multiline.txt"
content = <<'EOT_ml1'
Line one
Line two
Line three
EOT_ml1
#!end_ml1

#!nesl [@three-char-SHA-256: ml2]
action = "replace_text_in_file"
path = "/tmp/010-multiline-content-handling/multiline.txt"
old_text = <<'EOT_ml2'
Line two
EOT_ml2
new_text = <<'EOT_ml2'
Line TWO (modified)
EOT_ml2
#!end_ml2
```

```json
{
  "success": true,
  "totalBlocks": 2,
  "executedActions": 2,
  "results": [{
    "seq": 1,
    "blockId": "ml1",
    "action": "write_file",
    "params": {
      "path": "/tmp/010-multiline-content-handling/multiline.txt",
      "content": "Line one\nLine two\nLine three"
    },
    "success": true,
    "data": {
      "path": "/tmp/010-multiline-content-handling/multiline.txt",
      "bytesWritten": 28
    }
  }, {
    "seq": 2,
    "blockId": "ml2",
    "action": "replace_text_in_file",
    "params": {
      "path": "/tmp/010-multiline-content-handling/multiline.txt",
      "old_text": "Line two",
      "new_text": "Line TWO (modified)"
    },
    "success": true,
    "data": {
      "path": "/tmp/010-multiline-content-handling/multiline.txt",
      "replacements": 1
    }
  }],
  "parseErrors": []
}
```

### 011-file-replace-text-multiple-occurrences-failure

```sh nesl
#!nesl [@three-char-SHA-256: rf1]
action = "write_file"
path = "/tmp/011-file-replace-text-multiple-occurrences-failure/multiple-foo.txt"
content = "foo bar foo baz"
#!end_rf1

#!nesl [@three-char-SHA-256: rf2]
action = "replace_text_in_file"
path = "/tmp/011-file-replace-text-multiple-occurrences-failure/multiple-foo.txt"
old_text = "foo"
new_text = "qux"
#!end_rf2
```

```json
{
  "success": false,
  "totalBlocks": 2,
  "executedActions": 2,
  "results": [{
    "seq": 1,
    "blockId": "rf1",
    "action": "write_file",
    "params": {
      "path": "/tmp/011-file-replace-text-multiple-occurrences-failure/multiple-foo.txt",
      "content": "foo bar foo baz"
    },
    "success": true,
    "data": {
      "path": "/tmp/011-file-replace-text-multiple-occurrences-failure/multiple-foo.txt",
      "bytesWritten": 15
    }
  }, {
    "seq": 2,
    "blockId": "rf2",
    "action": "replace_text_in_file",
    "params": {
      "path": "/tmp/011-file-replace-text-multiple-occurrences-failure/multiple-foo.txt",
      "old_text": "foo",
      "new_text": "qux"
    },
    "success": false,
    "error": "replace_text_in_file: old_text appears 2 times, must appear exactly once"
  }],
  "parseErrors": []
}
```

### 012-file-replace-all-text-with-count

```sh nesl
#!nesl [@three-char-SHA-256: rc1]
action = "write_file"
path = "/tmp/012-file-replace-all-text-with-count/count-test.txt"
content = "test test test"
#!end_rc1

#!nesl [@three-char-SHA-256: rc2]
action = "replace_all_text_in_file"
path = "/tmp/012-file-replace-all-text-with-count/count-test.txt"
old_text = "test"
new_text = "check"
count = "2"
#!end_rc2
```

```json
{
  "success": false,
  "totalBlocks": 2,
  "executedActions": 2,
  "results": [{
    "seq": 1,
    "blockId": "rc1",
    "action": "write_file",
    "params": {
      "path": "/tmp/012-file-replace-all-text-with-count/count-test.txt",
      "content": "test test test"
    },
    "success": true,
    "data": {
      "path": "/tmp/012-file-replace-all-text-with-count/count-test.txt",
      "bytesWritten": 14
    }
  }, {
    "seq": 2,
    "blockId": "rc2",
    "action": "replace_all_text_in_file",
    "params": {
      "path": "/tmp/012-file-replace-all-text-with-count/count-test.txt",
      "old_text": "test",
      "new_text": "check",
      "count": 2
    },
    "success": false,
    "error": "replace_all_text_in_file: expected 2 occurrences but found 3"
  }],
  "parseErrors": []
}
```

### 013-file-move-overwrite-existing

```sh nesl
#!nesl [@three-char-SHA-256: ow1]
action = "write_file"
path = "/tmp/013-file-move-overwrite-existing/move-source.txt"
content = "source content"
#!end_ow1

#!nesl [@three-char-SHA-256: ow2]
action = "write_file"
path = "/tmp/013-file-move-overwrite-existing/move-dest.txt"
content = "will be overwritten"
#!end_ow2

#!nesl [@three-char-SHA-256: ow3]
action = "move_file"
old_path = "/tmp/013-file-move-overwrite-existing/move-source.txt"
new_path = "/tmp/013-file-move-overwrite-existing/move-dest.txt"
#!end_ow3
```

```json
{
  "success": true,
  "totalBlocks": 3,
  "executedActions": 3,
  "results": [{
    "seq": 1,
    "blockId": "ow1",
    "action": "write_file",
    "params": {
      "path": "/tmp/013-file-move-overwrite-existing/move-source.txt",
      "content": "source content"
    },
    "success": true,
    "data": {
      "path": "/tmp/013-file-move-overwrite-existing/move-source.txt",
      "bytesWritten": 14
    }
  }, {
    "seq": 2,
    "blockId": "ow2",
    "action": "write_file",
    "params": {
      "path": "/tmp/013-file-move-overwrite-existing/move-dest.txt",
      "content": "will be overwritten"
    },
    "success": true,
    "data": {
      "path": "/tmp/013-file-move-overwrite-existing/move-dest.txt",
      "bytesWritten": 19
    }
  }, {
    "seq": 3,
    "blockId": "ow3",
    "action": "move_file",
    "params": {
      "old_path": "/tmp/013-file-move-overwrite-existing/move-source.txt",
      "new_path": "/tmp/013-file-move-overwrite-existing/move-dest.txt"
    },
    "success": true,
    "data": {
      "old_path": "/tmp/013-file-move-overwrite-existing/move-source.txt",
      "new_path": "/tmp/013-file-move-overwrite-existing/move-dest.txt",
      "overwrote": true
    }
  }],
  "parseErrors": []
}
```

### 014-empty-old-text-validation

```sh nesl
#!nesl [@three-char-SHA-256: et1]
action = "write_file"
path = "/tmp/014-empty-old-text-validation/empty-replace.txt"
content = "some content"
#!end_et1

#!nesl [@three-char-SHA-256: et2]
action = "replace_text_in_file"
path = "/tmp/014-empty-old-text-validation/empty-replace.txt"
old_text = ""
new_text = "replacement"
#!end_et2

#!nesl [@three-char-SHA-256: et3]
action = "replace_all_text_in_file"
path = "/tmp/014-empty-old-text-validation/empty-replace.txt"
old_text = ""
new_text = "replacement"
#!end_et3
```

```json
{
  "success": false,
  "totalBlocks": 3,
  "executedActions": 3,
  "results": [{
    "seq": 1,
    "blockId": "et1",
    "action": "write_file",
    "params": {
      "path": "/tmp/014-empty-old-text-validation/empty-replace.txt",
      "content": "some content"
    },
    "success": true,
    "data": {
      "path": "/tmp/014-empty-old-text-validation/empty-replace.txt",
      "bytesWritten": 12
    }
  }, {
    "seq": 2,
    "blockId": "et2",
    "action": "replace_text_in_file",
    "params": {
      "path": "/tmp/014-empty-old-text-validation/empty-replace.txt",
      "old_text": "",
      "new_text": "replacement"
    },
    "success": false,
    "error": "replace_text_in_file: old_text cannot be empty"
  }, {
    "seq": 3,
    "blockId": "et3",
    "action": "replace_all_text_in_file",
    "params": {
      "path": "/tmp/014-empty-old-text-validation/empty-replace.txt",
      "old_text": "",
      "new_text": "replacement"
    },
    "success": false,
    "error": "replace_all_text_in_file: old_text cannot be empty"
  }],
  "parseErrors": []
}
```

### 015-file-read-nonexistent

```sh nesl
#!nesl [@three-char-SHA-256: rnx]
action = "read_file"
path = "/tmp/015-file-read-nonexistent/does-not-exist-read.txt"
#!end_rnx
```

```json
{
  "success": false,
  "totalBlocks": 1,
  "executedActions": 1,
  "results": [{
    "seq": 1,
    "blockId": "rnx",
    "action": "read_file",
    "params": {
      "path": "/tmp/015-file-read-nonexistent/does-not-exist-read.txt"
    },
    "success": false,
    "error": "ENOENT: no such file or directory, open '/tmp/015-file-read-nonexistent/does-not-exist-read.txt'"
  }],
  "parseErrors": []
}
```

### 016-file-move-creates-parent-dirs

```sh nesl
#!nesl [@three-char-SHA-256: pd1]
action = "write_file"
path = "/tmp/016-file-move-creates-parent-dirs/parent-test.txt"
content = "moving to new dir"
#!end_pd1

#!nesl [@three-char-SHA-256: pd2]
action = "move_file"
old_path = "/tmp/016-file-move-creates-parent-dirs/parent-test.txt"
new_path = "/tmp/016-file-move-creates-parent-dirs/new/deeply/nested/moved-file.txt"
#!end_pd2
```

```json
{
  "success": true,
  "totalBlocks": 2,
  "executedActions": 2,
  "results": [{
    "seq": 1,
    "blockId": "pd1",
    "action": "write_file",
    "params": {
      "path": "/tmp/016-file-move-creates-parent-dirs/parent-test.txt",
      "content": "moving to new dir"
    },
    "success": true,
    "data": {
      "path": "/tmp/016-file-move-creates-parent-dirs/parent-test.txt",
      "bytesWritten": 17
    }
  }, {
    "seq": 2,
    "blockId": "pd2",
    "action": "move_file",
    "params": {
      "old_path": "/tmp/016-file-move-creates-parent-dirs/parent-test.txt",
      "new_path": "/tmp/016-file-move-creates-parent-dirs/new/deeply/nested/moved-file.txt"
    },
    "success": true,
    "data": {
      "old_path": "/tmp/016-file-move-creates-parent-dirs/parent-test.txt",
      "new_path": "/tmp/016-file-move-creates-parent-dirs/new/deeply/nested/moved-file.txt"
    }
  }],
  "parseErrors": []
}
```

### 017-files-read-multiple

```sh nesl
#!nesl [@three-char-SHA-256: fr1]
action = "write_file"
path = "/tmp/017-files-read-multiple/first.txt"
content = "First file content"
#!end_fr1

#!nesl [@three-char-SHA-256: fr2]
action = "write_file"
path = "/tmp/017-files-read-multiple/second.txt"
content = "Second file content"
#!end_fr2

#!nesl [@three-char-SHA-256: fr3]
action = "read_files"
paths = <<'EOT_fr3'
/tmp/017-files-read-multiple/first.txt
/tmp/017-files-read-multiple/second.txt
EOT_fr3
#!end_fr3
```

```json
{
  "success": true,
  "totalBlocks": 3,
  "executedActions": 3,
  "results": [{
    "seq": 1,
    "blockId": "fr1",
    "action": "write_file",
    "params": {
      "path": "/tmp/017-files-read-multiple/first.txt",
      "content": "First file content"
    },
    "success": true,
    "data": {
      "path": "/tmp/017-files-read-multiple/first.txt",
      "bytesWritten": 18
    }
  }, {
    "seq": 2,
    "blockId": "fr2",
    "action": "write_file",
    "params": {
      "path": "/tmp/017-files-read-multiple/second.txt",
      "content": "Second file content"
    },
    "success": true,
    "data": {
      "path": "/tmp/017-files-read-multiple/second.txt",
      "bytesWritten": 19
    }
  }, {
    "seq": 3,
    "blockId": "fr3",
    "action": "read_files",
    "params": {
      "paths": "/tmp/017-files-read-multiple/first.txt\n/tmp/017-files-read-multiple/second.txt"
    },
    "success": true,
    "data": {
      "paths": [
        "/tmp/017-files-read-multiple/first.txt",
        "/tmp/017-files-read-multiple/second.txt"
      ],
      "content": [
        "First file content",
        "Second file content"
      ]
    }
  }],
  "parseErrors": []
}
```

### 018-files-read-with-missing

```sh nesl
#!nesl [@three-char-SHA-256: fm1]
action = "write_file"
path = "/tmp/018-files-read-with-missing/exists.txt"
content = "This file exists"
#!end_fm1

#!nesl [@three-char-SHA-256: fm2]
action = "read_files"
paths = <<'EOT_fm2'
/tmp/018-files-read-with-missing/exists.txt
/tmp/018-files-read-with-missing/missing.txt
EOT_fm2
#!end_fm2
```

```json
{
  "success": true,
  "totalBlocks": 2,
  "executedActions": 2,
  "results": [{
    "seq": 1,
    "blockId": "fm1",
    "action": "write_file",
    "params": {
      "path": "/tmp/018-files-read-with-missing/exists.txt",
      "content": "This file exists"
    },
    "success": true,
    "data": {
      "path": "/tmp/018-files-read-with-missing/exists.txt",
      "bytesWritten": 16
    }
  }, {
    "seq": 2,
    "blockId": "fm2",
    "action": "read_files",
    "params": {
      "paths": "/tmp/018-files-read-with-missing/exists.txt\n/tmp/018-files-read-with-missing/missing.txt"
    },
    "success": true,
    "data": {
      "paths": ["/tmp/018-files-read-with-missing/exists.txt"],
      "content": ["This file exists"],
      "errors": [{
        "path": "/tmp/018-files-read-with-missing/missing.txt",
        "error": "ENOENT: no such file or directory, open '/tmp/018-files-read-with-missing/missing.txt'"
      }]
    }
  }],
  "parseErrors": []
}
```

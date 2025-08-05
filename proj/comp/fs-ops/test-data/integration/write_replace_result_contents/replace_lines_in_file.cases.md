# replace_lines_in_file Integration Tests

## replace_lines_in_file

### 001-replace-single-line

```sh nesl
#!nesl [@three-char-SHA-256: rs1]
action = "write_file"
path = "/tmp/t_replace-single-line/test.txt"
content = <<'EOT_rs1'
Line 1
Line 2
Line 3
Line 4
Line 5
EOT_rs1
#!end_rs1
```

```sh nesl
#!nesl [@three-char-SHA-256: rs2]
action = "replace_lines_in_file"
path = "/tmp/t_replace-single-line/test.txt"
lines = "3"
new_content = "This is the new line 3"
#!end_rs2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_replace-single-line/test.txt",
    "lines_replaced": 1
  }
}
```

```
Line 1
Line 2
This is the new line 3
Line 4
Line 5
```

### 002-replace-line-range

```sh nesl
#!nesl [@three-char-SHA-256: rr1]
action = "write_file"
path = "/tmp/t_replace-line-range/code.js"
content = <<'EOT_rr1'
function oldImplementation() {
  console.log('line 2');
  console.log('line 3');
  console.log('line 4');
  return 'old';
}
EOT_rr1
#!end_rr1
```

```sh nesl
#!nesl [@three-char-SHA-256: rr2]
action = "replace_lines_in_file"
path = "/tmp/t_replace-line-range/code.js"
lines = "2-5"
new_content = <<'EOT_rr2'
  // New implementation
  return 'new';
EOT_rr2
#!end_rr2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_replace-line-range/code.js",
    "lines_replaced": 4
  }
}
```

```
function oldImplementation() {
  // New implementation
  return 'new';
}
```

### 003-replace-entire-file

```sh nesl
#!nesl [@three-char-SHA-256: re1]
action = "write_file"
path = "/tmp/t_replace-entire-file/small.txt"
content = <<'EOT_re1'
Old line 1
Old line 2
Old line 3
EOT_re1
#!end_re1
```

```sh nesl
#!nesl [@three-char-SHA-256: re2]
action = "replace_lines_in_file"
path = "/tmp/t_replace-entire-file/small.txt"
lines = "1-3"
new_content = <<'EOT_re2'
Completely new content
With multiple lines
EOT_re2
#!end_re2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_replace-entire-file/small.txt",
    "lines_replaced": 3
  }
}
```

```
Completely new content
With multiple lines
```

### 004-replace-with-empty-content

```sh nesl
#!nesl [@three-char-SHA-256: ec1]
action = "write_file"
path = "/tmp/t_replace-with-empty-content/deletable.txt"
content = <<'EOT_ec1'
Keep this line
Delete this line
Keep this line too
EOT_ec1
#!end_ec1
```

```sh nesl
#!nesl [@three-char-SHA-256: ec2]
action = "replace_lines_in_file"
path = "/tmp/t_replace-with-empty-content/deletable.txt"
lines = "2"
new_content = ""
#!end_ec2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_replace-with-empty-content/deletable.txt",
    "lines_replaced": 1
  }
}
```

```
Keep this line

Keep this line too
```

### 005-replace-nonexistent-file

```
```

```sh nesl
#!nesl [@three-char-SHA-256: ne1]
action = "replace_lines_in_file"
path = "/tmp/t_replace-nonexistent-file/missing.txt"
lines = "1-5"
new_content = "This should fail"
#!end_ne1
```

```json
{
  "success": false,
  "error": "ENOENT: no such file or directory, open '/tmp/t_replace-nonexistent-file/missing.txt'"
}
```

### 006-invalid-line-specification

```sh nesl
#!nesl [@three-char-SHA-256: il1]
action = "write_file"
path = "/tmp/t_invalid-line-specification/test.txt"
content = <<'EOT_il1'
Line 1
Line 2
Line 3
EOT_il1
#!end_il1
```

```sh nesl
#!nesl [@three-char-SHA-256: il2]
action = "replace_lines_in_file"
path = "/tmp/t_invalid-line-specification/test.txt"
lines = "abc"
new_content = "This should fail"
#!end_il2
```

```json
{
  "success": false,
  "error": "replace_lines_in_file: Invalid line specification 'abc'"
}
```

### 007-out-of-range-lines

```sh nesl
#!nesl [@three-char-SHA-256: or1]
action = "write_file"
path = "/tmp/t_out-of-range-lines/short.txt"
content = <<'EOT_or1'
Only one line
EOT_or1
#!end_or1
```

```sh nesl
#!nesl [@three-char-SHA-256: or2]
action = "replace_lines_in_file"
path = "/tmp/t_out-of-range-lines/short.txt"
lines = "5-10"
new_content = "Out of range"
#!end_or2
```

```json
{
  "success": false,
  "error": "replace_lines_in_file: Line range 5-10 is out of bounds (file has 1 lines)"
}
```

### 008-partial-out-of-range

```sh nesl
#!nesl [@three-char-SHA-256: po1]
action = "write_file"
path = "/tmp/t_partial-out-of-range/partial.txt"
content = <<'EOT_po1'
Line 1
Line 2
Line 3
EOT_po1
#!end_po1
```

```sh nesl
#!nesl [@three-char-SHA-256: po2]
action = "replace_lines_in_file"
path = "/tmp/t_partial-out-of-range/partial.txt"
lines = "2-5"
new_content = "Partial replacement"
#!end_po2
```

```json
{
  "success": false,
  "error": "replace_lines_in_file: Line range 2-5 is out of bounds (file has 3 lines)"
}
```

### 009-reversed-line-range

```sh nesl
#!nesl [@three-char-SHA-256: rv1]
action = "write_file"
path = "/tmp/t_reversed-line-range/reverse.txt"
content = <<'EOT_rv1'
Line 1
Line 2
Line 3
EOT_rv1
#!end_rv1
```

```sh nesl
#!nesl [@three-char-SHA-256: rv2]
action = "replace_lines_in_file"
path = "/tmp/t_reversed-line-range/reverse.txt"
lines = "3-1"
new_content = "Invalid range"
#!end_rv2
```

```json
{
  "success": false,
  "error": "replace_lines_in_file: Invalid line range '3-1' (start must be <= end)"
}
```

### 010-multiline-replacement

```sh nesl
#!nesl [@three-char-SHA-256: ml1]
action = "write_file"
path = "/tmp/t_multiline-replacement/function.py"
content = <<'EOT_ml1'
def old_function():
    # This is line 2
    # This is line 3
    # This is line 4
    return None
EOT_ml1
#!end_ml1
```

```sh nesl
#!nesl [@three-char-SHA-256: ml2]
action = "replace_lines_in_file"
path = "/tmp/t_multiline-replacement/function.py"
lines = "2-4"
new_content = <<'EOT_ml2'
    """
    New docstring spanning
    multiple lines
    """
    x = 42
    y = x * 2
EOT_ml2
#!end_ml2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_multiline-replacement/function.py",
    "lines_replaced": 3
  }
}
```

```
def old_function():
    """
    New docstring spanning
    multiple lines
    """
    x = 42
    y = x * 2
    return None
```

### 011-preserve-line-endings

```sh nesl
#!nesl [@three-char-SHA-256: pl1]
action = "write_file"
path = "/tmp/t_preserve-line-endings/mixed.txt"
content = "Line 1\r\nLine 2\r\nLine 3\r\n"
#!end_pl1
```

```sh nesl
#!nesl [@three-char-SHA-256: pl2]
action = "replace_lines_in_file"
path = "/tmp/t_preserve-line-endings/mixed.txt"
lines = "2"
new_content = "New Line 2"
#!end_pl2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_preserve-line-endings/mixed.txt",
    "lines_replaced": 1
  }
}
```

```
Line 1
New Line 2
Line 3

```

### 012-empty-file

```sh nesl
#!nesl [@three-char-SHA-256: ef1]
action = "write_file"
path = "/tmp/t_empty-file/empty.txt"
content = ""
#!end_ef1
```

```sh nesl
#!nesl [@three-char-SHA-256: ef2]
action = "replace_lines_in_file"
path = "/tmp/t_empty-file/empty.txt"
lines = "1"
new_content = "Cannot replace in empty file"
#!end_ef2
```

```json
{
  "success": false,
  "error": "replace_lines_in_file: Line range 1 is out of bounds (file has 0 lines)"
}
```

### 013-zero-line-number

```sh nesl
#!nesl [@three-char-SHA-256: zl1]
action = "write_file"
path = "/tmp/t_zero-line-number/test.txt"
content = <<'EOT_zl1'
Line 1
Line 2
EOT_zl1
#!end_zl1
```

```sh nesl
#!nesl [@three-char-SHA-256: zl2]
action = "replace_lines_in_file"
path = "/tmp/t_zero-line-number/test.txt"
lines = "0"
new_content = "Invalid line number"
#!end_zl2
```

```json
{
  "success": false,
  "error": "replace_lines_in_file: Invalid line specification '0'"
}
```

### 014-negative-line-number

```sh nesl
#!nesl [@three-char-SHA-256: nl1]
action = "write_file"
path = "/tmp/t_negative-line-number/test.txt"
content = <<'EOT_nl1'
Line 1
Line 2
EOT_nl1
#!end_nl1
```

```sh nesl
#!nesl [@three-char-SHA-256: nl2]
action = "replace_lines_in_file"
path = "/tmp/t_negative-line-number/test.txt"
lines = "-1"
new_content = "Invalid line number"
#!end_nl2
```

```json
{
  "success": false,
  "error": "replace_lines_in_file: Invalid line specification '-1'"
}
```

### 015-last-line-no-newline

```sh nesl
#!nesl [@three-char-SHA-256: ln1]
action = "write_file"
path = "/tmp/t_last-line-no-newline/no-newline.txt"
content = "Line 1\nLine 2\nLine 3"
#!end_ln1
```

```sh nesl
#!nesl [@three-char-SHA-256: ln2]
action = "replace_lines_in_file"
path = "/tmp/t_last-line-no-newline/no-newline.txt"
lines = "3"
new_content = "New last line without newline"
#!end_ln2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_last-line-no-newline/no-newline.txt",
    "lines_replaced": 1
  }
}
```

```
Line 1
Line 2
New last line without newline
```
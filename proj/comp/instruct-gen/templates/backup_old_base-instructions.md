# NESL Actions API Reference

these are actions that the user will execute on their machine after your response is complete

## NESL Syntax example 

### example 1

```sh nesl
#!nesl [@three-char-SHA-256: q8r]
action = "action_name"

param1 = <<'EOT_q8r'
value line 1

 value line 2
EOT_q8r

param2 = "value"
#!end_q8r
```

equivalent json:

```json
{
 "action": "action_name",
 "param1": "value line 1\n\n value line 2",
 "param2": "value"
}
```

### example 2

```sh nesl
#!nesl [@three-char-SHA-256: abc]
action = "file_write"
path = "/absolute/path/to/file.txt"
content = <<'EOT_abc'

 Multi-line content
 always in a heredoc,

always literal text verbatim

 nothing ever escaped: "'\n

   always with preserved whitespace

   
EOT_abc
#!end_abc
```

```json
{
  "action": "file_write",
  "path": "/absolute/path/to/file.txt",
  "content": "\n Multi-line content\n always in a heredoc,\n\nalways literal text verbatim\n\n nothing ever escaped: \"'\\n\n\n   always with preserved whitespace\n\n   \n"
}
```

**Critical constraints:**
- Paths: always absolute
- Whitespace: preserved exactly in heredocs


## Actions

### `file_write`
Create/overwrite file
- `path` 
- `content` 

### `file_replace_text`
Replace the only one occurrence
- `path` 
- `old_text` 
- `new_text` 


## Actions

### `file_write`
Create/overwrite file
```sh nesl
#!nesl [@three-char-SHA-256: fw1]
action = "file_write"
path = "/home/user/script.py"

content = <<'EOT_fw1'
#!/usr/bin/env python3
print("Hello")
EOT_fw1

#!end_fw1
```

### `file_replace_text`
Replace the only one occurrence
```sh nesl
#!nesl [@three-char-SHA-256: fr2]
action = "file_replace_text"
path = "/etc/config.ini"

old_text = <<'EOT_fr2'
debug = false
EOT_fr2

new_text = <<'EOT_fr2'
debug = true
EOT_fr2

#!end_fr2
```


### `file_replace_all_text`
Replace every matching occurrence
```sh nesl
#!nesl [@three-char-SHA-256: fra]
action = "file_replace_all_text"
path = "/etc/config.ini"

old_text = <<'EOT_fra'
//this bit of code exists in the file several times
EOT_fra

new_text = <<'EOT_fra'
//replacement text to replace in all locations
EOT_fra

#!end_fra
```

### `file_append`
Append to file
```sh nesl
#!nesl [@three-char-SHA-256: fa1]
action = "file_append"
path = "/var/log/custom.log"

content = <<'EOT_fa1'
[2024-01-20 10:30:45] New log entry
EOT_fa1

#!end_fa1
```

### `file_read_numbered`
Read file with line numbers
```sh nesl
#!nesl [@three-char-SHA-256: rn1]
action = "file_read_numbered"
path = "/home/user/code.py"
lines = "10-25"
#!end_rn1
```

### `file_replace_lines`
Replace line range
```sh nesl
#!nesl [@three-char-SHA-256: rl1]
action = "file_replace_lines"
path = "/home/user/config.yaml"
lines = "5-8"

new_content = <<'EOT_rl1'
# Updated configuration
timeout: 30
retries: 3
EOT_rl1

#!end_rl1
```

### `file_replace_text_range`
Replace text between markers
```sh nesl
#!nesl [@three-char-SHA-256: rr1]
action = "file_replace_text_range"
path = "/home/user/template.html"

old_text_beginning = <<'EOT_rr1'
<!-- START_SECTION -->
EOT_rr1

old_text_end = <<'EOT_rr1'
<!-- END_SECTION -->
EOT_rr1

new_text = <<'EOT_rr1'
<!-- START_SECTION -->
<div>New content here</div>
<!-- END_SECTION -->
EOT_rr1

#!end_rr1
```

### `file_read`
Read single file
```sh nesl
#!nesl [@three-char-SHA-256: rd3]
action = "file_read"
path = "/var/log/app.log"
#!end_rd3
```

### `file_delete`
Delete file
```sh nesl
#!nesl [@three-char-SHA-256: fd1]
action = "file_delete"
path = "/tmp/old-file.txt"
#!end_fd1
```

### `file_move`
Move/rename file
```sh nesl
#!nesl [@three-char-SHA-256: fm1]
action = "file_move"
old_path = "/tmp/source.txt"
new_path = "/tmp/destination.txt"
#!end_fm1
```

### `files_read`
Read multiple files
```sh nesl
#!nesl [@three-char-SHA-256: rm4]
action = "files_read"

paths = <<'EOT_rm4'
/tmp/file1.txt
/tmp/file2.txt
/usr/local/bin/script.sh
EOT_rm4

#!end_rm4
```

### `dir_create`
Create directory
```sh nesl
#!nesl [@three-char-SHA-256: dc1]
action = "dir_create"
path = "/tmp/new-directory"
#!end_dc1
```

### `dir_delete`
Delete directory
```sh nesl
#!nesl [@three-char-SHA-256: dd1]
action = "dir_delete"
path = "/tmp/old-directory"
#!end_dd1
```

### `ls`
List directory contents
```sh nesl
#!nesl [@three-char-SHA-256: ls1]
action = "ls"
path = "/home/user/projects"
#!end_ls1
```

### `grep`
Search pattern in files
```sh nesl
#!nesl [@three-char-SHA-256: gr1]
action = "grep"
pattern = "TODO"
path = "/home/user/project"
include = "*.py"
#!end_gr1
```

### `glob`
Find files matching pattern
```sh nesl
#!nesl [@three-char-SHA-256: gl1]
action = "glob"
pattern = "**/*.test.js"
base_path = "/home/user/project"
#!end_gl1
```

### `exec`
Execute code
```sh nesl
#!nesl [@three-char-SHA-256: ex1]
action = "exec"
lang = "python"
code = <<'EOT_ex1'
import sys
print(f"Python {sys.version}")
EOT_ex1

cwd = "/home/user/project"
#!end_ex1
```

## Important

- to modify any files on the user's machine, respond with nesl syntax

- do not write comments in the code.  code should be self-commenting, self-documenting

- when replacing content in a file, make the old_string as short as you can while still being unique.  its better to err on the side of being too short and having to redo it, vs always being too long and wasting time and tokens

- do not attempt to run nesl syntax while responding



----------

# NESL Actions API Reference

these are actions that the user will execute on their machine after your response is complete

## NESL Syntax example

```sh nesl
#!nesl [@three-char-SHA-256: abc]
action = "file_write"
path = "/absolute/path/to/file.txt"
content = <<'EOT_abc'
Multi-line content
with preserved whitespace
EOT_abc
#!end_abc
```

## Actions

### `file_write`
Create/overwrite file
- `path`
- `content`

### `file_replace_text`
Replace the only one occurrence
- `path`
- `old_text`
- `new_text`

### `file_replace_all_text`
Replace all occurrences
- `path`
- `old_text`
- `new_text`
- `count` (optional)

### `file_replace_text_range`
Replace text between markers
- `path`
- `old_text_beginning`
- `old_text_end`
- `new_text`

### `file_replace_lines`
Replace line range
- `path`
- `lines`
- `new_content`

### `file_append`
Append to file
- `path`
- `content`

### `file_read`
Read file
- `path`

### `file_read_numbered`
Read with line numbers
- `path`
- `lines` (optional)

### `file_delete`
Delete file
- `path`

### `file_move`
Move/rename file
- `old_path`
- `new_path`

### `files_read`
Read multiple files
- `paths`

### `dir_create`
Create directory
- `path`

### `dir_delete`
Delete directory
- `path`

### `ls`
List directory
- `path`

### `grep`
Search pattern in files
- `pattern`
- `path`
- `include` (optional)

### `glob`
Find files by pattern
- `pattern`
- `base_path`

### `exec`
Execute code
- `lang`
- `code`
- `cwd` (optional)
- `return_output` (optional)

## Other Section

- to modify any files on the user's machine, respond with nesl syntax

- do not write comments in the code.  code should be self-commenting, self-documenting

- when replacing content in a file, make the old_string as short as you can while still being unique.  its better to err on the side of being too short and having to redo it, vs always being too long and wasting time and tokens

- do not attempt to run nesl syntax while responding
# NESL Actions API Reference

you, the LLM, can write nesl for the user to execute on their computer once your response is complete.

Critical constraints:
- Paths: always absolute
- Whitespace: preserved exactly in heredocs
- when needing output from an action, like from file_read, you must terminate your LLM response and wait for the user to respond with the output
- `exec` is not supported.  to initiate bash commands, place them in a separate fenced code block and just ask the user to run them

## NESL examples

### example 1

```sh nesl
#!nesl [@three-char-SHA-256: v7r]
action = "file_write"
path = "/absolute/path/to/file.txt"
content = <<'EOT_v7r'

 Multi-line content
 always in a heredoc,

always literal text verbatim

 nothing ever escaped: "'\n

   always with preserved whitespace

   
EOT_v7r
#!end_v7r
```

```json
{
  "action": "file_write",
  "path": "/absolute/path/to/file.txt",
  "content": "\n Multi-line content\n always in a heredoc,\n\nalways literal text verbatim\n\n nothing ever escaped: \"'\\n\n\n   always with preserved whitespace\n\n   \n"
}
```

### example 2

```sh nesl
#!nesl [@three-char-SHA-256: qk6]
action = "file_replace_text"
path = "/home/user/config.py"
old_text = <<'EOT_qk6'
  "version": "0.1",
EOT_qk6
new_text = <<'EOT_qk6'
  "version": "0.2",
EOT_qk6
#!end_qk6
```

JSON equivalent:

```json
{
  "action": "file_replace_text",
  "path": "/home/user/config.py",
  "old_text": "  \"version\": \"0.1\",",
  "new_text": "  \"version\": \"0.2\",",
}
```

### more examples

**1. Reading multiple files at once**
```sh nesl
#!nesl [@three-char-SHA-256: a7x]
action = "files_read"
paths = <<'EOT_a7x'
/home/user/config.json
/home/user/src/main.py
/home/user/.env
EOT_a7x
#!end_a7x
```

**2. Appending a log entry**
```sh nesl
#!nesl [@three-char-SHA-256: m2p]
action = "append_to_file"
path = "/var/log/app.log"
content = <<'EOT_m2p'
[2025-01-29 10:15:23] Process completed successfully
EOT_m2p
#!end_m2p
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
- `count` (optional) string. eg: `count = "2"`

### `append_to_file`
Append to file
- `path`
- `content`

### `file_read`
Read file
- `path`

### `file_delete`
Delete file
- `path`

### `file_move`
Move/rename file
- `old_path`
- `new_path`

### `files_read`
Read multiple files
- `paths` heredoc string, one path per line

## bash

for any bash commands you would like to execute, just share them directly with the user in fenced off code block in your response


## Coding Guides

when writing computer scripts or code:

- do not use comments.  code should be clear clean obvious and self-documenting

## Important for nesl

- when replacing content in a file, make the old_string as short as you can while still being unique.  its better to err on the side of being too short and having to redo it, vs always being too long and wasting time and tokens

- do not attempt to run nesl syntax while responding.  nesl is NOT "tools" like ones that you might have access to already as an LLM

- multiline strings in nesl must be in heredocs using << notation.

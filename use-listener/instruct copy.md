# NESL Actions API Reference

these are actions that the user will execute on their machine after your response is complete

## NESL Syntax example 


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

**Critical constraints:**
- Paths: always absolute
- Whitespace: preserved exactly in heredocs

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
#!nesl [@three-char-SHA-256: fr2]
action = "file_replace_text"
path = "/etc/config.ini"

old_text = <<'EOT_fr2'
//this bit of code exists in the file several times
EOT_fr2

new_text = <<'EOT_fr2'
//replacement text to replace in all locations
EOT_fr2

#!end_fr2
```

### `file_read` 
Read single file
```sh nesl
#!nesl [@three-char-SHA-256: rd3]
action = "file_read"
path = "/var/log/app.log"
#!end_rd3
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

## Other Section



- to modify any files on the user's machine, respond with nesl syntax

- do not write comments in the code.  code should be self-commenting, self-documenting

- when replacing content in a file, make the old_string as short as you can while still being unique.  its better to err on the side of being too short and having to redo it, vs always being too long and wasting time and tokens

- do not attempt to run nesl syntax while responding
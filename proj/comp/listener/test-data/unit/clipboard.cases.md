# Clipboard Integration Tests

the following test cases show a series of fenced code blocks separated by numbers.  each block is text that gets added to clipboard, and the numbers are the amount of time in milliseconds before the next item is added to the clipboard ("copied")


# Core Clipboard Monitoring System
The system monitors clipboard changes and looks for paired clipboard entries that together form a valid NESL command:

1. **Delimiter Matching**: The system looks for matching delimiters in clipboard entries:
   - First clipboard entry contains an ending delimiter (e.g., `#!end_abc`)
   - A subsequent clipboard entry contains the matching start delimiter (e.g., `#!nesl [@three-char-SHA-256: abc]`)
   - The delimiters must have the same identifier (e.g., "abc")

2. **Timing Constraints**: 
   - There's a 1800ms timeout window between related clipboard entries
   - If more than 1800ms passes between the first and second entry, no action is triggered
   - Empty clipboard entries or unrelated content can appear between the two matching entries without breaking the pattern

3. **Content Assembly**:
   - When matching delimiters are found within the timeout window, the system combines the content
   - The smaller clipboard entry is used as the "target" (typically contains the actual NESL command)
   - The larger entry is treated as supplementary and ignored for execution purposes

4. **NESL Execution**:
   - Once a valid NESL command is assembled, it's executed
   - Results are displayed with success indicators (e.g., "✅ file_write /path/to/file")
   - The output includes "=== SLUPE RESULTS ===" header when execution occurs

### Key Behaviors from Test Cases:

1. **Order Independence**: The NESL command parts can be copied in either order - the system identifies which is the actual command based on size
2. **Robustness**: The system ignores:
   - Clipboard entries that don't contain matching delimiters
   - Content after the timeout window
   - Mismatched delimiter pairs
3. **Immediate Execution**: As soon as a valid pair is detected, the command executes without waiting for additional clipboard changes



## simplest

### inputs

```sh
#!end_a
```

110

```sh
X
#!end_a
```

### output contains
```
=== SLUPE RESULTS ===
```



## simplest_fail_1

### inputs

```sh
#!end_a
```

110

```sh
X
#!end_b
```

### output contains
null



## simplest_fail_2

### inputs

```sh
#!end_a
```

110

```sh
X
#!end_ab
```

### output contains
null


## simple_works

### inputs

```sh
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
#!end_qx7737fhsid838ww8f9sd723f
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

110

```sh
#!nesl [@three-char-SHA-256: qx7737fhsid838ww8f9sd723f]
action = "file_write"
path = "/tmp/t_simple_works/2.txt"
content = "hi"
#!end_qx7737fhsid838ww8f9sd723f
```


### output contains
```
✅ file_write /tmp/t_simple_works/2.txt
```


## simple_fails

### inputs

```sh
#!nesl [@three-char-SHA-256: b8fw34t]
action = "file_write"
path = "/tmp/t_simple_fails/1.txt"
content = "hi"
#!end_b8fw34t
```

110

```sh
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
x#!end_b8fw34t
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

```

### output contains
null


## simple_fails2

### inputs

```sh
#!nesl [@three-char-SHA-256: as7]
action = "file_write"
path = "/tmp/t_simple_fails2/1.txt"
content = "hi"
#!end_as7
```

110

```sh
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 #!end_as7
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

```

### output contains
null


## target_copied_first

### inputs

```sh nesl
#!nesl [@three-char-SHA-256: n6bgew9849w3]
action = "file_write"
path = "/tmp/t_target_copied_first/out.txt"
content = <<'EOT_n6bgew9849w3'
hello
EOT_n6bgew9849w3
#!end_n6bgew9849w3
```

110

```sh nesl
lalala
#!nesl [@three-char-SHA-256: n6bgew9849w3]
action = "file_read"
path = "/tmp/t_target_copied_first/out.txt"
#!end_n6bgew9849w3
this clipboard content gets ignored because its the bigger one
this clipboard content gets ignored because its the bigger one
this clipboard content gets ignored because its the bigger one
```

### output contains
```
✅ file_write /tmp/t_target_copied_first/out.txt
```

## target_copied_second_fast

### inputs

```sh nesl
lalala
this clipboard content gets ignored because its the bigger one
#!nesl [@three-char-SHA-256: xyz]
action = "file_write"
path = "/tmp/t_target_copied_second_fast/first.txt"
content = <<'EOT_xyz'
test content
EOT_xyz
#!end_xyz
```

110

```sh nesl
#!nesl [@three-char-SHA-256: xyz]
action = "file_write"
path = "/tmp/t_target_copied_second_fast/second.txt"
content = <<'EOT_xyz'
test content
EOT_xyz
#!end_xyz
```

### output contains
```
✅ file_write /tmp/t_target_copied_second_fast/second.txt
```

## near_timeout_boundary

### inputs
```sh nesl
#!nesl [@three-char-SHA-256: def]
action = "file_write"
path = "/tmp/t_near_timeout_boundary/first.txt"
content = <<'EOT_def'
slow
EOT_def
#!end_def
```

1700

```sh nesl
this clipboard content gets ignored because its the bigger one
#!nesl [@three-char-SHA-256: def]
action = "file_write"
path = "/tmp/t_near_timeout_boundary/second.txt"
content = <<'EOT_def'
ignored content
EOT_def
#!end_def
```

### output contains
```
✅ file_write /tmp/t_near_timeout_boundary/first.txt
```

## exceeds_1800_timeout_no_trigger

### inputs
```sh nesl
#!nesl [@three-char-SHA-256: ghi]
action = "file_write"
path = "/tmp/t_exceeds_timeout_no_trigger/test.txt"
content = <<'EOT_ghi'
timeout
EOT_ghi
#!end_ghi
```

1850

```sh nesl
asdifasdfkasdf
#!nesl [@three-char-SHA-256: ghi]
action = "file_write"
path = "/tmp/t_exceeds_timeout_no_trigger/ignored.txt"
content = <<'EOT_ghi'
ignored
EOT_ghi
#!end_ghi
```

### output contains
null

## mismatched_delimiters_no_trigger

### inputs
```sh nesl
#!nesl [@three-char-SHA-256: jkl]
action = "file_write"
path = "/tmp/t_mismatched_delimiters_no_trigger/test.txt"
content = <<'EOT_jkl'
mismatch
EOT_jkl
#!end_jkl
```

110

```sh nesl
as;doifjsodfij
#!nesl [@three-char-SHA-256: 56d]
action = "file_write"
path = "/tmp/t_mismatched_delimiters_no_trigger/different.txt"
content = <<'EOT_56d'
different delimiter
EOT_56d
#!end_56d
```

### output contains
null

## valid_target_content_separated_by_empty_clipboard_1


```sh nesl
#!nesl [@three-char-SHA-256: 34g]
action = "file_write"
path = "/tmp/t_valid_target_content_separated_by_empty_clipboard_1/1st.txt"
content = <<'EOT_34g'
hello
EOT_34g
#!end_34g
```

243


```sh nesl
hey hey hey hey hey hey hey hey 
```

197


```sh nesl
lalala
#!nesl [@three-char-SHA-256: 34g]
action = "file_read"
path = "/tmp/t_valid_target_content_separated_by_empty_clipboard_1/3rd.txt"
#!end_34g
this clipboard content gets ignored because its the bigger one
this clipboard content gets ignored because its the bigger one
this clipboard content gets ignored because its the bigger one
```

### output contains
```
✅ file_write /tmp/t_valid_target_content_separated_by_empty_clipboard_1/1st.txt
```


## valid_target_content_separated_by_empty_clipboard_2



```sh nesl
lalala
#!nesl [@three-char-SHA-256: abc]
action = "file_read"
path = "/tmp/t_valid_target_content_separated_by_empty_clipboard_2/1st.txt"
#!end_abc
this clipboard content gets ignored because its the bigger one
this clipboard content gets ignored because its the bigger one
this clipboard content gets ignored because its the bigger one
```

78


```sh nesl
```

87


```sh nesl
hi
```

124


```sh nesl
#!nesl [@three-char-SHA-256: abc]
action = "file_write"
path = "/tmp/t_valid_target_content_separated_by_empty_clipboard_2/4th.txt"
content = <<'EOT_abc'
hello
EOT_abc
#!end_abc
```


### output contains
```
✅ file_write /tmp/t_valid_target_content_separated_by_empty_clipboard_2/4th.txt
```


## invalid_target_content_separated_by_empty_clipboard_timeout

```sh nesl
lalala
#!nesl [@three-char-SHA-256: abc]
action = "file_read"
path = "/tmp/t_invalid_target_content_separated_by_empty_clipboard_timeout/1st.txt"
#!end_abc
this clipboard content gets ignored because its the bigger one
this clipboard content gets ignored because its the bigger one
this clipboard content gets ignored because its the bigger one
```

700


```sh nesl
```

700


```sh nesl
hi
```

700


```sh nesl
#!nesl [@three-char-SHA-256: abc]
action = "file_write"
path = "/tmp/t_invalid_target_content_separated_by_empty_clipboard_timeout/4th.txt"
content = <<'EOT_abc'
hello
EOT_abc
#!end_abc
```


### output contains
null
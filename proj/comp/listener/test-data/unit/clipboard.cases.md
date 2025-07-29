# Clipboard Integration Tests

## target_copied_first

### first
```sh nesl
#!nesl [@three-char-SHA-256: abc]
action = "file_write"
path = "/tmp/t_target_copied_first/out.txt"
content = <<'EOT_abc'
hello
EOT_abc
#!end_abc
```

### second
```sh nesl
lalala
#!nesl [@three-char-SHA-256: abc]
action = "file_read"
path = "/tmp/t_target_copied_first/out.txt"
#!end_abc
this is the bigger one. gets ignored.
this is the bigger one. gets ignored.
this is the bigger one. gets ignored.
```

### delay
110

### expected
```
✅ file_write /tmp/t_target_copied_first/out.txt
```

## target_copied_second_fast

### first
```sh nesl
lalalalala this one is bigger
#!nesl [@three-char-SHA-256: xyz]
action = "file_write"
path = "/tmp/t_target_copied_second_fast/first.txt"
content = <<'EOT_xyz'
test content
EOT_xyz
#!end_xyz
```

### second
```sh nesl
#!nesl [@three-char-SHA-256: xyz]
action = "file_write"
path = "/tmp/t_target_copied_second_fast/second.txt"
content = <<'EOT_xyz'
test content
EOT_xyz
#!end_xyz
```

### delay
110

### expected
```
✅ file_write /tmp/t_target_copied_second_fast/second.txt
```

## near_timeout_boundary

### first
```sh nesl
#!nesl [@three-char-SHA-256: def]
action = "file_write"
path = "/tmp/t_near_timeout_boundary/first.txt"
content = <<'EOT_def'
slow
EOT_def
#!end_def
```

### second
```sh nesl
bigger this gets ignored
#!nesl [@three-char-SHA-256: def]
action = "file_write"
path = "/tmp/t_near_timeout_boundary/second.txt"
content = <<'EOT_def'
ignored content
EOT_def
#!end_def
```

### delay
1700

### expected
```
✅ file_write /tmp/t_near_timeout_boundary/first.txt
```

## exceeds_timeout_no_trigger

### first
```sh nesl
#!nesl [@three-char-SHA-256: ghi]
action = "file_write"
path = "/tmp/t_exceeds_timeout_no_trigger/test.txt"
content = <<'EOT_ghi'
timeout
EOT_ghi
#!end_ghi
```

### second
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

### delay
2000

### expected
null

## mismatched_delimiters_no_trigger

### first
```sh nesl
#!nesl [@three-char-SHA-256: jkl]
action = "file_write"
path = "/tmp/t_mismatched_delimiters_no_trigger/test.txt"
content = <<'EOT_jkl'
mismatch
EOT_jkl
#!end_jkl
```

### second
```sh nesl
as;doifjsodfij
#!nesl [@three-char-SHA-256: xyz]
action = "file_write"
path = "/tmp/t_mismatched_delimiters_no_trigger/different.txt"
content = <<'EOT_xyz'
different delimiter
EOT_xyz
#!end_xyz
```

### delay
110

### expected
null
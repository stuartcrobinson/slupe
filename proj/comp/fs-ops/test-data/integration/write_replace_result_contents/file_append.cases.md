# file_append Integration Tests

## file_append

### 001-append-after-write

```sh nesl
#!nesl [@three-char-SHA-256: aw1]
action = "file_write"
path = "/tmp/t_append-after-write/log.txt"
content = <<'EOT_aw1'
=== LOG START ===
[2024-01-01 09:00] System initialized
[2024-01-01 09:15] Configuration loaded
EOT_aw1
#!end_aw1
```

```sh nesl
#!nesl [@three-char-SHA-256: aw2]
action = "file_append"
path = "/tmp/t_append-after-write/log.txt"
content = <<'EOT_aw2'
[2024-01-01 10:00] User session started
[2024-01-01 10:30] Transaction completed
=== LOG END ===
EOT_aw2
#!end_aw2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_append-after-write/log.txt",
    "bytesWritten": 88
  }
}
```

```
=== LOG START ===
[2024-01-01 09:00] System initialized
[2024-01-01 09:15] Configuration loaded
[2024-01-01 10:00] User session started
[2024-01-01 10:30] Transaction completed
=== LOG END ===
```

### 002-append-create-nested-dirs

```sh nesl
#!nesl [@three-char-SHA-256: an1]
action = "file_append"
path = "/tmp/t_append-nested/deep/dir/structure/notes.txt"
content = <<'EOT_an1'
First entry in a deeply nested file.
This tests parent directory creation.
EOT_an1
#!end_an1
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_append-nested/deep/dir/structure/notes.txt",
    "bytesWritten": 73
  }
}
```

```
First entry in a deeply nested file.
This tests parent directory creation.
```

### 003-multiple-appends

```sh nesl
#!nesl [@three-char-SHA-256: ma1]
action = "file_write"
path = "/tmp/t_multiple-appends/build.log"
content = "=== BUILD LOG ==="
#!end_ma1
```

```sh nesl
#!nesl [@three-char-SHA-256: ma2]
action = "file_append"
path = "/tmp/t_multiple-appends/build.log"
content = <<'EOT_ma2'

Step 1: Compiling source files...
Step 2: Running tests...
EOT_ma2
#!end_ma2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_multiple-appends/build.log",
    "bytesWritten": 59
  }
}
```

```
=== BUILD LOG ===
Step 1: Compiling source files...
Step 2: Running tests...
```

### 004-append-after-replace

```sh nesl
#!nesl [@three-char-SHA-256: ar1]
action = "file_write"
path = "/tmp/t_append-after-replace/config.yaml"
content = <<'EOT_ar1'
server:
  host: localhost
  port: 3000

database:
  host: localhost
  port: 5432
EOT_ar1
#!end_ar1
```

```sh nesl
#!nesl [@three-char-SHA-256: ar2]
action = "file_replace_text"
path = "/tmp/t_append-after-replace/config.yaml"
old_text = "port: 3000"
new_text = "port: 8080"
#!end_ar2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_append-after-replace/config.yaml",
    "replacements": 1
  }
}
```

```sh nesl
#!nesl [@three-char-SHA-256: ar3]
action = "file_append"
path = "/tmp/t_append-after-replace/config.yaml"
content = <<'EOT_ar3'

logging:
  level: debug
  file: app.log
EOT_ar3
#!end_ar3
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_append-after-replace/config.yaml",
    "bytesWritten": 42
  }
}
```

```
server:
  host: localhost
  port: 8080

database:
  host: localhost
  port: 5432

logging:
  level: debug
  file: app.log
```
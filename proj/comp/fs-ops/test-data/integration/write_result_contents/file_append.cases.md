# file_append Integration Tests

## file_append

### 001-append-to-existing-file

```sh nesl
#!nesl [@three-char-SHA-256: ae1]
action = "file_write"
path = "/tmp/t_append-to-existing/log.txt"
content = <<'EOT_ae1'
[2024-01-01] Application started
[2024-01-01] Config loaded
EOT_ae1
#!end_ae1
```

```sh nesl
#!nesl [@three-char-SHA-256: ae2]
action = "file_append"
path = "/tmp/t_append-to-existing/log.txt"
content = <<'EOT_ae2'
[2024-01-02] User logged in
[2024-01-02] Task completed
EOT_ae2
#!end_ae2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_append-to-existing/log.txt",
    "bytesWritten": 54
  }
}
```

```
[2024-01-01] Application started
[2024-01-01] Config loaded
[2024-01-02] User logged in
[2024-01-02] Task completed
```

### 002-append-to-nonexistent-file

```sh nesl
#!nesl [@three-char-SHA-256: an1]
action = "file_append"
path = "/tmp/t_append-nonexistent/new-file.txt"
content = "This creates a new file"
#!end_an1
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_append-nonexistent/new-file.txt",
    "bytesWritten": 23
  }
}
```

```
This creates a new file
```

### 003-append-with-newlines

```sh nesl
#!nesl [@three-char-SHA-256: aw1]
action = "file_write"
path = "/tmp/t_append-newlines/data.txt"
content = "First line"
#!end_aw1
```

```sh nesl
#!nesl [@three-char-SHA-256: aw2]
action = "file_append"
path = "/tmp/t_append-newlines/data.txt"
content = <<'EOT_aw2'

Second line
Third line
EOT_aw2
#!end_aw2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_append-newlines/data.txt",
    "bytesWritten": 23
  }
}
```

```
First line
Second line
Third line
```

### 004-append-empty-content

```sh nesl
#!nesl [@three-char-SHA-256: ae3]
action = "file_write"
path = "/tmp/t_append-empty/test.txt"
content = "Original content"
#!end_ae3
```

```sh nesl
#!nesl [@three-char-SHA-256: ae4]
action = "file_append"
path = "/tmp/t_append-empty/test.txt"
content = ""
#!end_ae4
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_append-empty/test.txt",
    "bytesWritten": 0
  }
}
```

```
Original content
```

### 005-append-special-characters

```sh nesl
#!nesl [@three-char-SHA-256: as1]
action = "file_write"
path = "/tmp/t_append-special/code.js"
content = <<'EOT_as1'
function test() {
  console.log("Hello");
}
EOT_as1
#!end_as1
```

```sh nesl
#!nesl [@three-char-SHA-256: as2]
action = "file_append"
path = "/tmp/t_append-special/code.js"
content = <<'EOT_as2'

function special() {
  const chars = 'Special: "\'\\n\t${}';
  return chars;
}
EOT_as2
#!end_as2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_append-special/code.js",
    "bytesWritten": 78
  }
}
```

```
function test() {
  console.log("Hello");
}

function special() {
  const chars = 'Special: "\'\\n\t${}';
  return chars;
}
```
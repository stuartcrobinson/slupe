# read_files Integration Tests

## read_files

### 001-read-multiple-files

```sh nesl
#!nesl [@three-char-SHA-256: rm1]
action = "write_file"
path = "/tmp/t_read-multiple-files/files-read-test/file1.txt"
content = "Content of file 1"
#!end_rm1

#!nesl [@three-char-SHA-256: rm2]
action = "write_file"
path = "/tmp/t_read-multiple-files/files-read-test/file2.txt"
content = "Content of file 2"
#!end_rm2

#!nesl [@three-char-SHA-256: rm3]
action = "write_file"
path = "/tmp/t_read-multiple-files/files-read-test/subdir/file3.txt"
content = "Content of file 3 in subdirectory"
#!end_rm3
```

```sh nesl
#!nesl [@three-char-SHA-256: rm4]
action = "read_files"
paths = <<'EOT_rm4'
/tmp/t_read-multiple-files/files-read-test/file1.txt
/tmp/t_read-multiple-files/files-read-test/file2.txt
/tmp/t_read-multiple-files/files-read-test/subdir/file3.txt
EOT_rm4
#!end_rm4
```

```json
{
  "success": true,
  "data": {
    "paths": [
      "/tmp/t_read-multiple-files/files-read-test/file1.txt",
      "/tmp/t_read-multiple-files/files-read-test/file2.txt",
      "/tmp/t_read-multiple-files/files-read-test/subdir/file3.txt"
    ],
    "content": [
      "Content of file 1",
      "Content of file 2",
      "Content of file 3 in subdirectory"
    ]
  }
}
```

### 002-read-with-empty-lines

```sh nesl
#!nesl [@three-char-SHA-256: el1]
action = "write_file"
path = "/tmp/t_read-with-empty-lines/files-read-empty-lines/first.txt"
content = "First file"
#!end_el1

#!nesl [@three-char-SHA-256: el2]
action = "write_file"
path = "/tmp/t_read-with-empty-lines/files-read-empty-lines/second.txt"
content = "Second file"
#!end_el2
```

```sh nesl
#!nesl [@three-char-SHA-256: el3]
action = "read_files"
paths = <<'EOT_el3'
/tmp/t_read-with-empty-lines/files-read-empty-lines/first.txt

/tmp/t_read-with-empty-lines/files-read-empty-lines/second.txt

EOT_el3
#!end_el3
```

```json
{
  "success": true,
  "data": {
    "paths": [
      "/tmp/t_read-with-empty-lines/files-read-empty-lines/first.txt",
      "/tmp/t_read-with-empty-lines/files-read-empty-lines/second.txt"
    ],
    "content": [
      "First file",
      "Second file"
    ]
  }
}
```

### 003-read-with-missing-file

```sh nesl
#!nesl [@three-char-SHA-256: mf1]
action = "write_file"
path = "/tmp/t_read-with-missing-file/files-read-missing/exists.txt"
content = "This file exists"
#!end_mf1
```

```sh nesl
#!nesl [@three-char-SHA-256: mf2]
action = "read_files"
paths = <<'EOT_mf2'
/tmp/t_read-with-missing-file/files-read-missing/exists.txt
/tmp/t_read-with-missing-file/files-read-missing/does-not-exist.txt
/tmp/t_read-with-missing-file/files-read-missing/also-missing.txt
EOT_mf2
#!end_mf2
```

```json
{
  "success": true,
  "data": {
    "paths": ["/tmp/t_read-with-missing-file/files-read-missing/exists.txt"],
    "content": ["This file exists"],
    "errors": [
      {
        "path": "/tmp/t_read-with-missing-file/files-read-missing/does-not-exist.txt",
        "error": "ENOENT: no such file or directory, open '/tmp/t_read-with-missing-file/files-read-missing/does-not-exist.txt'"
      },
      {
        "path": "/tmp/t_read-with-missing-file/files-read-missing/also-missing.txt",
        "error": "ENOENT: no such file or directory, open '/tmp/t_read-with-missing-file/files-read-missing/also-missing.txt'"
      }
    ]
  }
}
```

### 004-read-empty-paths

```
```

```sh nesl
#!nesl [@three-char-SHA-256: ep1]
action = "read_files"
paths = <<'EOT_ep1'


EOT_ep1
#!end_ep1
```

```json
{
  "success": false,
  "error": "read_files: No paths provided"
}
```

### 005-read-single-file

```sh nesl
#!nesl [@three-char-SHA-256: sf1]
action = "write_file"
path = "/tmp/t_read-single-file/files-read-single/only.txt"
content = "Only file content"
#!end_sf1
```

```sh nesl
#!nesl [@three-char-SHA-256: sf2]
action = "read_files"
paths = "/tmp/t_read-single-file/files-read-single/only.txt"
#!end_sf2
```

```json
{
  "success": true,
  "data": {
    "paths": ["/tmp/t_read-single-file/files-read-single/only.txt"],
    "content": ["Only file content"]
  }
}
```

### 006-read-all-missing-files

```
```

```sh nesl
#!nesl [@three-char-SHA-256: am1]
action = "read_files"
paths = <<'EOT_am1'
/tmp/t_read-all-missing/files-read-all-missing/missing1.txt
/tmp/t_read-all-missing/files-read-all-missing/missing2.txt
/tmp/t_read-all-missing/files-read-all-missing/missing3.txt
EOT_am1
#!end_am1
```

```json
{
  "success": false,
  "error": "read_files: Failed to read all 3 file(s):\n  /tmp/t_read-all-missing/files-read-all-missing/missing1.txt: ENOENT: no such file or directory, open '/tmp/t_read-all-missing/files-read-all-missing/missing1.txt'\n  /tmp/t_read-all-missing/files-read-all-missing/missing2.txt: ENOENT: no such file or directory, open '/tmp/t_read-all-missing/files-read-all-missing/missing2.txt'\n  /tmp/t_read-all-missing/files-read-all-missing/missing3.txt: ENOENT: no such file or directory, open '/tmp/t_read-all-missing/files-read-all-missing/missing3.txt'"
}
```

### 007-read-files-with-special-content

```sh nesl
#!nesl [@three-char-SHA-256: sc1]
action = "write_file"
path = "/tmp/t_read-files-with-special-content/files-read-special/quotes.txt"
content = "File with \"quotes\" and 'apostrophes'"
#!end_sc1

#!nesl [@three-char-SHA-256: sc2]
action = "write_file"
path = "/tmp/t_read-files-with-special-content/files-read-special/multiline.txt"
content = <<'EOT_sc2'
Line 1
Line 2
Line 3
EOT_sc2
#!end_sc2
```

```sh nesl
#!nesl [@three-char-SHA-256: sc3]
action = "read_files"
paths = <<'EOT_sc3'
/tmp/t_read-files-with-special-content/files-read-special/quotes.txt
/tmp/t_read-files-with-special-content/files-read-special/multiline.txt
EOT_sc3
#!end_sc3
```

```json
{
  "success": true,
  "data": {
    "paths": [
      "/tmp/t_read-files-with-special-content/files-read-special/quotes.txt",
      "/tmp/t_read-files-with-special-content/files-read-special/multiline.txt"
    ],
    "content": [
      "File with \"quotes\" and 'apostrophes'",
      "Line 1\nLine 2\nLine 3"
    ]
  }
}
```
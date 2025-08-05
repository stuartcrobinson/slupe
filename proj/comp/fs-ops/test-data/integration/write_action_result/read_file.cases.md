# read_file Integration Tests

## read_file

### 001-read-existing-file

```sh nesl
#!nesl [@three-char-SHA-256: crf]
action = "write_file"
path = "/tmp/t_read-existing-file/readable.txt"
content = "This is readable content"
#!end_crf
```

```sh nesl
#!nesl [@three-char-SHA-256: rdf]
action = "read_file"
path = "/tmp/t_read-existing-file/readable.txt"
#!end_rdf
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_read-existing-file/readable.txt",
    "content": "This is readable content"
  }
}
```

### 002-read-nonexistent-file

```sh nesl
```

```sh nesl
#!nesl [@three-char-SHA-256: rnx]
action = "read_file"
path = "/tmp/t_read-nonexistent-file/not-there.txt"
#!end_rnx
```

```json
{
  "success": false,
  "error": "ENOENT: no such file or directory, open '/tmp/t_read-nonexistent-file/not-there.txt'"
}
```

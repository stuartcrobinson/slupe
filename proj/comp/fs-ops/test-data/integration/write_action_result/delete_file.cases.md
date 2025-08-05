# delete_file Integration Tests

## delete_file

### 001-delete-existing-file

```sh nesl
#!nesl [@three-char-SHA-256: cre]
action = "write_file"
path = "/tmp/t_delete-existing-file/to-delete.txt"
content = "This file will be deleted"
#!end_cre
```

```sh nesl
#!nesl [@three-char-SHA-256: del]
action = "delete_file"
path = "/tmp/t_delete-existing-file/to-delete.txt"
#!end_del
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_delete-existing-file/to-delete.txt"
  }
}
```

### 002-delete-nonexistent-file

```sh nesl
```

```sh nesl
#!nesl [@three-char-SHA-256: dnf]
action = "delete_file"
path = "/tmp/t_delete-nonexistent-file/does-not-exist.txt"
#!end_dnf
```

```json
{
  "success": false,
  "error": "ENOENT: no such file or directory, unlink '/tmp/t_delete-nonexistent-file/does-not-exist.txt'"
}
```

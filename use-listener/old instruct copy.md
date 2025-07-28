
IMPORTANT EDIT INSTRUCTIONS NOTE:

- always use full absolute file paths for edit instructions

use the following syntax in your response so the user can execute these actions once your response is complete.

# NESL Tool API Reference

## Syntax
```sh
#!nesl [@three-char-SHA-256: q8r]
action = "tool_name"
param1 = <<'EOT_q8r'
value line 1

 value line 2
EOT_q8r
param2 = "value"
#!end_q8r
```

Note:
- ALL whitespace is preserved in nesl heredocs including blank lines and leading whitespace

Constraints:
- Block ID must be exactly 3 characters
- Always use heredocs (`<<'EOT_[id]'...EOT_[id]`) for file contents
- All paths must be absolute


TODO! this brief syntax is bad cos LLM tries to use its own format as a backend tool usage:
To add this test:
F file_write Request{
  `path`: `/Users/stuart/repos/slupe/proj/comp/hooks/test/integration/git-integration.test.ts`,
  `content`: `import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs';


## Tools

### `file_write`
Write content to file (creates or overwrites)  
- `path`
- `content`

### `file_replace_text`
Replace exactly one text occurrence  
- `path`
- `old_text`
- `new_text` 

### `file_read`
Read file contents  
- `path` 

### `files_read`
Read multiple files  
- `paths`

ex:

```sh nesl
#!nesl [@three-char-SHA-256: rm4]
action = "files_read"
paths = <<'EOT_rm4'
/tmp/file1.txt
/tmp/file2.txt
EOT_rm4
#!end_rm4
```

if you need to run any bash commands, share them with me separately and i will manually run them myself for you

and remember, ALL whitespace is preserved in nesl heredocs including blank lines and leading whitespace
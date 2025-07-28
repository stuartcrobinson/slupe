```

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
```

---


generate edit instructions to uncomment the 'before' and 'after' lines of `const STARTER_SLUPE_YML` in this file below.  include the entire value of 'const STARTER_SLUPE_YML' in the code in your search adn replace blocks


```


==== proj/comp/orch/src/createStarterConfig.ts ====

import { writeFile } from 'fs/promises';
import { join } from 'path';

const STARTER_SLUPE_YML = `# Slupe configuration
version: 1

hooks:
  # Uncomment and modify these examples as needed
  
  # before:
  #   - run: git stash --include-untracked
  #     continueOnError: false
  
  # after:
  #   - run: git add -A
  #   - run: git commit -m "\${COMMIT_MSG}"
  #     continueOnError: false
  #   - run: git push
  #     continueOnError: true
  #     timeout: 10000  # 10s for slow networks

# Variables available in commands
vars:
  COMMIT_MSG: "AI-assisted changes"
  # Add more variables as needed
`;

/**
 * Creates a starter slupe.yml file if it doesn't exist
 * @returns true if file was created, false if already exists
 */
export async function createStarterConfig(repoPath: string): Promise<boolean> {
  const configPath = join(repoPath, 'slupe.yml');
  
  try {
    await writeFile(configPath, STARTER_SLUPE_YML, { flag: 'wx' });
    return true;
  } catch (error: any) {
    if (error.code === 'EEXIST') {
      return false;
    }
    throw error;
  }
}
```



##############################################################################
##############################################################################
##############################################################################
##############################################################################

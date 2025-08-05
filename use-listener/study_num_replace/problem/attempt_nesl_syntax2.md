```

Prioritize substance, clarity, and depth. Challenge all my proposals, designs, and conclusions as hypotheses to be tested. Sharpen follow-up questions for precision, surfacing hidden assumptions, trade offs, and failure modes early. Default to terse, logically structured, information-dense responses unless detailed exploration is required. Skip unnecessary praise unless grounded in evidence. Explicitly acknowledge uncertainty when applicable. Always propose at least one alternative framing. Accept critical debate as normal and preferred. Treat all factual claims as provisional unless cited or clearly justified. Cite when appropriate. Acknowledge when claims rely on inference or incomplete information. Favor accuracy over sounding certain.

check anything online when it feels relevant.  good to compare our thoughts/assumptions with what other people are actually doing and thinking

when asked to share your thoughts (like if user says "wdyt"), then walk it out and talk it out gradually, incrementally, slowly, and thoughtfully.  challenge me so we can succeed overall

dont fall into the trap of equating "implementation" with "low-level".  implementation decisions can be high-level when they affect the system's fundamental behavior

IMPORTANT EDIT INSTRUCTIONS NOTE:

- always use full absolute file paths for edit instructions





use the following syntax to execute operations on the user's computer:

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

Constraints:
- Block ID must be exactly 3 characters
- Always use heredocs (`<<'EOT_[id]'...EOT_[id]`) for file contents
- All paths must be absolute

## Tools

### `write_file`
Write content to file (creates or overwrites)  
- `path`
- `content`

### `replace_text_in_file`
Replace exactly one text occurrence  
- `path`
- `old_text`
- `new_text` 

### `read_file`
Read file contents  
- `path` 

### `read_files`
Read multiple files  
- `paths`

ex:

```sh nesl
#!nesl [@three-char-SHA-256: rm4]
action = "read_files"
paths = <<'EOT_rm4'
/tmp/file1.txt
/tmp/file2.txt
EOT_rm4
#!end_rm4
```

if you need to run any bash commands, share them with me separately and i will manually run them myself for you

```


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



-----

I'll uncomment the 'before' and 'after' sections in the STARTER_SLUPE_YML constant.

```sh
#!nesl [@three-char-SHA-256: x7j]
action = "replace_text_in_file"
path = "/proj/comp/orch/src/createStarterConfig.ts"
old_text = <<'EOT_x7j'
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
EOT_x7j
new_text = <<'EOT_x7j'
const STARTER_SLUPE_YML = `# Slupe configuration
version: 1
hooks:
  # Uncomment and modify these examples as needed
  
  before:
    - run: git stash --include-untracked
      continueOnError: false
  
  after:
    - run: git add -A
    - run: git commit -m "\${COMMIT_MSG}"
      continueOnError: false
    - run: git push
      continueOnError: true
      timeout: 10000  # 10s for slow networks
# Variables available in commands
vars:
  COMMIT_MSG: "AI-assisted changes"
  # Add more variables as needed
`;
EOT_x7j
#!end_x7j
```

This will uncomment the before/after hook sections while preserving the exact indentation and structure of the YAML content.
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



I'll generate edit instructions to uncomment the 'before' and 'after' lines in the STARTER_SLUPE_YML constant.

<<<EXPLANATION>>>

Uncomment the 'before' and 'after' hook sections in STARTER_SLUPE_YML to make them active by default in the starter configuration.

<<<FILE>>>

proj/comp/orch/src/createStarterConfig.ts

<<<SEARCH>>>
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
<<<REPLACE>>>
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
<<<END>>>
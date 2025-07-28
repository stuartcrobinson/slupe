u can see that opus4's output failed to recognize multiple blank lines here below.  we need to check and see if my original syntax was better at getting it.  or use this as a real syntax study. 


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
You're absolutely right! We can use the default config that's already defined. Let me check how we can use it:

```sh nesl
#!nesl [@three-char-SHA-256: imp]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/test/integration/listener-workflow-v2.test.ts"
old_text = <<'EOT_imp'
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
EOT_imp
new_text = <<'EOT_imp'
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import { DEFAULT_SLUPE_YAML } from '../../../config/src/index.js';
EOT_imp
#!end_imp
```

```sh nesl
#!nesl [@three-char-SHA-256: cfg]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/test/integration/listener-workflow-v2.test.ts"
old_text = <<'EOT_cfg'
      // Setup
      await mkdir(testDir, { recursive: true });
      await writeFile(testFile, testCase.initialContent);
EOT_cfg
new_text = <<'EOT_cfg'
      // Setup
      await mkdir(testDir, { recursive: true });
      // Write default config to ensure test isolation
      await writeFile(join(testDir, 'slupe.yml'), DEFAULT_SLUPE_YAML);
      await writeFile(testFile, testCase.initialContent);
EOT_cfg
#!end_cfg
```

This uses the existing `DEFAULT_SLUPE_YAML` which already has empty hook arrays, providing a clean isolated environment for each test.
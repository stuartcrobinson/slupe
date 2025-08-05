import { describe, it, expect } from 'vitest';
import { parseNeslResponse } from '../../nesl-action-parser/src/index.js';
import { FsOpsExecutor } from '../src/index.js';
import type { FsGuard } from '../../fs-guard/src/index.js';
import { readFileSync } from 'fs';

const mockGuard: FsGuard = {
  async check(action) {
    return { allowed: true };
  }
};

const executor = new FsOpsExecutor(mockGuard);

describe('Debug write action', () => {
  it('check initial write content', async () => {
    const writeNesl = `#!nesl [@three-char-SHA-256: aw1]
action = "write_file"
path = "/tmp/t_debug-write/log.txt"
content = <<'EOT_aw1'
=== LOG START ===
[2024-01-01 09:00] System initialized
[2024-01-01 09:15] Configuration loaded
EOT_aw1
#!end_aw1`;

    console.log('Write NESL:', JSON.stringify(writeNesl));

    const parseResult = await parseNeslResponse(writeNesl);
    console.log('Parse result:', JSON.stringify(parseResult, null, 2));

    if (parseResult.actions.length > 0) {
      const content = parseResult.actions[0].parameters.content;
      console.log('Content to write length:', content.length);
      console.log('Content to write JSON:', JSON.stringify(content));
      console.log('Last char code:', content.charCodeAt(content.length - 1));

      // Execute the write
      await executor.execute(parseResult.actions[0]);

      // Read what was actually written
      const actual = readFileSync('/tmp/t_debug-write/log.txt', 'utf8');
      console.log('Actual file length:', actual.length);
      console.log('Actual file JSON:', JSON.stringify(actual));
      console.log('Actual last char code:', actual.charCodeAt(actual.length - 1));
    }
  });
});
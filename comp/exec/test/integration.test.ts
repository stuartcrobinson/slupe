import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { marked, Token } from 'marked';
import { executeCommand } from '../src/index';
import { platform } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testDataDir = join(__dirname, '../test-data/integration');

// Get all .cases.md files
const caseFiles = readdirSync(testDataDir)
  .filter(f => f.endsWith('.cases.md'))
  .sort();

describe('exec integration tests', () => {
  beforeAll(() => {
    if (platform() !== 'darwin') {
      throw new Error('Integration tests require macOS. Current platform: ' + platform());
    }
  });

  caseFiles.forEach(file => {
    const content = readFileSync(join(testDataDir, file), 'utf8');
    const tokens: Token[] = marked.lexer(content);

    // Extract test names from ## headings
    const testNames = tokens
      .filter(t => t.type === 'heading' && 'depth' in t && t.depth === 2)
      .map(t => (t as any).text as string);

    // Extract code blocks
    const codeBlocks = tokens
      .filter(t => t.type === 'code')
      .map(t => (t as any).text as string);

    describe(file, () => {
      testNames.forEach((name, i) => {
        const baseIndex = i * 2;
        if (baseIndex + 1 < codeBlocks.length) {
          it(name, async () => {
            const neslBlock = codeBlocks[baseIndex];
            const expectedJson = codeBlocks[baseIndex + 1];

            // Parse NESL to get action
            const action = parseNeslToAction(neslBlock);

            // Execute command
            const result = await executeCommand(action);

            // Parse expected result
            const expected = JSON.parse(expectedJson);

            // Compare results with dynamic value substitution
            let expectedStr = JSON.stringify(expected)
              .replace('{HOME_VALUE}', process.env.HOME || '');

            // Handle macOS /tmp symlink
            if (result.stdout === '/private/tmp\n' && expected.stdout === '/tmp\n') {
              expectedStr = expectedStr.replace('"/tmp\\n"', '"/private/tmp\\n"');
            }

            // Handle syntax error placeholders
            if (expected.stderr === '{SYNTAX_ERROR_OUTPUT}' && result.stderr && result.stderr.includes('SyntaxError')) {
              expectedStr = expectedStr.replace('"{SYNTAX_ERROR_OUTPUT}"', JSON.stringify(result.stderr));
            }
            if (expected.stderr === '{SYNTAX_ERROR_WITH_TRACEBACK}' && result.stderr && result.stderr.includes('SyntaxError')) {
              expectedStr = expectedStr.replace('"{SYNTAX_ERROR_WITH_TRACEBACK}"', JSON.stringify(result.stderr));
            }

            const expectedWithSubstitutions = JSON.parse(expectedStr);
            expect(result).toMatchObject(expectedWithSubstitutions);
          });
        }
      });
    });
  });
});

// Helper to parse NESL blocks into action objects
function parseNeslToAction(neslBlock: string): any {
  const lines = neslBlock.split('\n');
  const action: any = { parameters: {} };

  for (const line of lines) {
    if (line.startsWith('action = ')) {
      action.action = line.slice(9).replace(/"/g, '');
    } else if (line.startsWith('lang = ')) {
      action.parameters.lang = line.slice(7).replace(/"/g, '');
    } else if (line.startsWith('code = ')) {
      // Handle simple single-line code
      if (!line.includes('<<')) {
        // Handle quoted strings properly - don't just remove all quotes
        const codeMatch = line.match(/^code = "(.*)"/);
        if (codeMatch) {
          // Unescape the quotes
          action.parameters.code = codeMatch[1].replace(/\\"/g, '"');
        } else {
          action.parameters.code = line.slice(7);
        }
      }
    } else if (line.startsWith('cwd = ')) {
      action.parameters.cwd = line.slice(6).replace(/"/g, '');
    } else if (line.startsWith('timeout = ')) {
      action.parameters.timeout = parseInt(line.slice(10));
    }
  }

  // Handle multiline code blocks
  const codeMatch = neslBlock.match(/code = <<'(.+?)'\n([\s\S]+?)\n\1/);
  if (codeMatch) {
    action.parameters.code = codeMatch[2];
  }

  return action;
}
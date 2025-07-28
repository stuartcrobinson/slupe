import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, rmSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { marked } from 'marked';
import { parseNeslResponse } from '../../../nesl-action-parser/src/index';
import { FsOpsExecutor } from '../../src/index';
import type { FsGuard } from '../../../fs-guard/src/index';

// Mock FsGuard that allows all operations
const mockGuard: FsGuard = {
  async check(action) {
    return { allowed: true };
  }
};

const executor = new FsOpsExecutor(mockGuard);

// Find all .cases.md files recursively
function findTestFiles(dir: string, files: string[] = []): string[] {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      findTestFiles(fullPath, files);
    } else if (entry.endsWith('.cases.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('write_action_result tests', () => {
  let createdPaths: Set<string>;

  beforeEach(() => {
    createdPaths = new Set<string>();
  });

  afterEach(() => {
    // Clean up created test directories
    for (const path of createdPaths) {
      try {
        if (existsSync(path)) {
          rmSync(path, { recursive: true, force: true });
        }
      } catch (err) {
        // Continue silently
      }
    }
  });

  // Get test files from write_action_result directory
  const testDir = join(__dirname, '../../test-data/integration/write_action_result');
  const testFiles = findTestFiles(testDir).sort();

  testFiles.forEach(filepath => {
    const content = readFileSync(filepath, 'utf8');
    const tokens = marked.lexer(content);

    // Extract test group name from first h1 heading
    const groupHeading = tokens.find(t => t.type === 'heading' && t.depth === 1);
    const groupName = groupHeading?.text || 'Unknown Group';

    describe(groupName, () => {
      // Process h3 headings as test cases
      let currentTestName = '';
      let codeBlocks: string[] = [];

      /**
       * Process a test case with its code blocks
       * @param testName Name of the test
       * @param blocks Array of code blocks [writeBlock, actionBlock, resultBlock]
       */
      const processTest = (testName: string, blocks: string[]) => {
        it(testName, async () => {
          // Block 0: Write action (optional) - may contain multiple NESL blocks
          // Block 1: Test action
          // Block 2: Expected JSON result

          const writeBlock = blocks[0];
          const actionBlock = blocks[1];
          const resultBlock = blocks[2];

          // Execute write action if not empty
          if (writeBlock?.trim()) {

            const writeResult = await parseNeslResponse(writeBlock);

            // // Debug: log parse result
            // if (testName.includes('move-to-existing-file')) {
            //   console.log(`DEBUG: Parse errors: ${writeResult.errors.length}`);
            //   console.log(`DEBUG: Parse summary:`, writeResult.summary);
            //   if (writeResult.errors.length > 0) {
            //     writeResult.errors.forEach(err => {
            //       console.log(`DEBUG: Parse error:`, err);
            //     });
            //   }
            // }

            if (writeResult.errors.length > 0) {
              throw new Error(`Failed to parse write NESL: ${writeResult.errors.map(e => e.message).join(', ')}`);
            }

            // // Debug: log parsed actions
            // if (testName.includes('move-to-existing-file')) {
            //   console.log(`DEBUG: Parsed ${writeResult.actions.length} write actions`);
            //   writeResult.actions.forEach((action, i) => {
            //     console.log(`DEBUG: Action ${i}: ${action.action} path=${action.parameters?.path}`);
            //   });
            // }

            // Execute each write action
            for (const action of writeResult.actions) {
              const result = await executor.execute(action);
              // // Debug: log execution result
              // if (testName.includes('move-to-existing-file')) {
              //   console.log(`DEBUG: Executed ${action.action} path=${action.parameters?.path} success=${result.success}`);
              //   if (!result.success) {
              //     console.log(`DEBUG: Execution error:`, result.error);
              //   }
              // }
              // Track paths for cleanup
              if (action.parameters?.path) {
                const testDirMatch = action.parameters.path.match(/\/tmp\/t_[^\/]+/);
                if (testDirMatch) createdPaths.add(testDirMatch[0]);
              }
            }
          }

          // Execute test action
          const actionResult = await parseNeslResponse(actionBlock);
          if (actionResult.errors.length > 0) {
            throw new Error(`Failed to parse action NESL: ${actionResult.errors.map(e => e.message).join(', ')}`);
          }

          let testResult;
          for (const action of actionResult.actions) {
            testResult = await executor.execute(action);
            // Track paths for cleanup
            if (action.parameters?.path) {
              const testDirMatch = action.parameters.path.match(/\/tmp\/t_[^\/]+/);
              if (testDirMatch) createdPaths.add(testDirMatch[0]);
            }
            if (action.parameters?.old_path) {
              const testDirMatch = action.parameters.old_path.match(/\/tmp\/t_[^\/]+/);
              if (testDirMatch) createdPaths.add(testDirMatch[0]);
            }
            if (action.parameters?.new_path) {
              const testDirMatch = action.parameters.new_path.match(/\/tmp\/t_[^\/]+/);
              if (testDirMatch) createdPaths.add(testDirMatch[0]);
            }
          }

          // Verify result
          const expectedResult = JSON.parse(resultBlock);
          expect(testResult).toEqual(expectedResult);
        }, 30000);
      };

      // Parse tokens and create tests
      tokens.forEach((token, index) => {
        if (token.type === 'heading' && token.depth === 3) {
          // Process previous test if exists
          if (currentTestName && codeBlocks.length >= 2) {
            processTest(currentTestName, [...codeBlocks]);
          }

          // Start new test
          currentTestName = token.text;
          codeBlocks = [];
        } else if (token.type === 'code' && currentTestName) {
          codeBlocks.push(token.text);
        }
      });

      // Process final test
      if (currentTestName && codeBlocks.length >= 2) {
        processTest(currentTestName, [...codeBlocks]);
      }
    });
  });
});
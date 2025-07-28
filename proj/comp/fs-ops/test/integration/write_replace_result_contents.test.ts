import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, rmSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { marked } from 'marked';
import { parseNeslResponse } from '../../../nesl-action-parser/src/index.ts';
import { FsOpsExecutor } from '../../src/index.ts';
import type { FsGuard } from '../../../fs-guard/src/index.ts';

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

describe('write_replace_result_contents tests', () => {
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

  // Get test files from write_replace_result_contents directory
  const testDir = join(__dirname, '../../test-data/integration/write_replace_result_contents');
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

      tokens.forEach((token, index) => {
        if (token.type === 'heading' && token.depth === 3) {
          // Process previous test if exists
          if (currentTestName && codeBlocks.length >= 3) {
            const testName = currentTestName;
            const blocks = [...codeBlocks];

            it(testName, async () => {
              // Block 0: Write action
              // Block 1: Replace action
              // Block 2: Expected JSON result
              // Block 3: Expected file contents (optional)

              const writeBlock = blocks[0];
              const replaceBlock = blocks[1];
              const resultBlock = blocks[2];
              const contentsBlock = blocks[3];

              let targetPath: string | null = null;

              // Execute write action if not empty
              if (writeBlock?.trim()) {
                const writeResult = await parseNeslResponse(writeBlock);
                if (writeResult.errors.length > 0) {
                  throw new Error(`Failed to parse write NESL: ${writeResult.errors.map(e => e.message).join(', ')}`);
                }

                for (const action of writeResult.actions) {
                  await executor.execute(action);
                  // Track target path
                  if (action.parameters?.path) {
                    targetPath = action.parameters.path;
                    const testDirMatch = action.parameters.path.match(/\/tmp\/t_[^\/]+/);
                    if (testDirMatch) createdPaths.add(testDirMatch[0]);
                  }
                }
              }

              // Execute replace action
              const replaceResult = await parseNeslResponse(replaceBlock);
              if (replaceResult.errors.length > 0) {
                throw new Error(`Failed to parse replace NESL: ${replaceResult.errors.map(e => e.message).join(', ')}`);
              }

              let testResult;
              for (const action of replaceResult.actions) {
                testResult = await executor.execute(action);
                // Track target path if not already set
                if (!targetPath && action.parameters?.path) {
                  targetPath = action.parameters.path;
                }
                // Track paths for cleanup
                if (action.parameters?.path) {
                  const testDirMatch = action.parameters.path.match(/\/tmp\/t_[^\/]+/);
                  if (testDirMatch) createdPaths.add(testDirMatch[0]);
                }
              }

              // Verify result
              const expectedResult = JSON.parse(resultBlock);
              expect(testResult).toEqual(expectedResult);

              // Verify file contents if provided and operation succeeded
              if (contentsBlock && expectedResult.success && targetPath) {
                const actualContent = readFileSync(targetPath, 'utf8');
                expect(actualContent).toBe(contentsBlock);
              }
            }, 30000);
          }

          // Start new test
          currentTestName = token.text;
          codeBlocks = [];
        } else if (token.type === 'code' && currentTestName) {
          codeBlocks.push(token.text);
        }
      });

      // Process final test
      if (currentTestName && codeBlocks.length >= 3) {
        const testName = currentTestName;
        const blocks = [...codeBlocks];

        it(testName, async () => {
          const writeBlock = blocks[0];
          const replaceBlock = blocks[1];
          const resultBlock = blocks[2];
          const contentsBlock = blocks[3];

          let targetPath: string | null = null;

          // Execute write action if not empty
          if (writeBlock?.trim()) {
            const writeResult = await parseNeslResponse(writeBlock);
            if (writeResult.errors.length > 0) {
              throw new Error(`Failed to parse write NESL: ${writeResult.errors.map(e => e.message).join(', ')}`);
            }

            for (const action of writeResult.actions) {
              await executor.execute(action);
              // Track target path
              if (action.parameters?.path) {
                targetPath = action.parameters.path;
                const testDirMatch = action.parameters.path.match(/\/tmp\/t_[^\/]+/);
                if (testDirMatch) createdPaths.add(testDirMatch[0]);
              }
            }
          }

          // Execute replace action
          const replaceResult = await parseNeslResponse(replaceBlock);
          if (replaceResult.errors.length > 0) {
            throw new Error(`Failed to parse replace NESL: ${replaceResult.errors.map(e => e.message).join(', ')}`);
          }

          let testResult;
          for (const action of replaceResult.actions) {
            testResult = await executor.execute(action);
            // Track target path if not already set
            if (!targetPath && action.parameters?.path) {
              targetPath = action.parameters.path;
            }
            // Track paths for cleanup
            if (action.parameters?.path) {
              const testDirMatch = action.parameters.path.match(/\/tmp\/t_[^\/]+/);
              if (testDirMatch) createdPaths.add(testDirMatch[0]);
            }
          }

          // Verify result
          const expectedResult = JSON.parse(resultBlock);
          expect(testResult).toEqual(expectedResult);

          // Verify file contents if provided and operation succeeded
          if (contentsBlock && expectedResult.success && targetPath) {
            const actualContent = readFileSync(targetPath, 'utf8');
            expect(actualContent).toBe(contentsBlock);
          }
        }, 30000);
      }
    });
  });
});
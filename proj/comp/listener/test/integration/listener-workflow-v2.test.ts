import { describe, it, expect, beforeAll } from 'vitest';
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import clipboard from 'clipboardy';

import { startListener } from '../../src/listener.ts';
import type { ListenerHandle } from '../../src/types';
// // At the top of your test file
// import { test } from 'vitest';
// test.concurrent = false;

const __dirname = dirname(fileURLToPath(import.meta.url));

interface TestCase {
  name: string;
  initialContent: string;
  newContent: string;
  expectedPrepended: string;
  expectedOutput: string;
  expectedClipboard: string;
}

// Parse test cases from markdown
async function parseTestCases(): Promise<TestCase[]> {
  const testDataPath = join(__dirname, '../../test-data/integration/listener-workflow-v2.cases.md');
  const markdown = await readFile(testDataPath, 'utf-8');

  const tokens = marked.lexer(markdown);
  const testCases: TestCase[] = [];
  let currentTest: Partial<TestCase> | null = null;
  let codeBlockCount = 0;

  for (const token of tokens) {
    // Test case name (h3)
    if (token.type === 'heading' && token.depth === 3) {
      // Save previous test if complete
      if (currentTest && currentTest.name &&
        currentTest.initialContent &&
        currentTest.newContent &&
        currentTest.expectedPrepended &&
        currentTest.expectedOutput &&
        currentTest.expectedClipboard) {
        testCases.push(currentTest as TestCase);
      }

      // Start new test
      currentTest = { name: token.text };
      codeBlockCount = 0;
    }

    // Code blocks - just take them in order, ignoring h4 headers
    if (token.type === 'code' && currentTest) {
      const content = token.text;
      codeBlockCount++;

      switch (codeBlockCount) {
        case 1:
          currentTest.initialContent = content;
          break;
        case 2:
          currentTest.newContent = content;
          break;
        case 3:
          currentTest.expectedPrepended = content;
          break;
        case 4:
          currentTest.expectedOutput = content;
          break;
        case 5:
          currentTest.expectedClipboard = content;
          break;
      }
    }
  }

  // Don't forget the last test case
  if (currentTest && currentTest.name &&
    currentTest.initialContent &&
    currentTest.newContent &&
    currentTest.expectedPrepended &&
    currentTest.expectedOutput &&
    currentTest.expectedClipboard) {
    testCases.push(currentTest as TestCase);
  }

  return testCases;
}

// Helper to extract test directory name from test case
function getTestDir(testCaseName: string): string {
  const safeName = testCaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `/tmp/t_listener_${safeName}`;
}

// Helper to poll for file content change
async function pollForFileChange(
  filePath: string,
  initialContent: string,
  timeoutMs: number = 1000
): Promise<string> {
  const startTime = Date.now();
  let lastContent = initialContent;

  while (Date.now() - startTime < timeoutMs) {
    try {
      const content = await readFile(filePath, 'utf-8');
      if (content !== lastContent && content.includes('=== SLUPE RESULTS ===')) {
        return content;
      }
      lastContent = content;
    } catch { }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timeout waiting for file change after ${timeoutMs}ms`);
}

// Load test cases at module level
const testCasesPromise = parseTestCases();


export async function listenerWorkflowTests() {
  // Load test cases before defining tests
  const testCases = await testCasesPromise;

  // Use it.each to create separate test for each test case
  it.each(testCases)('$name', async (testCase) => {
    let handle: ListenerHandle | null = null;
    const testDir = getTestDir(testCase.name);
    const testFile = join(testDir, 'test.txt');
    const outputFile = join(testDir, '.slupe-output-latest.txt');

    try {
      // Setup
      await mkdir(testDir, { recursive: true });
      await writeFile(testFile, testCase.initialContent);

      // Start listener
      handle = await startListener({
        filePath: testFile,
        debounceMs: 100,
        useClipboard: true
      });

      // Wait for initial processing
      await pollForFileChange(testFile, testCase.initialContent);

      // Wait for debounce to settle
      await new Promise(resolve => setTimeout(resolve, 200));

      // Write new content
      await writeFile(testFile, testCase.newContent);

      // Wait for processing to complete
      await pollForFileChange(testFile, testCase.newContent);

      // Wait a bit more for clipboard and output file writes
      await new Promise(resolve => setTimeout(resolve, 200));

      // Read actual results
      const actualPrepended = await readFile(testFile, 'utf-8');
      const actualOutput = await readFile(outputFile, 'utf-8');
      const actualClipboard = await clipboard.read();

      // Compare results (exact match)
      expect(actualPrepended).toBe(testCase.expectedPrepended);
      expect(actualOutput).toBe(testCase.expectedOutput);
      expect(actualClipboard).toBe(testCase.expectedClipboard);

    } finally {
      // Cleanup
      if (handle) {
        await handle.stop();
      }
      await rm(testDir, { recursive: true, force: true });
    }
  });
}



// Only run directly if this file is executed, not imported
if (import.meta.url === `file://${process.argv[1]}`) {
  describe('listener workflow v2', async () => {
    await listenerWorkflowTests();
  });
}
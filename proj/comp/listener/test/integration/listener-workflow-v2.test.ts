import { describe, it, expect, beforeAll } from 'vitest';
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import { DEFAULT_SLUPE_YAML } from '../../../config/src/index.js';


import { startListener } from '../../src/listener.js';
import type { ListenerHandle } from '../../src/types.js';
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
        currentTest.expectedOutput) {
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
      }
    }
  }

  // Don't forget the last test case
  if (currentTest && currentTest.name &&
    currentTest.initialContent &&
    currentTest.newContent &&
    currentTest.expectedPrepended &&
    currentTest.expectedOutput) {
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

// Load test cases synchronously for parallel execution
import { readFileSync } from 'fs';
const testDataPath = join(__dirname, '../../test-data/integration/listener-workflow-v2.cases.md');
const markdown = readFileSync(testDataPath, 'utf-8');
const testCases = parseTestCasesSync(markdown);

function parseTestCasesSync(markdown: string): TestCase[] {
  const tokens = marked.lexer(markdown);
  const testCases: TestCase[] = [];
  let currentTest: Partial<TestCase> | null = null;
  let codeBlockCount = 0;

  for (const token of tokens) {
    if (token.type === 'heading' && token.depth === 3) {
      if (currentTest && currentTest.name &&
        currentTest.initialContent &&
        currentTest.newContent &&
        currentTest.expectedPrepended &&
        currentTest.expectedOutput) {
        testCases.push(currentTest as TestCase);
      }
      currentTest = { name: token.text };
      codeBlockCount = 0;
    }

    if (token.type === 'code' && currentTest) {
      const content = token.text;
      codeBlockCount++;
      switch (codeBlockCount) {
        case 1: currentTest.initialContent = content; break;
        case 2: currentTest.newContent = content; break;
        case 3: currentTest.expectedPrepended = content; break;
        case 4: currentTest.expectedOutput = content; break;
      }
    }
  }

  if (currentTest && currentTest.name &&
    currentTest.initialContent &&
    currentTest.newContent &&
    currentTest.expectedPrepended &&
    currentTest.expectedOutput) {
    testCases.push(currentTest as TestCase);
  }

  return testCases;
}

describe('listener workflow v2', () => {

  // Use it.each to create separate test for each test case
  it.concurrent.each(testCases)('$name', async (testCase) => {
    let handle: ListenerHandle | null = null;
    const testDir = getTestDir(testCase.name);
    const testFile = join(testDir, 'test.txt');
    const outputFile = join(testDir, '.slupe-output-latest.txt');

    try {
      // Setup
      await mkdir(testDir, { recursive: true });
      // Write config without hooks for test isolation
      const testConfig = DEFAULT_SLUPE_YAML;
      
      // .replace(
      //   /# Git hooks configuration[\s\S]*?\n# Variables/,
      //   '# Git hooks configuration\nhooks:\n  # No hooks for testing\n\n# Variables'
      // );
      await writeFile(join(testDir, 'slupe.yml'), testConfig);
      await writeFile(testFile, testCase.initialContent);

      // Start listener
      handle = await startListener({
        filePath: testFile,
        debounceMs: 100,
        useClipboard: false
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

      // Compare results - prepended content should be at the start of the file
      expect(actualPrepended.startsWith(testCase.expectedPrepended)).toBe(true);
      
      // The prepended file should contain both the SLUPE results and the original content
      // Let's check that the original content exists somewhere in the file after the results
      const resultsEndMarker = '=== END ===';
      const resultsEndIndex = actualPrepended.indexOf(resultsEndMarker);
      
      if (resultsEndIndex !== -1) {
        // Find where the results section ends (including the marker and newline)
        const afterResultsIndex = resultsEndIndex + resultsEndMarker.length;
        const contentAfterResults = actualPrepended.slice(afterResultsIndex).trim();
        
        // The content after results should match the new content
        expect(contentAfterResults).toBe(testCase.newContent.trim());
      } else {
        // If no results marker found, fail the test with helpful message
        throw new Error('Could not find "=== END ===" marker in prepended file');
      }
      
      // Output file should still be an exact match
      expect(actualOutput).toBe(testCase.expectedOutput);

    } finally {
      // Cleanup
      if (handle) {
        await handle.stop();
      }
      await rm(testDir, { recursive: true, force: true });
    }
  }, 10000); // Increase timeout for integration tests
});
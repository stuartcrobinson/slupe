import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, rm, mkdir, writeFile } from 'fs/promises';
import { marked } from 'marked';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import clipboard from 'clipboardy';
import { startListener } from '../../src/listener.js';
import type { ListenerHandle } from '../../src/types.js';
import { tmpdir } from 'os';
import { mkdtempSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface ClipboardEntry {
  content: string;
  delay?: number;
}

interface TestCase {
  name: string;
  inputs: ClipboardEntry[];
  expectedOutput: string | null;
}

async function parseTestCases(): Promise<TestCase[]> {
  const mdPath = join(__dirname, '../../test-data/unit/clipboard.cases.md');
  const content = await readFile(mdPath, 'utf-8');
  
  const tokens = marked.lexer(content);
  const cases: TestCase[] = [];
  let currentCase: Partial<TestCase> | null = null;
  let currentSection: string | null = null;
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    if (token.type === 'heading' && token.depth === 2) {
      if (currentCase?.name) {
        cases.push(currentCase as TestCase);
      }
      currentCase = { 
        name: token.text,
        inputs: [],
        expectedOutput: null
      };
    } else if (token.type === 'heading' && token.depth === 3) {
      currentSection = token.text.toLowerCase();
    } else if (currentCase && currentSection === 'inputs') {
      if (token.type === 'code') {
        currentCase.inputs = currentCase.inputs || [];
        currentCase.inputs.push({ content: token.text });
      } else if (token.type === 'paragraph') {
        const match = token.text.match(/^(\d+)$/);
        if (match && currentCase.inputs.length > 0) {
          const lastInput = currentCase.inputs[currentCase.inputs.length - 1];
          lastInput.delay = parseInt(match[1], 10);
        }
      }
    } else if (currentCase && currentSection === 'output contains') {
      if (token.type === 'code') {
        currentCase.expectedOutput = token.text.trim() === 'null' ? null : token.text.trim();
      }
    }
  }
  
  if (currentCase?.name) {
    cases.push(currentCase as TestCase);
  }
  
  return cases;
}

describe('clipboard integration', async () => {
  const cases = await parseTestCases();
  let handle: ListenerHandle | null = null;
  let testRepoPath: string;
  
  beforeEach(async () => {
    testRepoPath = mkdtempSync(join(tmpdir(), 'slupe-clipboard-test-'));
  });
  
  afterEach(async () => {
    if (handle) {
      await handle.stop();
      handle = null;
    }
    
    await rm(testRepoPath, { recursive: true, force: true }).catch(() => {});
  });
  
  for (const testCase of cases) {
    it(testCase.name, async () => {
      const testDir = `/tmp/t_${testCase.name}`;
      const inputFile = join(testRepoPath, 'input.md');
      const outputFile = join(testRepoPath, '.slupe-output-latest.txt');
      
      try {
        await mkdir(testDir, { recursive: true });
        await writeFile(inputFile, '');
        
        handle = await startListener({
          filePath: inputFile,
          useClipboard: true,
          debounceMs: 100
        });
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Write unique content to ensure clipboard monitor detects changes
        const initContent = `init-${testCase.name}-${Date.now()}`;
        console.log(`\n[TEST ${testCase.name}] Writing init content:`, initContent);
        await clipboard.write(initContent);
        await new Promise(resolve => setTimeout(resolve, 30));
        
        for (let idx = 0; idx < testCase.inputs.length; idx++) {
          const input = testCase.inputs[idx];
          console.log(`[TEST ${testCase.name}] Writing input ${idx + 1}/${testCase.inputs.length}:`);
          console.log(`  Length: ${input.content.length}`);
          console.log(`  Preview: ${input.content.substring(0, 60).replace(/\n/g, '\\n')}...`);
          console.log(`  Has #!end_: ${input.content.includes('#!end_') ? 'YES' : 'NO'}`);
          
          await clipboard.write(input.content);
          
          // Verify the write
          const written = await clipboard.read();
          console.log(`  Verified write - length: ${written.length}, matches: ${written === input.content}`);
          
          if (input.delay) {
            console.log(`  Waiting ${input.delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, input.delay));
          } else {
            console.log(`  No delay specified, waiting 50ms default...`);
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        
        console.log(`[TEST ${testCase.name}] Waiting 100ms for processing...`);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (testCase.expectedOutput) {
          console.log(`[TEST ${testCase.name}] Expecting output to contain:`, testCase.expectedOutput);
          const startTime = Date.now();
          let found = false;
          let lastOutputContent = '';
          
          while (Date.now() - startTime < 1000) {
            try {
              const outputContent = await readFile(outputFile, 'utf-8');
              lastOutputContent = outputContent;
              if (outputContent.includes(testCase.expectedOutput)) {
                found = true;
                console.log(`[TEST ${testCase.name}] Found expected output!`);
                break;
              }
            } catch (e) {
              // Output file might not exist yet
              console.log(`[TEST ${testCase.name}] Output file not found yet...`);
            }
            await new Promise(resolve => setTimeout(resolve, 25));
          }
          
          if (!found) {
            console.log(`[TEST ${testCase.name}] FAILED - Expected output not found`);
            console.log(`  Last output content:`, lastOutputContent);
            
            // Also check what's in the input file
            try {
              const inputContent = await readFile(inputFile, 'utf-8');
              console.log(`  Input file content:`, inputContent.substring(0, 200));
            } catch (e) {
              console.log(`  Could not read input file:`, e);
            }
          }
          
          expect(found).toBe(true);
        } else {
          // Verify no NESL execution occurred
          await new Promise(resolve => setTimeout(resolve, 200));
          let outputExists = false;
          try {
            const outputContent = await readFile(outputFile, 'utf-8');
            outputExists = outputContent.includes('=== SLUPE RESULTS ===');
          } catch {
            // No output file is fine for null case
          }
          expect(outputExists).toBe(false);
        }
      } finally {
        await rm(testDir, { recursive: true, force: true }).catch(() => {});
      }
    });
  }
});
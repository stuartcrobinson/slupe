import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
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
  let sharedRepoPath: string;
  let sharedSlupeInstance: any;
  
  beforeAll(async () => {
    // Create shared temp directory and Slupe instance once
    sharedRepoPath = mkdtempSync(join(tmpdir(), 'slupe-clipboard-shared-'));
    
    // Create shared Slupe instance
    const { Slupe } = await import('../../../orch/src/index.js');
    sharedSlupeInstance = await Slupe.create({ 
      gitCommit: false,
      repoPath: sharedRepoPath 
    });
  });
  
  afterAll(async () => {
    // Clean up shared resources
    await rm(sharedRepoPath, { recursive: true, force: true }).catch(() => {});
  });
  
  afterEach(async () => {
    if (handle) {
      await handle.stop();
      handle = null;
    }
  });
  
  for (const testCase of cases) {
    it(testCase.name, async () => {
      console.log(`[TEST ${testCase.name}] Test case:`, {
        name: testCase.name,
        inputsCount: testCase.inputs.length,
        expectedOutput: testCase.expectedOutput
      });
      
      const testDir = `/tmp/t_${testCase.name}`;
      const inputFile = join(sharedRepoPath, `${testCase.name}.md`);
      const outputFile = join(sharedRepoPath, `.slupe-output-${testCase.name}.txt`);
      
      // Write unique content BEFORE starting monitor
      const uniqueContent = `unique-${testCase.name}-${Date.now()}`;
      console.log(`[TEST ${testCase.name}] Writing unique content before monitor start:`, uniqueContent);
      await clipboard.write(uniqueContent);
      
      // Poll to ensure clipboard write completed
      let writeVerified = false;
      for (let i = 0; i < 50; i++) { // max 500ms
        const current = await clipboard.read();
        if (current === uniqueContent) {
          writeVerified = true;
          console.log(`[TEST ${testCase.name}] Clipboard write verified after ${i * 10}ms`);
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      if (!writeVerified) {
        throw new Error(`Failed to verify clipboard write of unique content`);
      }
      
      try {
        await mkdir(testDir, { recursive: true });
        await writeFile(inputFile, '');
        
        handle = await startListener({
          filePath: inputFile,
          useClipboard: true,
          debounceMs: 15,
          outputFilename: `.slupe-output-${testCase.name}.txt`,
          slupeInstance: sharedSlupeInstance
        });
        
        console.log(`[TEST ${testCase.name}] Starting to write ${testCase.inputs.length} test inputs`);
        
        for (let idx = 0; idx < testCase.inputs.length; idx++) {
          const input = testCase.inputs[idx];
          console.log(`[TEST ${testCase.name}] Writing input ${idx + 1}/${testCase.inputs.length}:`);
          console.log(`  Length: ${input.content.length}`);
          console.log(`  Preview: ${input.content.substring(0, 60).replace(/\n/g, '\\n')}...`);
          console.log(`  Has #!end_: ${input.content.includes('#!end_') ? 'YES' : 'NO'}`);
          
          await clipboard.write(input.content);
          
          // Poll to verify the write
          let writeVerified = false;
          for (let i = 0; i < 50; i++) { // max 500ms
            const written = await clipboard.read();
            if (written === input.content) {
              writeVerified = true;
              console.log(`  Verified write after ${i * 10}ms - length: ${written.length}`);
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          if (!writeVerified) {
            throw new Error(`Failed to verify clipboard write for input ${idx + 1}`);
          }
          
          if (input.delay) {
            console.log(`  Waiting ${input.delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, input.delay));
          } else {
            console.log(`  No delay specified, waiting 50ms default...`);
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        
        // console.log(`[TEST ${testCase.name}] Waiting 100ms for processing...`);
        // await new Promise(resolve => setTimeout(resolve, 100));
        
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
        // Rewrite unique content before stopping monitor
        if (handle) {
          console.log(`[TEST ${testCase.name}] Rewriting unique content before cleanup:`, uniqueContent);
          await clipboard.write(uniqueContent);
          
          // Poll to verify cleanup write
          let cleanupVerified = false;
          for (let i = 0; i < 50; i++) { // max 500ms
            const current = await clipboard.read();
            if (current === uniqueContent) {
              cleanupVerified = true;
              console.log(`[TEST ${testCase.name}] Cleanup write verified after ${i * 10}ms`);
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          if (!cleanupVerified) {
            console.log(`[TEST ${testCase.name}] Warning: Failed to verify cleanup clipboard write`);
          }
          await handle.stop();
          handle = null;
        }
        
        await rm(testDir, { recursive: true, force: true }).catch(() => {});
      }
    });
  }

  it('should add clipboard timestamp to input file after copying', async () => {
    const inputFile = join(sharedRepoPath, 'clipboard-timestamp-test.md');
    const uniqueContent = `unique-clipboard-timestamp-test-${Date.now()}`;
    
    await clipboard.write(uniqueContent);
    await writeFile(inputFile, '');
    
    handle = await startListener({
      filePath: inputFile,
      useClipboard: true,
      debounceMs: 15,
      outputFilename: '.slupe-output-clipboard-timestamp-test.txt',
      slupeInstance: sharedSlupeInstance
    });
    
    // Copy NESL command parts to trigger execution
    await clipboard.write(`#!nesl [@three-char-SHA-256: tst]
action = "file_write"
path = "${sharedRepoPath}/test.txt"
content = <<'EOT_tst'
test content
EOT_tst
#!end_tst`);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    await clipboard.write(`extra content
#!end_tst`);
    
    // Poll for up to 1 second to see the clipboard timestamp appear
    const startTime = Date.now();
    let found = false;
    
    while (Date.now() - startTime < 1000) {
      try {
        const content = await readFile(inputFile, 'utf-8');
        if (content.includes('📋 Output copied to clipboard @')) {
          found = true;
          // Verify the structure
          expect(content).toContain('=== SLUPE RESULTS ===');
          expect(content).toContain('📋 Output copied to clipboard @');
          expect(content).toContain('---------------------');
          expect(content).toContain('✅ file_write');
          break;
        }
      } catch (e) {
        // File might not be ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    
    expect(found).toBe(true);
  });
});
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

const debug = false;

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

// Global diagnostic state
let globalClipboardLog: string[] = [];

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
      globalClipboardLog = [];
      const logClipboard = (msg: string) => {
        const timestamp = Date.now();
        const entry = `[${timestamp}] ${msg}`;
        globalClipboardLog.push(entry);
        debug&&console.log(`[TEST ${testCase.name}] ${entry}`);
      };

      logClipboard(`=== START TEST CASE: ${testCase.name} ===`);
      logClipboard(`Test case config: inputs=${testCase.inputs.length}, expectedOutput=${testCase.expectedOutput}`);
      
      const testDir = `/tmp/t_${testCase.name}`;
      const inputFile = join(sharedRepoPath, `${testCase.name}.md`);
      const outputFile = join(sharedRepoPath, `.slupe-output-${testCase.name}.txt`);
      
      // Write unique content BEFORE starting monitor
      const uniqueContent = `unique-${testCase.name}-${Date.now()}`;
      logClipboard(`PRE-MONITOR: Writing unique content: "${uniqueContent}"`);
      const writeStartTime = Date.now();
      await clipboard.write(uniqueContent);
      logClipboard(`PRE-MONITOR: clipboard.write() returned after ${Date.now() - writeStartTime}ms`);
      
      // Poll to ensure clipboard write completed
      let writeVerified = false;
      for (let i = 0; i < 20; i++) { // max 100ms
        const pollStart = Date.now();
        const current = await clipboard.read();
        const pollDuration = Date.now() - pollStart;
        if (current === uniqueContent) {
          writeVerified = true;
          logClipboard(`PRE-MONITOR: Write verified after ${i} polls (${i * 5}ms), read took ${pollDuration}ms`);
          break;
        }
        logClipboard(`PRE-MONITOR: Poll ${i}: got "${current.substring(0, 30)}..." (len=${current.length}), read took ${pollDuration}ms`);
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      if (!writeVerified) {
        logClipboard(`PRE-MONITOR: FAILED to verify unique content write!`);
        throw new Error(`Failed to verify clipboard write of unique content`);
      }
      
      try {
        await mkdir(testDir, { recursive: true });
        await writeFile(inputFile, '');
        
        logClipboard(`MONITOR: Starting listener with clipboard monitoring`);
        handle = await startListener({
          filePath: inputFile,
          useClipboardRead: true,
          debounceMs: 15,
          outputFilename: `.slupe-output-${testCase.name}.txt`,
          slupeInstance: sharedSlupeInstance
        });
        
        logClipboard(`INPUTS: Starting to write ${testCase.inputs.length} test inputs`);
        
        for (let idx = 0; idx < testCase.inputs.length; idx++) {
          const input = testCase.inputs[idx];
          logClipboard(`INPUT ${idx + 1}/${testCase.inputs.length}: Preparing to write`);
          logClipboard(`  Content length: ${input.content.length}`);
          logClipboard(`  Content preview: "${input.content.substring(0, 60).replace(/\n/g, '\\n')}"...`);
          logClipboard(`  Contains #!end_: ${input.content.includes('#!end_') ? 'YES' : 'NO'}`);
          
          // Read clipboard before write to see current state
          const beforeWriteStart = Date.now();
          const beforeWrite = await clipboard.read();
          logClipboard(`  Before write: clipboard has "${beforeWrite.substring(0, 30)}..." (len=${beforeWrite.length}), read took ${Date.now() - beforeWriteStart}ms`);
          
          const writeStart = Date.now();
          await clipboard.write(input.content);
          const writeDuration = Date.now() - writeStart;
          logClipboard(`  clipboard.write() returned after ${writeDuration}ms`);
          
          // Poll to verify the write
          let writeVerified = false;
          let verificationAttempts = 0;
          for (let i = 0; i < 40; i++) { // increased from 20 to 40
            verificationAttempts++;
            const verifyStart = Date.now();
            const written = await clipboard.read();
            const verifyDuration = Date.now() - verifyStart;
            
            if (written === input.content) {
              writeVerified = true;
              logClipboard(`  ✓ Write verified after ${i} polls (${i * 5}ms total), read took ${verifyDuration}ms`);
              break;
            } else {
              logClipboard(`  ✗ Poll ${i}: Expected len=${input.content.length}, got len=${written.length}, read took ${verifyDuration}ms`);
              if (written.length < 100) {
                logClipboard(`    Got: "${written}"`);
              } else {
                logClipboard(`    Got preview: "${written.substring(0, 60)}..."`);
              }
            }
            await new Promise(resolve => setTimeout(resolve, 5));
          }
          
          if (!writeVerified) {
            logClipboard(`  ❌ FAILED to verify write after ${verificationAttempts} attempts!`);
            logClipboard(`  Expected: "${input.content.substring(0, 100)}..." (len=${input.content.length})`);
            
            // Do one final read to see what's there
            const finalCheck = await clipboard.read();
            logClipboard(`  Final clipboard state: "${finalCheck.substring(0, 100)}..." (len=${finalCheck.length})`);
            
            // Print the full diagnostic log before throwing
            debug&&console.log('\n=== FULL DIAGNOSTIC LOG ===');
            globalClipboardLog.forEach(line => debug&&console.log(line));
            debug&&console.log('=== END DIAGNOSTIC LOG ===\n');
            
            throw new Error(`Failed to verify clipboard write for input ${idx + 1}`);
          }
          
          if (input.delay) {
            logClipboard(`  Waiting ${input.delay}ms as specified...`);
            await new Promise(resolve => setTimeout(resolve, input.delay));
          } else {
            logClipboard(`  No delay specified, waiting 5ms default...`);
            await new Promise(resolve => setTimeout(resolve, 5));
          }
        }
        
        if (testCase.expectedOutput) {
          logClipboard(`VERIFICATION: Expecting output to contain: "${testCase.expectedOutput}"`);
          const startTime = Date.now();
          let found = false;
          let lastOutputContent = '';
          
          while (Date.now() - startTime < 1000) {
            try {
              const outputContent = await readFile(outputFile, 'utf-8');
              lastOutputContent = outputContent;
              if (outputContent.includes(testCase.expectedOutput)) {
                found = true;
                logClipboard(`VERIFICATION: ✓ Found expected output after ${Date.now() - startTime}ms`);
                break;
              }
            } catch (e) {
              // Output file might not exist yet
            }
            await new Promise(resolve => setTimeout(resolve, 25));
          }
          
          if (!found) {
            logClipboard(`VERIFICATION: ❌ Expected output not found after ${Date.now() - startTime}ms`);
            logClipboard(`  Last output content: "${lastOutputContent.substring(0, 200)}..."`);
            
            // Also check what's in the input file
            try {
              const inputContent = await readFile(inputFile, 'utf-8');
              logClipboard(`  Input file content: "${inputContent.substring(0, 200)}..."`);
            } catch (e) {
              logClipboard(`  Could not read input file: ${e}`);
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
          logClipboard(`CLEANUP: Rewriting unique content before stopping monitor`);
          await clipboard.write(uniqueContent);
          
          // Poll to verify cleanup write
          let cleanupVerified = false;
          for (let i = 0; i < 10; i++) { // max 50ms
            const current = await clipboard.read();
            if (current === uniqueContent) {
              cleanupVerified = true;
              logClipboard(`CLEANUP: Write verified after ${i * 5}ms`);
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 5));
          }
          if (!cleanupVerified) {
            logClipboard(`CLEANUP: Warning - failed to verify cleanup write`);
          }
          await handle.stop();
          handle = null;
        }
        
        await rm(testDir, { recursive: true, force: true }).catch(() => {});
        logClipboard(`=== END TEST CASE: ${testCase.name} ===`);
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
      useClipboardRead: true,
      useClipboardWrite: true,
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
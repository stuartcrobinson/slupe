import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { marked } from 'marked';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import clipboard from 'clipboardy';
import { startListener } from '../../src/listener.js';
import type { ListenerHandle } from '../../src/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface TestCase {
  name: string;
  first: string;
  second: string;
  delay: number;
  expected: string | null;
}

async function parseTestCases(): Promise<TestCase[]> {
  const mdPath = join(__dirname, '../../test-data/unit/clipboard.cases.md');
  const content = await readFile(mdPath, 'utf-8');
  
  const tokens = marked.lexer(content);
  const cases: TestCase[] = [];
  let currentCase: Partial<TestCase> = {};
  let currentSection: string | null = null;
  
  for (const token of tokens) {
    if (token.type === 'heading' && token.depth === 2) {
      if (currentCase.name) {
        cases.push(currentCase as TestCase);
      }
      currentCase = { name: token.text };
    } else if (token.type === 'heading' && token.depth === 3) {
      currentSection = token.text;
    } else if (token.type === 'code' && currentSection) {
      const value = token.text.trim();
      if (currentSection === 'delay') {
        currentCase.delay = parseInt(value, 10);
      } else if (currentSection === 'expected') {
        currentCase.expected = value === 'null' ? null : value;
      } else if (currentSection === 'first') {
        currentCase.first = value;
      } else if (currentSection === 'second') {
        currentCase.second = value;
      }
    }
  }
  
  if (currentCase.name) {
    cases.push(currentCase as TestCase);
  }
  
  return cases;
}

describe('clipboard integration', async () => {
  const cases = await parseTestCases();
  let handle: ListenerHandle | null = null;
  let initialClipboard: string;
  
  beforeEach(async () => {
    initialClipboard = await clipboard.read();
  });
  
  afterEach(async () => {
    if (handle) {
      await handle.stop();
      handle = null;
    }
    await clipboard.write(initialClipboard);
    
    // Force cleanup of any remaining intervals
    const listenerModule = await import('../../src/listener.js') as any;
    if (listenerModule.clipboardMonitorInterval) {
      clearInterval(listenerModule.clipboardMonitorInterval);
      listenerModule.clipboardMonitorInterval = null;
    }
    listenerModule.lastClipboard = null;
  });
  
  for (const testCase of cases) {
    it(testCase.name, async () => {
      const testDir = `/tmp/t_${testCase.name}`;
      const inputFile = join(testDir, 'input.md');
      
      try {
        await mkdir(testDir, { recursive: true });
        await writeFile(inputFile, '');
        
        // Clear clipboard to known state before test
        await clipboard.write('helicopter');
        
        handle = await startListener({
          filePath: inputFile,
          useClipboard: true,
          debounceMs: 300
        });
        
        // Wait for monitor to initialize
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Execute clipboard sequence
        console.log('[TEST] Test case:', testCase.name, 'delay:', testCase.delay);
        console.log('[TEST] Writing first clipboard:', testCase.first.substring(0, 100));
        await clipboard.write(testCase.first);
        console.log('[TEST] Waiting', testCase.delay || 0, 'ms');
        await new Promise(resolve => setTimeout(resolve, testCase.delay || 0));
        console.log('[TEST] Writing second clipboard:', testCase.second.substring(0, 100));
        await clipboard.write(testCase.second);
        console.log('[TEST] Clipboard sequence complete');
        
        // Give monitor time to catch up
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (testCase.expected) {
          // Poll for expected output in clipboard
          const startTime = Date.now();
          let found = false;
          
          while (Date.now() - startTime < 1000) {
            const clipContent = await clipboard.read();
            const preview = clipContent.length > 100 ? clipContent.substring(0, 100) + '...' : clipContent;
            console.log('[TEST] Polling clipboard, length:', clipContent.length, 'contains expected:', clipContent.includes(testCase.expected));
            console.log('[TEST] Clipboard content:', preview.replace(/\n/g, '\\n'));
            if (clipContent.includes(testCase.expected)) {
              found = true;
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 25));
          }
          console.log('[TEST] Polling complete, found:', found);
          
          expect(found).toBe(true);
        } else {
          // Verify no processing occurred
          await new Promise(resolve => setTimeout(resolve, 800));
          const fileContent = await readFile(inputFile, 'utf-8');
          expect(fileContent.includes('=== SLUPE RESULTS ===')).toBe(false);
        }
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });
  }
  
  it('does not use clipboard when useClipboard is false', async () => {
    const testDir = '/tmp/t_clipboard_disabled';
    const inputFile = join(testDir, 'input.md');
    
    try {
      await mkdir(testDir, { recursive: true });
      const neslContent = '```sh nesl\n#!nesl [@x: no]\naction = "file_write"\npath = "/tmp/t_clipboard_disabled/test.txt"\ncontent = "test"\n#!end_no\n```';
      await writeFile(inputFile, neslContent);
      
      const beforeClip = await clipboard.read();
      
      handle = await startListener({
        filePath: inputFile,
        useClipboard: false
      });
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const afterClip = await clipboard.read();
      expect(afterClip).toBe(beforeClip);
      
      const fileContent = await readFile(inputFile, 'utf-8');
      expect(fileContent.includes('📋 Copied to clipboard')).toBe(false);
    } finally {
      await rm(testDir, { recursive: true, force: true });
    }
  });
});
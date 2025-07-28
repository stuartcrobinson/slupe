import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, rmSync } from 'fs';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { marked } from 'marked';
import { load as loadYaml } from 'js-yaml';
import { startListener } from '../../comp/listener/src/index.js';

const casesPath = join(__dirname, '../../test-cases/integration/entry.cases.md');
const testDir = '/tmp/slupe-entry-tests';

describe('entry integration', () => {
  const tokens = marked.lexer(readFileSync(casesPath, 'utf8'));
  
  beforeEach(() => mkdir(testDir, { recursive: true }));
  afterEach(() => rmSync(testDir, { recursive: true, force: true }));
  
  let group = '';
  let test = '';
  let blocks: string[] = [];
  
  tokens.forEach(t => {
    if (t.type === 'heading' && t.depth === 2) group = t.text;
    else if (t.type === 'heading' && t.depth === 3) {
      if (test && blocks.length === 3) runTest(group, test, blocks);
      test = t.text;
      blocks = [];
    }
    else if (t.type === 'code') blocks.push(t.text);
  });
  if (test && blocks.length === 3) runTest(group, test, blocks);
  
  function runTest(groupName: string, testName: string, [config, input, expected]: string[]) {
    describe(groupName, () => {
      it(testName, async () => {
        const cfg = config.trim() ? loadYaml(config) || {} : {};
        const inputPath = join(testDir, 'input.md');
        const outputPath = join(testDir, '.output.md');
        
        // Always write a slupe.yml for consistent behavior
        const fullConfig = `version: 1
allowed-actions: [file_write, file_read, exec]
${config}`;
        await writeFile(join(testDir, 'slupe.yml'), fullConfig);
        
        // Write input
        await writeFile(inputPath, input);
        
        // Change to test dir so slupe.yml is found
        const originalCwd = process.cwd();
        process.chdir(testDir);
        
        try {
          // Run listener
          const handle = await startListener({
            filePath: inputPath,
            debounceMs: 100,
            outputFilename: '.output.md'
          });
          
          // Wait and check
          await new Promise(r => setTimeout(r, 300));
          await handle.stop();
          
          const actual = readFileSync(outputPath, 'utf8');
          expect(actual.trim()).toBe(expected.trim());
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  }
});
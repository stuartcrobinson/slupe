import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { marked, Token } from 'marked';
import { Slupe } from '../src/index';
import { clearActionSchemaCache } from '../../nesl-action-parser/src/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testPath = join(__dirname, '../test-data/execute/basic-operations.md');
const mdContent = readFileSync(testPath, 'utf8');

const tokens = marked.lexer(mdContent);
const codeBlocks = tokens.filter(t => t.type === 'code') as Array<Token & { type: 'code', text: string, lang?: string }>;
const testNames = tokens
  .filter(t => t.type === 'heading' && 'depth' in t && t.depth === 3)
  .map(t => (t as any).text as string);

const testFiles = [
  '/tmp/test.txt',
  '/tmp/first.txt',
  '/tmp/second.txt',
  '/tmp/bad.txt',
  '/tmp/duplicate.txt',
  '/tmp/good.txt',
  '/tmp/does-not-exist.txt',
  '/tmp/read-test.txt',
  '/tmp/source-file.txt',
  '/tmp/destination-file.txt',
  '/tmp/replace-single.txt',
  '/tmp/replace-all.txt',
  '/tmp/multiline.txt',
  '/tmp/multiple-foo.txt',
  '/tmp/count-test.txt',
  '/tmp/move-source.txt',
  '/tmp/move-dest.txt',
  '/tmp/empty-replace.txt',
  '/tmp/parent-test.txt'
];

const testDirs = [
  '/tmp/new',
  '/tmp/007-file-move-success',
  '/tmp/016-file-move-creates-parent-dirs',
  '/tmp/017-files-read-multiple',
  '/tmp/018-files-read-with-missing'
];

describe('Slupe.execute()', () => {
  let slupe: Slupe;

  beforeEach(async () => {
    // Clear the action schema cache to pick up latest definitions
    clearActionSchemaCache();
    slupe = await Slupe.create();
    // Clean up files
    for (const path of testFiles) {
      try {
        if (existsSync(path)) rmSync(path);
      } catch (err) {
        // Continue cleanup even if one fails
      }
    }
    // Clean up directories
    for (const path of testDirs) {
      try {
        if (existsSync(path)) rmSync(path, { recursive: true, force: true });
      } catch (err) {
        // Continue cleanup even if one fails
      }
    }
  });

  afterEach(() => {
    // Clean up files
    for (const path of testFiles) {
      try {
        if (existsSync(path)) rmSync(path);
      } catch (err) {
        // Continue cleanup even if one fails
      }
    }
    // Clean up directories
    for (const path of testDirs) {
      try {
        if (existsSync(path)) rmSync(path, { recursive: true, force: true });
      } catch (err) {
        // Continue cleanup even if one fails
      }
    }
  });

  testNames.forEach((name, i) => {
    const baseIndex = i * 2;
    it(name, async () => {
      const input = codeBlocks[baseIndex].text;
      const expected = JSON.parse(codeBlocks[baseIndex + 1].text);
      const result = await slupe.execute(input);

      // Remove debug field for comparison since test data doesn't include it
      const { debug, ...resultWithoutDebug } = result;
      expect(resultWithoutDebug).toEqual(expected);
    });
  });
});
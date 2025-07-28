import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { marked, Token } from 'marked';
import { parseNeslResponse } from '../src/index';

const testPath = join(__dirname, '../test-data/parseNeslResponse.md');
const mdContent = readFileSync(testPath, 'utf8');

const tokens: Token[] = marked.lexer(mdContent);
const codeBlocks = tokens.filter(t => t.type === 'code') as Array<Token & { type: 'code', text: string }>;
const testNames = tokens
  .filter(t => t.type === 'heading' && 'depth' in t && t.depth === 3)
  .map(t => (t as any).text as string);

describe('parseNeslResponse', () => {
  testNames.forEach((name, i) => {
    const baseIndex = i * 2;
    it(name, async () => {
      const input = codeBlocks[baseIndex].text;
      const expected = JSON.parse(codeBlocks[baseIndex + 1].text);
      const result = await parseNeslResponse(input);

      // Remove debug field for comparison since test data doesn't include it
      const { debug, ...resultWithoutDebug } = result;
      expect(resultWithoutDebug).toEqual(expected);
    });
  });
});
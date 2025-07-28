import { describe, it, expect } from 'vitest';
import { filterByAllowedTools } from '../../src/parser.js';
import { readFileSync } from 'fs';
import { join } from 'path';

const testData = JSON.parse(
  readFileSync(join(import.meta.dirname, '../../test-data/unit/filterByAllowedTools.json'), 'utf8')
);

describe('filterByAllowedTools', () => {
  testData.cases.forEach((testCase) => {
    it(testCase.name, () => {
      const result = filterByAllowedTools(
        testCase.input.markdown,
        testCase.input.allowedTools
      );
      expect(result).toBe(testCase.expected);
    });
  });
});
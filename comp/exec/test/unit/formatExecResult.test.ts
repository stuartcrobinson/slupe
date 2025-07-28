import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { formatExecResult } from '../../src/formatExecResult';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testData = JSON.parse(
  readFileSync(join(__dirname, '../../test-data/unit/formatExecResult.json'), 'utf8')
);

describe('formatExecResult', () => {
  testData.cases.forEach((testCase: any) => {
    it(testCase.name, () => {
      // Convert Error placeholder to actual Error object
      const input = [...testCase.input];
      if (input[3] && typeof input[3] === 'object' && 'message' in input[3]) {
        input[3] = new Error(input[3].message);
      }
      
      const result = formatExecResult(...input);
      expect(result).toEqual(testCase.expected);
    });
  });
});
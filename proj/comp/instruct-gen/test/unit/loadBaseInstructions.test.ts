import { describe, it, expect } from 'vitest';
import { loadBaseInstructions } from '../../src/loader.js';
import { readFileSync } from 'fs';
import { join } from 'path';

const testData = JSON.parse(
  readFileSync(join(import.meta.dirname, '../../test-data/unit/loadBaseInstructions.json'), 'utf8')
);

describe('loadBaseInstructions', () => {
  testData.cases.forEach((testCase) => {
    it(testCase.name, async () => {
      const result = await loadBaseInstructions();
      
      expect(typeof result).toBe(testCase.verify.type);
      
      testCase.verify.contains?.forEach(text => {
        expect(result).toContain(text);
      });
    });
  });
});
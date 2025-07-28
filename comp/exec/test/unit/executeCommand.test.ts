import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { executeCommand } from '../../src/executeCommand';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testData = JSON.parse(
  readFileSync(join(__dirname, '../../test-data/unit/executeCommand.json'), 'utf8')
);

describe('executeCommand', () => {
  testData.cases.forEach((testCase: any) => {
    it(testCase.name, async () => {
      if (testCase.throws) {
        await expect(executeCommand(testCase.input)).rejects.toThrow(testCase.throws);
      } else {
        const result = await executeCommand(testCase.input);
        
        // Handle dynamic values
        const expected = { ...testCase.expected };
        if (expected.stdout === '{TMP_PATH}\n') {
          expected.stdout = result.stdout; // Accept whatever tmp path the system gives
        }
        
        expect(result).toEqual(expected);
      }
    });
  });
});
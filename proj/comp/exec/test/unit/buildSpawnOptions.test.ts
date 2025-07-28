import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { buildSpawnOptions } from '../../src/buildSpawnOptions';
import { ExecError } from '../../src/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testData = JSON.parse(
  readFileSync(join(__dirname, '../../test-data/unit/buildSpawnOptions.json'), 'utf8')
);

describe('buildSpawnOptions', () => {
  testData.cases.forEach((testCase: any) => {
    it(testCase.name, async () => {
      if (testCase.throws) {
        await expect(buildSpawnOptions(...testCase.input)).rejects.toThrow(ExecError);
      } else {
        const result = await buildSpawnOptions(...testCase.input);
        
        // Handle dynamic values
        const expected = { ...testCase.expected };
        if (expected.cwd === '{PROCESS_CWD}') {
          expected.cwd = process.cwd();
        }
        if (expected.cwd === '{RESOLVED_PATH}') {
          expected.cwd = resolve(testCase.input[0]);
        }
        if (expected.env === '{PROCESS_ENV}') {
          expected.env = process.env;
        }
        
        expect(result).toEqual(expected);
      }
    });
  });
});
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mapLanguageToCommand } from '../../src/mapLanguageToCommand';
import { ExecError } from '../../src/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testData = JSON.parse(
  readFileSync(join(__dirname, '../../test-data/unit/mapLanguageToCommand.json'), 'utf8')
);

describe('mapLanguageToCommand', () => {
  testData.cases.forEach((testCase: any) => {
    it(testCase.name, () => {
      if (testCase.throws) {
        expect(() => mapLanguageToCommand(...testCase.input)).toThrow(ExecError);
      } else {
        const result = mapLanguageToCommand(...testCase.input);
        expect(result).toEqual(testCase.expected);
      }
    });
  });
});
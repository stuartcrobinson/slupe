import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { formatNodeError } from '../../src/utils';

const testData = JSON.parse(
  readFileSync(join(__dirname, '../../test-data/unit/formatNodeError.cases.json'), 'utf8')
);

describe('formatNodeError', () => {
  testData.cases.forEach(({ name, input, expected }) => {
    it(name, () => {
      const result = formatNodeError(input[0], input[1], input[2], input[3]);
      expect(result).toEqual(expected);
    });
  });
});
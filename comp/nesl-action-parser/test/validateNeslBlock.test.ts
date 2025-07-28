import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { validateNeslBlock } from '../src/index';

const testData = JSON.parse(
  readFileSync(join(__dirname, '../test-data/validateNeslBlock.json'), 'utf8')
);

describe('validateNeslBlock', () => {
  testData.cases.forEach(({ name, input, expected }) => {
    it(name, () => {
      const [block, actionSchema] = input;
      const result = validateNeslBlock(block, actionSchema);
      expect(result).toEqual(expected);
    });
  });
});
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { transformToAction, TransformError } from '../src/index';

const testData = JSON.parse(
  readFileSync(join(__dirname, '../test-data/transformToAction.json'), 'utf8')
);

describe('transformToAction', () => {
  testData.cases.forEach(({ name, input, expected, throws }) => {
    it(name, () => {
      const [block, actionDef] = input;
      if (throws) {
        expect(() => transformToAction(block, actionDef)).toThrow(TransformError);
      } else {
        const result = transformToAction(block, actionDef);
        expect(result).toEqual(expected);
      }
    });
  });
});
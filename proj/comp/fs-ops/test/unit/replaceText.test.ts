import { describe, it, expect } from 'vitest';
import { replaceText } from '../../src/replaceText.ts';
import { cases } from '../../test-data/unit/replaceText.cases.ts';

describe('replaceText', () => {
  cases.forEach(({ name, input, expected, throws }) => {
    it(name, () => {
      if (throws) {
        expect(() => replaceText(...input)).toThrow(throws);
      } else {
        const result = replaceText(...input);
        expect(result).toEqual(expected);
      }
    });
  });
});

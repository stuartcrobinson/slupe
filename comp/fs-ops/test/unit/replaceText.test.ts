import { describe, it, expect } from 'vitest';
import { replaceText } from '../../src/replaceText';
import { cases } from '../../test-data/unit/replaceText.cases';

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

import { describe, it, expect } from 'vitest';
import { extractNumberedLines } from '../../src/extractNumberedLines';
import { cases } from '../../test-data/unit/extractNumberedLines.cases';

describe('extractNumberedLines', () => {
  cases.forEach(({ name, input, expected, throws }) => {
    it(name, () => {
      if (throws) {
        expect(() => extractNumberedLines(...input)).toThrow(throws);
      } else {
        const result = extractNumberedLines(...input);
        expect(result).toEqual(expected);
      }
    });
  });
});
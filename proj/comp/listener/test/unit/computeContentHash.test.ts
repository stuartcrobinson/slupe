import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { computeContentHash } from '../../src/utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('computeContentHash', async () => {
  const testDataPath = join(__dirname, '../../test-data/unit/computeContentHash.json');
  const testData = JSON.parse(await readFile(testDataPath, 'utf-8'));

  for (const testCase of testData.cases) {
    it(testCase.name, () => {
      const [content] = testCase.input;
      const result = computeContentHash(content);
      
      // Verify it's a valid SHA-256 hash (64 hex characters)
      expect(result).toMatch(/^[a-f0-9]{64}$/);
      
      // Verify that same input produces same hash
      const result2 = computeContentHash(content);
      expect(result2).toBe(result);
      
      // For specific expected hashes, verify exact match
      if (testCase.expected && !testCase.expected.startsWith('verify_')) {
        expect(result).toBe(testCase.expected);
      }
      
      // For whitespace tests, verify they produce different hashes
      if (testCase.name === 'whitespace matters') {
        const otherContent = 'hello  world'; // two spaces
        const otherHash = computeContentHash(otherContent);
        expect(result).not.toBe(otherHash);
      }
    });
  }
});
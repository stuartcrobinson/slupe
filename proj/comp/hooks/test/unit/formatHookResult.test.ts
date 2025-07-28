import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { formatHookResult } from '../../src/formatHookResult';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test data
const testDataPath = join(__dirname, '../../test-data/unit/formatHookResult.json');
const testData = JSON.parse(readFileSync(testDataPath, 'utf8'));

// Run tests
describe('formatHookResult', () => {
  testData.cases.forEach((testCase: any) => {
    test(testCase.name, () => {
      const [results] = testCase.input;
      
      if (testCase.throws) {
        expect(() => formatHookResult(results)).toThrow();
      } else {
        const result = formatHookResult(results);
        expect(result).toEqual(testCase.expected);
      }
    });
  });
});
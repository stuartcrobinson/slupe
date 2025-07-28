import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { validateCommand } from '../../src/validateCommand.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test data
const testDataPath = join(__dirname, '../../test-data/unit/validateCommand.json');
const testData = JSON.parse(readFileSync(testDataPath, 'utf8'));

// Run tests
describe('validateCommand', () => {
  testData.cases.forEach((testCase: any) => {
    test(testCase.name, () => {
      const [cmd] = testCase.input;
      
      if (testCase.throws) {
        expect(() => validateCommand(cmd)).toThrow();
      } else {
        const result = validateCommand(cmd);
        expect(result).toEqual(testCase.expected);
      }
    });
  });
});
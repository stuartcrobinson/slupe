import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { interpolateCommand } from '../../src/interpolateCommand';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test data
const testDataPath = join(__dirname, '../../test-data/unit/interpolateCommand.json');
const testData = JSON.parse(readFileSync(testDataPath, 'utf8'));

// Run tests
describe('interpolateCommand', () => {
  testData.cases.forEach((testCase: any) => {
    test(testCase.name, () => {
      const [cmd, vars, context] = testCase.input;
      
      if (testCase.throws) {
        expect(() => interpolateCommand(cmd, vars, context)).toThrow();
      } else {
        const result = interpolateCommand(cmd, vars, context);
        expect(result).toEqual(testCase.expected);
      }
    });
  });
});
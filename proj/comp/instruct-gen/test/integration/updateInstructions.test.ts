import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { updateInstructions } from '../../src/index.js';
import { readFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const testData = JSON.parse(
  readFileSync(join(import.meta.dirname, '../../test-data/integration/updateInstructions.json'), 'utf8')
);

describe('updateInstructions', () => {
  testData.cases.forEach((testCase) => {
    describe(testCase.name, () => {
      beforeEach(() => {
        if (testCase.setup?.createTempDir) {
          mkdirSync(testCase.input.repoPath, { recursive: true });
        }
      });

      afterEach(() => {
        if (testCase.setup?.createTempDir) {
          rmSync(testCase.input.repoPath, { recursive: true, force: true });
        }
      });

      it('executes correctly', async () => {
        await updateInstructions(
          testCase.input.repoPath,
          testCase.input.allowedTools
        );

        if (testCase.verify.fileExists) {
          expect(existsSync(testCase.verify.fileExists)).toBe(true);

          const content = readFileSync(testCase.verify.fileExists, 'utf8');

          testCase.verify.fileContains?.forEach(text => {
            expect(content).toContain(text);
          });

          testCase.verify.fileNotContains?.forEach(text => {
            expect(content).not.toContain(text);
          });
        }
      });
    });
  });
});
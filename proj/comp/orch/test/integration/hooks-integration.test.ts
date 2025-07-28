import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { Slupe } from '../../src/index.ts';
import { parseTestFile } from '../utils/parseTestFile.ts';

describe('Hooks Integration', () => {
  const testDataPath = join(import.meta.dirname, '../../test-data/integration/hooks-integration.md');
  const testCases = parseTestFile(testDataPath);

  beforeEach(() => {
    // Ensure temp directories exist
    if (!existsSync('/tmp')) {
      throw new Error('Tests require /tmp directory');
    }
  });

  afterEach(() => {
    // Cleanup test directories
    const dirs = [
      '/tmp/t_hooks_integration_001',
      '/tmp/t_hooks_integration_002',
      '/tmp/t_hooks_integration_003',
      '/tmp/t_hooks_integration_004',
      '/tmp/t_hooks_integration_005'
    ];

    for (const dir of dirs) {
      if (existsSync(dir)) {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  for (const testCase of testCases) {
    test(testCase.name, async () => {
      // Setup
      if (testCase.config?.repoPath && !existsSync(testCase.config.repoPath)) {
        mkdirSync(testCase.config.repoPath, { recursive: true });
      }

      // Create Slupe instance with test config
      const slupe = await Slupe.create(testCase.config);


      // Execute
      const result = await slupe.execute(testCase.input);

      // // Debug output
      // console.log(`\n=== Test: ${testCase.name} ===`);
      // console.log('Config:', JSON.stringify(testCase.config, null, 2));
      // console.log('Result:', JSON.stringify(result, null, 2));

      // Basic assertions
      expect(result.success).toBe(testCase.expected.success);
      expect(result.totalBlocks).toBe(testCase.expected.totalBlocks);
      expect(result.executedActions).toBe(testCase.expected.executedActions);

      // Verify hook errors if expected
      if (testCase.expected.hookErrors) {
        expect(result.hookErrors).toBeDefined();
        if (testCase.expected.hookErrors.before) {
          expect(result.hookErrors?.before).toBeDefined();
          expect(result.hookErrors?.before?.length).toBeGreaterThan(0);
        }
      }

      // Verify fatal error if expected
      if (testCase.expected.fatalError) {
        expect(result.fatalError).toBe(testCase.expected.fatalError);
      }

      // Test-specific verifications
      if (testCase.verify) {
        const repoPath = testCase.config?.repoPath;

        if (!repoPath) {
          throw new Error(`Test ${testCase.name} has verify=true but no repoPath in config`);
        }

        switch (testCase.name) {
          case '001-basic-hooks-execution': {
            const tracePath = join(repoPath, 'hook-trace.txt');
            expect(existsSync(tracePath)).toBe(true);
            const trace = readFileSync(tracePath, 'utf8');
            expect(trace).toContain('BEFORE_RAN');
            expect(trace).toContain('AFTER_RAN');
            expect(trace).toContain('FILES_MODIFIED=');
            break;
          }

          case '002-hooks-with-failures': {
            const resultPath = join(repoPath, 'result.txt');
            expect(existsSync(resultPath)).toBe(true);
            const content = readFileSync(resultPath, 'utf8');
            expect(content).toContain('SUCCESS=false');
            expect(content).toContain('ERRORS=1');
            break;
          }

          case '003-before-hook-failure-aborts': {
            const testPath = join(repoPath, 'test.txt');
            const afterPath = join(repoPath, 'after.txt');
            expect(existsSync(testPath)).toBe(false);
            expect(existsSync(afterPath)).toBe(false);
            break;
          }

          case '004-context-variables-in-hooks': {
            const summaryPath = join(repoPath, 'summary.txt');
            expect(existsSync(summaryPath)).toBe(true);
            const summary = readFileSync(summaryPath, 'utf8');
            expect(summary).toContain('Total blocks: 2');
            expect(summary).toContain('Executed: 2');
            expect(summary).toContain('Operations: file_write,file_read');
            break;
          }

          case '005-slupe-yml-default-config': {
            const configPath = join(repoPath, 'slupe.yml');
            expect(existsSync(configPath)).toBe(true); // Auto-creation happens now
            const testPath = join(repoPath, 'test.txt');
            expect(existsSync(testPath)).toBe(true);
            break;
          }
        }
      }
    });
  }
});
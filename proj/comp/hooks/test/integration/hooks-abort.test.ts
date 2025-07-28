import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Slupe } from '../../../orch/src/index.ts';

describe('Hooks Abort Behavior', () => {
  test('hook failure aborts NESL execution', async () => {
    const TEST_PATH = '/tmp/t_hooks_abort_test';

    // Ensure clean state
    if (existsSync(TEST_PATH)) {
      rmSync(TEST_PATH, { recursive: true, force: true });
    }
    mkdirSync(TEST_PATH, { recursive: true });

    // Create slupe.yml with a failing command
    const slupeConfig = `version: 1
allowed-actions:
 - file_write
hooks:
 before:
   - run: echo "FIRST_HOOK_RAN" > ${TEST_PATH}/first.txt
   - run: "cat /definitely/not/a/real/file/path.txt"  # This will fail
   - run: echo "SHOULD_NOT_RUN" > ${TEST_PATH}/should-not-exist.txt
     
 after:
   - run: echo "AFTER_SHOULD_NOT_RUN" > ${TEST_PATH}/after.txt
`;

    writeFileSync(join(TEST_PATH, 'slupe.yml'), slupeConfig);

    // NESL that would create files if executed
    const neslInput = `#!nesl [@three-char-SHA-256: hfa]
action = "file_write"
path = "${TEST_PATH}/nesl-output.txt"
content = "This should not be written"
#!end_hfa`;

    const slupe = await Slupe.create({
      repoPath: TEST_PATH,
      enableHooks: true
    });

    const result = await slupe.execute(neslInput);

    // Verify the execution failed
    expect(result.success).toBe(false);
    expect(result.totalBlocks).toBe(0);
    expect(result.executedActions).toBe(0);
    expect(result.fatalError).toBe('Before hooks failed - aborting execution');
    expect(result.hookErrors?.before).toBeDefined();
    expect(result.hookErrors?.before?.[0]).toMatch(/cat.*No such file/);

    // Verify only the first hook ran
    expect(existsSync(join(TEST_PATH, 'first.txt'))).toBe(true);
    expect(existsSync(join(TEST_PATH, 'should-not-exist.txt'))).toBe(false);

    // Verify NESL didn't execute
    expect(existsSync(join(TEST_PATH, 'nesl-output.txt'))).toBe(false);

    // Verify after hooks didn't run
    expect(existsSync(join(TEST_PATH, 'after.txt'))).toBe(false);

    // Cleanup
    rmSync(TEST_PATH, { recursive: true, force: true });
  });
});
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { processContent } from '../../src/content-processor.js';
import { Slupe } from '../../../orch/src/index.js';

//https://claude.ai/chat/0d9f1c6b-3d6c-4ca7-bcdf-e6ddfd72cc5f

describe('After Hooks Lifecycle', () => {
  let testDir: string;
  let outputFile: string;

  beforeEach(() => {
    // Create unique test directory in OS temp dir
    const tempBase = tmpdir();
    testDir = join(tempBase, `slupe_after_hooks_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    outputFile = join(testDir, 'slupe_output.md');
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('after hooks run after output file is written', async () => {
    // Create slupe.yml with after hook that verifies output file exists
    const slupeConfig = `version: 1
allowed-actions:
  - file_write
  - file_read
hooks:
  after:
    - run: test -f "${outputFile}" && echo "OUTPUT_FILE_EXISTS_WHEN_HOOK_RAN" > "${join(testDir, 'hook-verification.txt')}"
    - run: echo "HOOK_RAN_AT_\$(date +%s%N)" >> "${join(testDir, 'hook-timing.txt')}"
`;
    writeFileSync(join(testDir, 'slupe.yml'), slupeConfig);

    // Create NESL input that writes a test file
    const neslInput = `#!nesl [@three-char-SHA-256: h1a]
action = "file_write"
path = "${join(testDir, 'test-file.txt')}"
content = "Test content"
#!end_h1a`;

    // Process content through the listener flow
    const slupe = await Slupe.create({ 
      repoPath: testDir,
      enableHooks: true 
    });
    
    const result = await processContent(neslInput, '', false, testDir, slupe);
    
    expect(result).not.toBeNull();
    expect(result!.executedActions).toBe(1);

    // Simulate what the listener does: write output file
    writeFileSync(outputFile, result!.fullOutput);
    writeFileSync(join(testDir, 'output-write-timing.txt'), `OUTPUT_WRITTEN_AT_${Date.now()}`);

    // Now run after hooks (as listener would)
    if (result!.afterHookContext) {
      const hookResult = await slupe.runAfterHooks(result!.afterHookContext);
      expect(hookResult.success).toBe(true);
    }

    // Verify hooks ran and saw the output file
    expect(existsSync(join(testDir, 'hook-verification.txt'))).toBe(true);
    const verification = readFileSync(join(testDir, 'hook-verification.txt'), 'utf8');
    expect(verification.trim()).toBe('OUTPUT_FILE_EXISTS_WHEN_HOOK_RAN');

    // Verify timing - hook ran after output was written
    expect(existsSync(join(testDir, 'hook-timing.txt'))).toBe(true);
  });

  test('after hook failure prevents successful completion', async () => {
    // Create slupe.yml with failing after hook
    const slupeConfig = `version: 1
allowed-actions:
  - file_write
hooks:
  after:
    - run: echo "AFTER_HOOK_STARTING" > "${join(testDir, 'hook-trace.txt')}"
    - run: exit 1
    - run: echo "THIS_SHOULD_NOT_RUN" >> "${join(testDir, 'hook-trace.txt')}"
`;
    writeFileSync(join(testDir, 'slupe.yml'), slupeConfig);

    // Create NESL input
    const neslInput = `#!nesl [@three-char-SHA-256: h2a]
action = "file_write"  
path = "${join(testDir, 'main-action.txt')}"
content = "Main action executed"
#!end_h2a`;

    // Process through listener
    const slupe = await Slupe.create({ 
      repoPath: testDir,
      enableHooks: true 
    });
    
    const result = await processContent(neslInput, '', false, testDir, slupe);
    expect(result).not.toBeNull();
    expect(result!.executedActions).toBe(1);

    // Write output file (simulating listener)
    writeFileSync(outputFile, result!.fullOutput);

    // Run after hooks
    const hookResult = await slupe.runAfterHooks(result!.afterHookContext!);
    
    // Verify hook failed
    expect(hookResult.success).toBe(false);
    expect(hookResult.errors).toBeDefined();
    expect(hookResult.errors!.length).toBeGreaterThan(0);

    // Verify first command ran but third didn't
    const hookTrace = readFileSync(join(testDir, 'hook-trace.txt'), 'utf8');
    expect(hookTrace).toContain('AFTER_HOOK_STARTING');
    expect(hookTrace).not.toContain('THIS_SHOULD_NOT_RUN');

    // Verify main action still completed (file exists)
    expect(existsSync(join(testDir, 'main-action.txt'))).toBe(true);
  });

  test('CLI process exits with error when after hook fails', async () => {
    // Create a TypeScript test script that mimics the CLI behavior
    const cliScript = `
import { Slupe } from '${join(import.meta.dirname, '../../../orch/src/index.js').replace(/\\/g, '/')}';
import { processContent } from '${join(import.meta.dirname, '../../src/content-processor.js').replace(/\\/g, '/')}';
import { writeFileSync, readFileSync } from 'fs';

async function main() {
  const input = readFileSync(process.argv[2], 'utf8');
  const outputFile = process.argv[3];
  const repoPath = process.argv[4];
  
  const slupe = await Slupe.create({ repoPath, enableHooks: true });
  const result = await processContent(input, '', false, repoPath, slupe);
  
  if (result) {
    writeFileSync(outputFile, result.fullOutput);
    
    if (result.afterHookContext) {
      const hookResult = await slupe.runAfterHooks(result.afterHookContext);
      if (!hookResult.success) {
        console.error('After hooks failed');
        process.exit(1);
      }
    }
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(2);
});
`;

    // Write CLI script as TypeScript
    const cliScriptPath = join(testDir, 'test-cli.ts');
    writeFileSync(cliScriptPath, cliScript);

    // Create slupe.yml with failing after hook
    const slupeConfig = `version: 1
allowed-actions:
  - file_write
hooks:
  after:
    - run: echo "HOOK_RAN" > "${join(testDir, 'after-hook-ran.txt')}"
    - run: exit 42
`;
    writeFileSync(join(testDir, 'slupe.yml'), slupeConfig);

    // Create input file
    const inputFile = join(testDir, 'input.nesl');
    const neslInput = `#!nesl [@three-char-SHA-256: h3a]
action = "file_write"
path = "${join(testDir, 'action-output.txt')}"
content = "Action completed"
#!end_h3a`;
    writeFileSync(inputFile, neslInput);

    // Spawn the CLI process using tsx to run TypeScript directly
    const child = spawn('npx', [
      'tsx',
      cliScriptPath,
      inputFile,
      outputFile,
      testDir
    ], {
      cwd: testDir,
      env: { ...process.env, NODE_ENV: 'test' },
      shell: true
    });

    // Collect output
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });

    // Wait for process to exit
    const exitCode = await new Promise<number>((resolve) => {
      child.on('exit', (code) => resolve(code || 0));
    });

    // Verify process exited with error
    expect(exitCode).toBe(1);
    expect(stderr).toContain('After hooks failed');

    // Verify main action completed (output file written)
    expect(existsSync(outputFile)).toBe(true);
    expect(existsSync(join(testDir, 'action-output.txt'))).toBe(true);

    // Verify after hook ran before failing
    expect(existsSync(join(testDir, 'after-hook-ran.txt'))).toBe(true);
  });

  test('multiple after hooks execute in order until failure', async () => {
    // Create slupe.yml with multiple after hooks
    const slupeConfig = `version: 1
allowed-actions:
  - file_write
hooks:
  after:
    - run: echo "HOOK_1" > "${join(testDir, 'hook-order.txt')}"
    - run: echo "HOOK_2" >> "${join(testDir, 'hook-order.txt')}"
    - run: test -f "${join(testDir, 'should-not-exist.txt')}"
      continueOnError: false
    - run: echo "HOOK_3_SHOULD_NOT_RUN" >> "${join(testDir, 'hook-order.txt')}"
`;
    writeFileSync(join(testDir, 'slupe.yml'), slupeConfig);

    const neslInput = `#!nesl [@three-char-SHA-256: h4a]
action = "file_write"
path = "${join(testDir, 'test.txt')}"
content = "test"
#!end_h4a`;

    const slupe = await Slupe.create({ 
      repoPath: testDir,
      enableHooks: true 
    });
    
    const result = await processContent(neslInput, '', false, testDir, slupe);
    writeFileSync(outputFile, result!.fullOutput);

    const hookResult = await slupe.runAfterHooks(result!.afterHookContext!);
    
    expect(hookResult.success).toBe(false);
    
    // Verify execution order
    const hookOrder = readFileSync(join(testDir, 'hook-order.txt'), 'utf8');
    expect(hookOrder).toContain('HOOK_1');
    expect(hookOrder).toContain('HOOK_2');
    expect(hookOrder).not.toContain('HOOK_3_SHOULD_NOT_RUN');
  });
});
import { describe, it, expect } from 'vitest';
import { FsGuard } from '../../comp/fs-guard/src/index.js';
import { mkdir, rmdir } from 'fs/promises';

describe('fs-guard-debug', () => {
  it('should check /tmp paths correctly', async () => {
    const testDir = '/tmp/t_fs-guard-debug';

    // Create test directory
    await mkdir(testDir, { recursive: true });

    try {
      // Test with absolute path resolution
      const guard = new FsGuard({
        allowed: ['./**', '/tmp/**'],
        denied: ['**/.git/**', '**/.ssh/**', '**/node_modules/**']
      }, testDir);

      // Test action
      const result = await guard.check({
        action: 'write_file',
        parameters: {
          path: '/tmp/t_fs-guard-debug/test.txt',
          content: 'hello'
        },
        metadata: { blockId: 'test' }
      });

      // console.log('Guard check result:', result);
      expect(result.allowed).toBe(true);

      // Test with explicit base path instead of process.chdir
      const guard2 = new FsGuard({
        allowed: ['./**', '/tmp/**'],
        denied: ['**/.git/**', '**/.ssh/**', '**/node_modules/**']
      }, testDir);

      const result2 = await guard2.check({
        action: 'write_file',
        parameters: {
          path: '/tmp/t_fs-guard-debug/test.txt',
          content: 'hello'
        },
        metadata: { blockId: 'test' }
      });

      // console.log('Guard check result (with explicit base):', result2);

      expect(result2.allowed).toBe(true);
    } finally {
      await rmdir(testDir, { recursive: true });
    }
  });
});
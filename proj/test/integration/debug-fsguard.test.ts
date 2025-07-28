import { describe, it, expect } from 'vitest';
import { FsGuard } from '../../comp/fs-guard/src/index.js';
import { mkdir, rmdir } from 'fs/promises';

describe('fs-guard debug', () => {
  it('should check /tmp paths correctly', async () => {
    const testDir = '/tmp/slupe-entry-tests';
    
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
        action: 'file_write',
        parameters: {
          path: '/tmp/slupe-entry-tests/test.txt',
          content: 'hello'
        },
        metadata: { blockId: 'test' }
      });
      
      console.log('Guard check result:', result);
      expect(result.allowed).toBe(true);
      
      // Also test with process.cwd changed
      const originalCwd = process.cwd();
      process.chdir(testDir);
      
      const guard2 = new FsGuard({
        allowed: ['./**', '/tmp/**'],
        denied: ['**/.git/**', '**/.ssh/**', '**/node_modules/**']
      }, process.cwd());
      
      const result2 = await guard2.check({
        action: 'file_write',
        parameters: {
          path: '/tmp/slupe-entry-tests/test.txt',
          content: 'hello'
        },
        metadata: { blockId: 'test' }
      });
      
      console.log('Guard check result (with cwd):', result2);
      process.chdir(originalCwd);
      
      expect(result2.allowed).toBe(true);
    } finally {
      await rmdir(testDir, { recursive: true });
    }
  });
});
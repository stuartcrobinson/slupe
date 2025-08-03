import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { simpleGit, SimpleGit } from 'simple-git';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { squash } from '../../src/index.js';

describe('squash with public repo', () => {
  let tempDir: string;
  let git: SimpleGit;
  
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'squash-public-'));
    git = simpleGit(tempDir);
    
    await git.clone('https://github.com/stuartcrobinson/slupe-squash-test-repo', tempDir);
    await git.addConfig('user.name', 'Test User');
    await git.addConfig('user.email', 'test@example.com');
  });
  
  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });
  
  it('adds and squashes test commits on public repo', async () => {
    await git.checkout(['-b', 'test-squash']);
    
    await writeFile(join(tempDir, 'test-file1.txt'), 'test content 1');
    await git.add('.');
    await git.commit('auto-slupe:: test change 1');
    
    await writeFile(join(tempDir, 'test-file2.txt'), 'test content 2');
    await git.add('.');
    await git.commit('auto-slupe:: test change 2');
    
    await writeFile(join(tempDir, 'test-file3.txt'), 'test content 3');
    await git.add('.');
    await git.commit('auto-slupe:: test change 3');
    
    const logBefore = await git.log();
    const beforeCount = logBefore.total;
    
    process.argv = ['node', 'squash.js'];
    await squash(tempDir);
    
    const logAfter = await git.log();
    expect(logAfter.total).toBe(beforeCount - 2);
    expect(logAfter.latest!.message).toMatch(/Squashed 3 commits/);
    
    const status = await git.status();
    expect(status.files.length).toBe(0);
  });
  
  it('handles non-contiguous pattern on public repo', async () => {
    await git.checkout(['-b', 'test-mixed']);
    
    await writeFile(join(tempDir, 'test1.txt'), 'content');
    await git.add('.');
    await git.commit('auto-slupe:: change 1');
    
    await writeFile(join(tempDir, 'test2.txt'), 'content');
    await git.add('.');
    await git.commit('manual change');
    
    await writeFile(join(tempDir, 'test3.txt'), 'content');
    await git.add('.');
    await git.commit('auto-slupe:: change 2');
    
    const logBefore = await git.log();
    const beforeCount = logBefore.total;
    
    process.argv = ['node', 'squash.js'];
    await squash(tempDir);
    
    const logAfter = await git.log();
    expect(logAfter.total).toBe(beforeCount);
    expect(logAfter.all[0]!.message).toBe('auto-slupe:: change 2');
    expect(logAfter.all[1]!.message).toBe('manual change');
    expect(logAfter.all[2]!.message).toBe('auto-slupe:: change 1');
  });
});
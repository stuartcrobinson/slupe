import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { simpleGit, SimpleGit } from 'simple-git';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { squash } from '../../src/index.js';

describe('squash integration', () => {
  let tempDir: string;
  let git: SimpleGit;
  let remoteDir: string;
  let remoteGit: SimpleGit;
  
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'squash-test-'));
    remoteDir = await mkdtemp(join(tmpdir(), 'squash-remote-'));
    
    remoteGit = simpleGit(remoteDir);
    await remoteGit.init(['--bare']);
    
    git = simpleGit(tempDir);
    await git.init();
    await git.addConfig('user.name', 'Test User');
    await git.addConfig('user.email', 'test@example.com');
    await git.addRemote('origin', remoteDir);
  });
  
  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    await rm(remoteDir, { recursive: true, force: true });
  });
  
  it('squashes basic auto commits', async () => {
    await writeFile(join(tempDir, 'file1.txt'), 'content1');
    await git.add('.');
    await git.commit('manual commit');
    
    await writeFile(join(tempDir, 'file2.txt'), 'content2');
    await git.add('.');
    await git.commit('auto-slupe:: change 1');
    
    await writeFile(join(tempDir, 'file3.txt'), 'content3');
    await git.add('.');
    await git.commit('auto-slupe:: change 2');
    
    await writeFile(join(tempDir, 'file4.txt'), 'content4');
    await git.add('.');
    await git.commit('auto-slupe:: change 3');
    
    const logBefore = await git.log();
    expect(logBefore.total).toBe(4);
    
    process.argv = ['node', 'squash.js'];
    await squash(tempDir);
    
    const logAfter = await git.log();
    expect(logAfter.total).toBe(2);
    expect(logAfter.latest!.message).toMatch(/slupe-squash:: 3 commits/);
    expect(logAfter.all[1]!.message).toBe('manual commit');
  });
  
  it('respects limit option', async () => {
    for (let i = 1; i <= 5; i++) {
      await writeFile(join(tempDir, `file${i}.txt`), `content${i}`);
      await git.add('.');
      await git.commit(`auto-slupe:: change ${i}`);
    }
    
    process.argv = ['node', 'squash.js', '--limit', '3'];
    await squash(tempDir);
    
    const log = await git.log();
    expect(log.total).toBe(3);
    expect(log.latest!.message).toMatch(/slupe-squash:: 3 commits/);
  });
  
  it('handles empty string pattern', async () => {
    await writeFile(join(tempDir, 'base.txt'), 'base content');
    await git.add('.');
    await git.commit('base commit');
    
    await writeFile(join(tempDir, 'file1.txt'), 'content1');
    await git.add('.');
    await git.commit('first commit');
    
    await writeFile(join(tempDir, 'file2.txt'), 'content2');
    await git.add('.');
    await git.commit('second commit');
    
    await writeFile(join(tempDir, 'file3.txt'), 'content3');
    await git.add('.');
    await git.commit('third commit');
    
    console.log('\n=== Empty Pattern Test ===');
    const logBefore = await git.log();
    console.log('Commits before squash:', logBefore.total);
    logBefore.all.forEach(c => {
      console.log(`- ${c.hash.substring(0, 7)}: ${c.message}`);
    });
    
    process.argv = ['node', 'squash.js', '--containing', ''];
    await squash(tempDir);
    
    const log = await git.log();
    console.log('\nCommits after squash:', log.total);
    log.all.forEach(c => {
      console.log(`- ${c.hash.substring(0, 7)}: ${c.message}`);
    });
    
    // Empty string matches ALL commits, so nothing can be squashed
    // (would leave no parent commit)
    expect(log.total).toBe(4);
    expect(log.all[0]!.message).toBe('third commit');
    expect(log.all[3]!.message).toBe('base commit');
  });
  
  it('dry run preview', async () => {
    await writeFile(join(tempDir, 'file1.txt'), 'content1');
    await git.add('.');
    await git.commit('auto-slupe:: change 1');
    
    await writeFile(join(tempDir, 'file2.txt'), 'content2');
    await git.add('.');
    await git.commit('auto-slupe:: change 2');
    
    const logBefore = await git.log();
    
    process.argv = ['node', 'squash.js', '--dry-run'];
    await squash(tempDir);
    
    const logAfter = await git.log();
    expect(logAfter.total).toBe(logBefore.total);
  });
  
  it('push with force-with-lease', async () => {
    await writeFile(join(tempDir, 'file1.txt'), 'content1');
    await git.add('.');
    await git.commit('initial');
    
    const status = await git.status();
    const branch = status.current || 'main';
    await git.push(['origin', branch]);
    
    await writeFile(join(tempDir, 'file2.txt'), 'content2');
    await git.add('.');
    await git.commit('auto-slupe:: change 1');
    
    await writeFile(join(tempDir, 'file3.txt'), 'content3');
    await git.add('.');
    await git.commit('auto-slupe:: change 2');
    
    process.argv = ['node', 'squash.js', '--push'];
    await squash(tempDir);
    
    const localLog = await git.log();
    expect(localLog.total).toBe(2);
    
    const remoteLog = await remoteGit.log([branch]);
    expect(remoteLog.total).toBe(2);
    expect(remoteLog.latest!.message).toMatch(/slupe-squash:: 2 commits/);
  });


  it('handles empty string pattern with limit', async () => {
    for (let i = 1; i <= 5; i++) {
      await writeFile(join(tempDir, `file${i}.txt`), `content${i}`);
      await git.add('.');
      await git.commit(`commit ${i}`);
    }
    
    process.argv = ['node', 'squash.js', '--containing', '', '--limit', '3'];
    await squash(tempDir);
    
    const log = await git.log();
    expect(log.total).toBe(3);
    expect(log.latest!.message).toMatch(/slupe-squash:: 3 commits/);
  });

  it('respects after date filter', async () => {
    await writeFile(join(tempDir, 'base.txt'), 'base content');
    await git.add('.');
    await git.commit('base commit');
    
    await writeFile(join(tempDir, 'file1.txt'), 'content1');
    await git.add('.');
    await git.commit('auto-slupe:: old commit');
    
    // Wait 2 seconds to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 2000));
    const afterFirstCommit = new Date();
    
    await writeFile(join(tempDir, 'file2.txt'), 'content2');
    await git.add('.');
    await git.commit('auto-slupe:: recent commit 1');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await writeFile(join(tempDir, 'file3.txt'), 'content3');
    await git.add('.');
    await git.commit('auto-slupe:: recent commit 2');
    
    console.log('\n=== After Filter Test ===');
    console.log('Filter timestamp:', afterFirstCommit.toISOString());
    
    const logBefore = await git.log();
    console.log('\nAll commits with timestamps:');
    for (const c of logBefore.all) {
      const details = await git.show(['-s', '--format=%ci', c.hash]);
      console.log(`- ${c.hash.substring(0, 7)}: ${c.message} | ${details.trim()}`);
    }
    
    process.env.DEBUG_SQUASH = 'true';
    process.argv = ['node', 'squash.js', '--after', afterFirstCommit.toISOString()];
    await squash(tempDir);
    delete process.env.DEBUG_SQUASH;
    
    const log = await git.log();
    console.log('\nFinal commits:', log.total);
    log.all.forEach(c => {
      console.log(`- ${c.hash.substring(0, 7)}: ${c.message}`);
    });
    
    expect(log.total).toBe(3);
    expect(log.latest!.message).toMatch(/slupe-squash:: 2 commits/);
  });

  it('handles various date formats for after', async () => {
    await writeFile(join(tempDir, 'file1.txt'), 'content1');
    await git.add('.');
    await git.commit('auto-slupe:: commit 1');
    
    await writeFile(join(tempDir, 'file2.txt'), 'content2');
    await git.add('.');
    await git.commit('auto-slupe:: commit 2');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    process.argv = ['node', 'squash.js', '--after', yesterday.toISOString().split('T')[0], '--dry-run'];
    await squash(tempDir);
    
    process.argv = ['node', 'squash.js', '--after', '1 day ago', '--dry-run'];
    await squash(tempDir);
    
    process.argv = ['node', 'squash.js', '--after', 'yesterday', '--dry-run'];
    await squash(tempDir);
  });

  it('handles future after date gracefully', async () => {
    await writeFile(join(tempDir, 'file1.txt'), 'content1');
    await git.add('.');
    await git.commit('auto-slupe:: commit 1');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    process.argv = ['node', 'squash.js', '--after', tomorrow.toISOString()];
    await squash(tempDir);
    
    const log = await git.log();
    expect(log.total).toBe(1);
  });

});


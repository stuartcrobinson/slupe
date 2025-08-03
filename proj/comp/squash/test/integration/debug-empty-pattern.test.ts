import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { simpleGit, SimpleGit } from 'simple-git';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { findCommits } from '../../src/findCommits.js';

describe('debug empty pattern behavior', () => {
  let tempDir: string;
  let git: SimpleGit;
  
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'debug-empty-'));
    git = simpleGit(tempDir);
    await git.init();
    await git.addConfig('user.name', 'Test User');
    await git.addConfig('user.email', 'test@example.com');
  });
  
  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });
  
  it('shows what empty pattern matches', async () => {
    await writeFile(join(tempDir, 'base.txt'), 'base');
    await git.add('.');
    await git.commit('base commit');
    
    await writeFile(join(tempDir, 'file1.txt'), 'content1');
    await git.add('.');
    await git.commit('first commit');
    
    await writeFile(join(tempDir, 'file2.txt'), 'content2');
    await git.add('.');
    await git.commit('second commit');
    
    process.env.DEBUG_SQUASH = 'true';
    
    const commits = await findCommits({ containing: [''] }, tempDir);
    
    console.log('\n=== Empty Pattern Debug ===');
    console.log('Total commits found:', commits.length);
    commits.forEach(c => {
      console.log(`- ${c.hash.substring(0, 7)}: ${c.message}`);
    });
    
    const allCommits = await git.log();
    console.log('\nAll commits in repo:', allCommits.total);
    allCommits.all.forEach(c => {
      console.log(`- ${c.hash.substring(0, 7)}: ${c.message}`);
    });
    
    delete process.env.DEBUG_SQUASH;
  });
  
  it('shows after filter behavior', async () => {
    await writeFile(join(tempDir, 'file1.txt'), 'content1');
    await git.add('.');
    await git.commit('old commit');
    
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 5);
    await git.raw(['commit', '--amend', '--no-edit', '--date', oldDate.toISOString()]);
    
    await writeFile(join(tempDir, 'file2.txt'), 'content2');
    await git.add('.');
    await git.commit('recent commit 1');
    
    await writeFile(join(tempDir, 'file3.txt'), 'content3');
    await git.add('.');
    await git.commit('recent commit 2');
    
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    console.log('\n=== After Filter Debug ===');
    console.log('Filter date:', threeDaysAgo.toISOString());
    
    const logWithAfter = await git.log([`--after=${threeDaysAgo.toISOString()}`]);
    console.log('\ngit log --after results:', logWithAfter.total);
    logWithAfter.all.forEach(c => {
      console.log(`- ${c.hash.substring(0, 7)}: ${c.message} (${c.date})`);
    });
    
    process.env.DEBUG_SQUASH = 'true';
    const commits = await findCommits({ 
      containing: [''], 
      after: threeDaysAgo.toISOString() 
    }, tempDir);
    
    console.log('\nfindCommits results:', commits.length);
    commits.forEach(c => {
      console.log(`- ${c.hash.substring(0, 7)}: ${c.message} (${c.date})`);
    });
    
    delete process.env.DEBUG_SQUASH;
  });
});
import { describe, it } from 'vitest';
import { simpleGit, SimpleGit } from 'simple-git';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

describe('debug git date filtering', () => {
  let tempDir: string;
  let git: SimpleGit;
  
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'debug-date-'));
    git = simpleGit(tempDir);
    await git.init();
    await git.addConfig('user.name', 'Test User');
    await git.addConfig('user.email', 'test@example.com');
  });
  
  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });
  
  it('shows git date fields', async () => {
    await writeFile(join(tempDir, 'file1.txt'), 'content');
    await git.add('.');
    await git.commit('commit 1');
    
    const oldDate = new Date('2025-07-29T12:00:00Z');
    await git.raw(['commit', '--amend', '--no-edit', '--date', oldDate.toISOString()]);
    
    console.log('\n=== Git Date Fields ===');
    
    const showResult = await git.raw(['show', '--format=fuller', '-s']);
    console.log('git show --format=fuller:\n', showResult);
    
    const logResult = await git.raw(['log', '--format="%H | AuthorDate: %ai | CommitDate: %ci | %s"', '-1']);
    console.log('\ngit log format:\n', logResult);
    
    const threeDaysAgo = new Date('2025-07-31T00:00:00Z');
    console.log('\nFilter date:', threeDaysAgo.toISOString());
    
    const afterAuthor = await git.raw(['log', '--after=' + threeDaysAgo.toISOString(), '--format="%H %s"']);
    console.log('\nWith --after:', afterAuthor);
    
    const sinceAuthor = await git.raw(['log', '--since=' + threeDaysAgo.toISOString(), '--format="%H %s"']);
    console.log('\nWith --since:', sinceAuthor);
  });
});
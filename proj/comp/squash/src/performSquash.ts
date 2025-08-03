import { GitCommit } from './types.js';
import { simpleGit } from 'simple-git';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { debug } from './debug.js';

export async function performSquash(
  commits: GitCommit[], 
  message: string,
  cwd?: string
): Promise<string> {
  if (commits.length < 2) {
    throw new Error('Need at least 2 commits to squash');
  }
  
  const git = simpleGit(cwd);
  const oldestHash = commits[0]!.hash;
  
  debug('performSquash:start', { 
    commitCount: commits.length,
    oldestHash: oldestHash.substring(0, 7),
    newestHash: commits[commits.length - 1]!.hash.substring(0, 7)
  });
  
  let parentHash: string;
  try {
    const parentResult = await git.raw(['rev-parse', `${oldestHash}^`]);
    parentHash = parentResult.trim();
    debug('performSquash:parentFound', { oldestHash: oldestHash.substring(0, 7), parentHash: parentHash.substring(0, 7) });
  } catch (error) {
    debug('performSquash:noParent', { oldestHash: oldestHash.substring(0, 7), error: String(error) });
    throw new Error(`Cannot find parent of ${oldestHash} - is this the first commit?`);
  }
  
  const todoFile = join(tmpdir(), `git-rebase-todo-${Date.now()}`);
  const msgFile = join(tmpdir(), `git-commit-msg-${Date.now()}`);
  
  try {
    const todoContent = commits.map((c, i) => 
      `${i === 0 ? 'pick' : 'squash'} ${c.hash.substring(0, 7)} ${c.message}`
    ).join('\n') + '\n';
    
    debug('performSquash:todoContent', todoContent);
    debug('performSquash:message', message);
    
    await writeFile(todoFile, todoContent);
    await writeFile(msgFile, message);
    
    process.env.GIT_SEQUENCE_EDITOR = `cat ${todoFile} >`;
    process.env.GIT_EDITOR = `cat ${msgFile} >`;
    
    await git.rebase(['-i', parentHash]);
    
    const newHead = await git.revparse('HEAD');
    return newHead.trim();
    
  } catch (error) {
    await git.rebase(['--abort']).catch(() => {});
    throw new Error(`Rebase failed: ${error}`);
  } finally {
    delete process.env.GIT_SEQUENCE_EDITOR;
    delete process.env.GIT_EDITOR;
    await unlink(todoFile).catch(() => {});
    await unlink(msgFile).catch(() => {});
  }
}
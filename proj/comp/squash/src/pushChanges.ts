import { simpleGit } from 'simple-git';
import { debug } from './debug.js';

export async function pushChanges(force: boolean, cwd?: string): Promise<void> {
  const git = simpleGit(cwd);
  
  const status = await git.status();
  const currentBranch = status.current;
  
  debug('pushChanges:status', { currentBranch, tracking: status.tracking });
  
  if (!currentBranch) {
    throw new Error('Not on a branch');
  }
  
  const pushArgs = ['origin', currentBranch];
  if (force) {
    pushArgs.push('--force');
  } else {
    pushArgs.push('--force-with-lease');
  }
  
  await git.push(pushArgs);
}

export async function hasUnpushedCommits(cwd?: string): Promise<boolean> {
  const git = simpleGit(cwd);
  const status = await git.status();
  const currentBranch = status.current;
  
  if (!currentBranch) {
    return false;
  }
  
  try {
    const log = await git.log([`origin/${currentBranch}..HEAD`]);
    return log.total > 0;
  } catch {
    return true;
  }
}
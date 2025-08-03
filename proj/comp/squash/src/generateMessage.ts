import { GitCommit } from './types.js';
import { simpleGit } from 'simple-git';

export async function generateMessage(commits: GitCommit[], cwd?: string): Promise<string> {
  const git = simpleGit(cwd);
  const oldestDate = commits[0]?.date.split(' ')[0] || '';
  const newestDate = commits[commits.length - 1]?.date.split(' ')[0] || '';
  
  const filesSet = new Set<string>();
  
  for (const commit of commits) {
    const details = await git.show([
      '--name-only',
      '--pretty=format:',
      commit.hash
    ]);
    
    const files = details.split('\n').filter(f => f.trim());
    files.forEach(f => filesSet.add(f));
  }
  
  const filesList = Array.from(filesSet).sort();
  
  return `slupe-squash:: ${commits.length} commits (${oldestDate} to ${newestDate}): modified ${filesList.length} files\n${filesList.join('\n')}`;}
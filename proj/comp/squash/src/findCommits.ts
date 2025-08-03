import { GitCommit, SquashOptions } from './types.js';
import { simpleGit } from 'simple-git';
import { debug } from './debug.js';

export async function findCommits(options: SquashOptions, cwd?: string): Promise<GitCommit[]> {
  const git = simpleGit(cwd);
  
  debug('findCommits:options', options);
  
  const logOptions: string[] = [];
  if (options.after) {
    logOptions.push(`--after=${options.after}`);
  }
  
  const log = await git.log(logOptions);
  const commits = log.all;
  debug('findCommits:totalCommits', { count: commits.length, first5: commits.slice(0, 5).map(c => ({ hash: c.hash.substring(0, 7), message: c.message })) });
  
  const matching: GitCommit[] = [];
  let count = 0;
  
  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    if (options.limit && count >= options.limit) {
      debug('findCommits:limitReached', { limit: options.limit, count });
      break;
    }
    
    const matches = options.containing.length === 0 || 
      options.containing.some(pattern => 
        pattern === '' || commit.message.includes(pattern)
      );
    
    debug('findCommits:checkCommit', { 
      hash: commit.hash.substring(0, 7), 
      message: commit.message, 
      patterns: options.containing,
      matches 
    });
    
    if (!matches) {
      debug('findCommits:stoppedAtNonMatch', { hash: commit.hash.substring(0, 7) });
      break;
    }
    
    matching.push({
      hash: commit.hash,
      date: commit.date,
      message: commit.message,
      author_name: commit.author_name,
      author_email: commit.author_email
    });
    count++;
  }
  
  debug('findCommits:result', { 
    foundCount: matching.length, 
    commits: matching.map(c => ({ hash: c.hash.substring(0, 7), message: c.message }))
  });
  
  return matching.reverse();
}
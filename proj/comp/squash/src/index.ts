import { parseArgs } from './parseArgs.js';
import { findCommits } from './findCommits.js';
import { generateMessage } from './generateMessage.js';
import { performSquash } from './performSquash.js';
import { pushChanges, hasUnpushedCommits } from './pushChanges.js';
import { debug } from './debug.js';
import { simpleGit } from 'simple-git';

export async function squash(cwd?: string): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (!options) {
    return;
  }
  
  const workingDir = cwd || process.cwd();
  
  debug('squash:start', { workingDir, options });
  
  try {
    const commits = await findCommits(options, workingDir);
    
    if (commits.length === 0) {
      console.log(`No commits found matching pattern: "${options.containing.join('", "')}"`);
      console.log('To match all commits, use: --containing ""');
      return;
    }
    
    if (commits.length === 1) {
      console.log(`Only one commit found matching pattern: "${options.containing.join('", "')}"`);
      console.log('Nothing to squash - need at least 2 matching commits');
      console.log('To match all commits, use: --containing ""');
      return;
    }
    
    const git = simpleGit(workingDir);
    const allCommits = await git.log();
    if (commits.length === allCommits.total) {
      console.log('Cannot squash entire repository history - need at least one parent commit');
      return;
    }
    
    const message = options.message || await generateMessage(commits, workingDir);
    
    if (options.dryRun) {
      console.log('Dry run - would squash:');
      commits.forEach(c => console.log(`  ${c.hash.substring(0, 7)} ${c.message}`));
      console.log(`\nInto: ${message}`);
      if (options.push) {
        const unpushed = await hasUnpushedCommits(workingDir);
        console.log(`\nWould push: ${unpushed ? 'yes' : 'no unpushed commits'}`);
      }
      return;
    }
    
    console.log(`Squashing ${commits.length} commits...`);
    const newHash = await performSquash(commits, message, workingDir);
    console.log(`Created: ${newHash.substring(0, 7)} ${message}`);
    
    if (options.push) {
      console.log('Pushing changes...');
      await pushChanges(options.force || false, workingDir);
      console.log('Pushed successfully');
    }
    
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}
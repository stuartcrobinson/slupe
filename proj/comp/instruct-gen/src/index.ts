import { loadBaseInstructions } from './loader.js';
import { filterByAllowedTools } from './parser.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';


export async function updateInstructions(
  repoPath: string,
  allowedTools?: string[]
): Promise<void> {
  const base = await loadBaseInstructions();
  
  // If no allowedTools provided, read from config
  let toolsToUse = allowedTools;
  if (!toolsToUse) {
    const { loadConfig } = await import('../../config/src/index.js');
    const config = await loadConfig(repoPath);
    toolsToUse = config['allowed-actions'];
  }
  
  const filtered = filterByAllowedTools(base, toolsToUse);
  const outputPath = join(repoPath, 'NESL_INSTRUCTIONS.md');
  
  await writeFile(outputPath, filtered);
}
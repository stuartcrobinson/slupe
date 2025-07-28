import { loadBaseInstructions } from './loader';
import { filterByAllowedTools } from './parser';
import { writeFile } from 'fs/promises';
import { join } from 'path';


export async function updateInstructions(
  repoPath: string,
  allowedTools: string[]
): Promise<void> {
  const base = await loadBaseInstructions();
  const filtered = filterByAllowedTools(base, allowedTools);
  const outputPath = join(repoPath, 'NESL_INSTRUCTIONS.md');
  
  await writeFile(outputPath, filtered);
}
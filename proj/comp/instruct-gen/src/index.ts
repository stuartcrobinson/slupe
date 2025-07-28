import { loadBaseInstructions } from './loader.ts';
import { filterByAllowedTools } from './parser.ts';
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
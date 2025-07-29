import { writeFile } from 'fs/promises';

export interface OutputPaths {
  inputPath: string;
  outputPath: string;
}

export async function writeOutputs(
  paths: OutputPaths,
  summary: string,
  fullOutput: string,
  originalContent: string
): Promise<void> {
  await writeFile(paths.outputPath, fullOutput);
  
  const updatedContent = summary + '\n' + originalContent;
  await writeFile(paths.inputPath, updatedContent);
}
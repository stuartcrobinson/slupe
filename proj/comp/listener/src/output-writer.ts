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
  // console.log('DEBUG writeOutputs: Writing to outputPath:', paths.outputPath);
  await writeFile(paths.outputPath, fullOutput);
  
  const updatedContent = summary + '\n' + originalContent;
  // console.log('DEBUG writeOutputs: Writing to inputPath:', paths.inputPath);
  // console.log('DEBUG writeOutputs: Updated content preview:', updatedContent.substring(0, 100));
  await writeFile(paths.inputPath, updatedContent);
  // console.log('DEBUG writeOutputs: Both writes completed');
}
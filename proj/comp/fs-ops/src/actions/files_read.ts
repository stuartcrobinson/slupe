import type { SlupeAction } from '../../../nesl-action-parser/src/index';
import type { FileOpResult } from '../index';
import { readFile } from 'fs/promises';
import { formatNodeError } from '../utils';

export async function handle__files_read(action: SlupeAction): Promise<FileOpResult> {
  const { paths } = action.parameters;

  // Parse the multi-line paths string
  const pathList = paths
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0);  // Remove empty lines

  if (pathList.length === 0) {
    return {
      success: false,
      error: 'files_read: No paths provided'
    };
  }

  // Read all files, collecting content and errors
  const results: Array<{ path: string; content?: string; error?: string }> = [];

  for (const filePath of pathList) {
    try {
      const content = await readFile(filePath, 'utf8');
      results.push({ path: filePath, content });
    } catch (error: any) {
      // Collect error for this file
      const errorMsg = formatNodeError(error, filePath, 'open');
      results.push({ path: filePath, error: errorMsg });
    }
  }

  // Check if any files failed to read
  const failedFiles = results.filter(r => r.error);
  if (failedFiles.length > 0) {
    // Return error listing all failed files
    const errorDetails = failedFiles
      .map(f => `  ${f.path}: ${f.error}`)
      .join('\n');
    return {
      success: false,
      error: `files_read: Failed to read ${failedFiles.length} file(s):\n${errorDetails}`
    };
  }

  // All files read successfully - return contents as array
  const contents = results.map(r => r.content!);

  return {
    success: true,
    data: {
      paths: pathList,
      content: contents
    }
  };
}
import type { SlupeAction } from '../../../nesl-action-parser/src/index.js';
import type { FileOpResult } from '../index.js';
import { readFile } from 'fs/promises';
import { formatNodeError } from '../utils.js';

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

  // Separate successful and failed files
  const successfulFiles = results.filter(r => !r.error);
  const failedFiles = results.filter(r => r.error);

  // If all files failed, return error
  if (successfulFiles.length === 0 && failedFiles.length > 0) {
    const errorDetails = failedFiles
      .map(f => `  ${f.path}: ${f.error}`)
      .join('\n');
    return {
      success: false,
      error: `files_read: Failed to read all ${failedFiles.length} file(s):\n${errorDetails}`
    };
  }

  // Build data object with successful reads
  const data: any = {
    paths: successfulFiles.map(r => r.path),
    content: successfulFiles.map(r => r.content!)
  };

  // Add error information if there were any failures
  if (failedFiles.length > 0) {
    data.errors = failedFiles.map(f => ({
      path: f.path,
      error: f.error
    }));
  }

  return {
    success: true,
    data
  };
}
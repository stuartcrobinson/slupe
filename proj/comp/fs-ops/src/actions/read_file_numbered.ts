import type { SlupeAction } from '../../../nesl-action-parser/src/index.js';
import type { FileOpResult } from '../index.js';
import { readFile } from 'fs/promises';
import { formatNodeError } from '../utils.js';
import { extractNumberedLines } from '../extractNumberedLines.js';

export async function handle__read_file_numbered(action: SlupeAction): Promise<FileOpResult> {
  const { path, lines, delimiter = ": " } = action.parameters;

  try {
    const content = await readFile(path, 'utf8');

    // Extract and number the requested lines
    const { result, outOfRange } = extractNumberedLines(content, lines, delimiter);

    // If out of range, return error with partial content
    if (outOfRange) {
      return {
        success: false,
        error: `read_file_numbered: Requested lines ${outOfRange.requested} but file only has ${outOfRange.actual} lines`,
        data: {
          path,
          content: result
        }
      };
    }

    return {
      success: true,
      data: {
        path,
        content: result
      }
    };

  } catch (error: any) {
    // Check if it's our custom validation error
    if (error.message && error.message.startsWith('Invalid line')) {
      return {
        success: false,
        error: `read_file_numbered: ${error.message}`
      };
    }

    return {
      success: false,
      error: formatNodeError(error, path, 'open')
    };
  }
}
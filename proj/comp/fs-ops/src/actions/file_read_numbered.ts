import type { SlupeAction } from '../../../nesl-action-parser/src/index.ts';
import type { FileOpResult } from '../index.ts';
import { readFile } from 'fs/promises';
import { formatNodeError } from '../utils.ts';
import { extractNumberedLines } from '../extractNumberedLines.ts';

export async function handle__file_read_numbered(action: SlupeAction): Promise<FileOpResult> {
  const { path, lines, delimiter = ": " } = action.parameters;

  try {
    const content = await readFile(path, 'utf8');

    // Extract and number the requested lines
    const { result, outOfRange } = extractNumberedLines(content, lines, delimiter);

    // If out of range, return error with partial content
    if (outOfRange) {
      return {
        success: false,
        error: `file_read_numbered: Requested lines ${outOfRange.requested} but file only has ${outOfRange.actual} lines`,
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
        error: `file_read_numbered: ${error.message}`
      };
    }

    return {
      success: false,
      error: formatNodeError(error, path, 'open')
    };
  }
}
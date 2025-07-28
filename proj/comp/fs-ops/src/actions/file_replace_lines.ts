import type { SlupeAction } from '../../../nesl-action-parser/src/index.js';
import type { FileOpResult } from '../index.js';
import { readFile, writeFile } from 'fs/promises';
import { formatNodeError } from '../utils.js';

export async function handle__file_replace_lines(action: SlupeAction): Promise<FileOpResult> {
  const { path, lines, new_content } = action.parameters;

  try {
    // Read existing file content
    const content = await readFile(path, 'utf8');

    // Handle empty file edge case
    if (content === '') {
      return {
        success: false,
        error: `file_replace_lines: Line range ${lines} is out of bounds (file has 0 lines)`
      };
    }

    // Split into lines, preserving empty lines
    // Check if content ends with a newline
    const endsWithNewline = content.match(/\r?\n$/);
    const fileLines = content.split(/\r?\n|\r/);

    // If the file ends with a newline, split gives us an extra empty element
    // Remove it for line counting, but remember it existed
    if (endsWithNewline && fileLines[fileLines.length - 1] === '') {
      fileLines.pop();
    }

    const totalLines = fileLines.length;

    // Parse line specification
    let startLine: number;
    let endLine: number;

    if (!lines || lines === '') {
      return {
        success: false,
        error: `file_replace_lines: Invalid line specification '${lines}'`
      };
    }

    if (lines.includes('-')) {
      // Range format: "23-43"
      const parts = lines.split('-');
      if (parts.length !== 2) {
        return {
          success: false,
          error: `file_replace_lines: Invalid line specification '${lines}'`
        };
      }

      startLine = parseInt(parts[0], 10);
      endLine = parseInt(parts[1], 10);

      if (isNaN(startLine) || isNaN(endLine)) {
        return {
          success: false,
          error: `file_replace_lines: Invalid line specification '${lines}'`
        };
      }

      if (startLine < 1 || endLine < 1) {
        return {
          success: false,
          error: `file_replace_lines: Invalid line specification '${lines}'`
        };
      }

      if (startLine > endLine) {
        return {
          success: false,
          error: `file_replace_lines: Invalid line range '${lines}' (start must be <= end)`
        };
      }
    } else {
      // Single line format: "4"
      startLine = parseInt(lines, 10);
      if (isNaN(startLine) || startLine < 1) {
        return {
          success: false,
          error: `file_replace_lines: Invalid line specification '${lines}'`
        };
      }
      endLine = startLine;
    }

    // Check if lines are out of range
    if (startLine > totalLines || endLine > totalLines) {
      return {
        success: false,
        error: `file_replace_lines: Line range ${lines} is out of bounds (file has ${totalLines} lines)`
      };
    }

    // Split new content into lines
    // Empty content should produce one empty line, not zero lines
    const newLines = new_content.split(/\r?\n|\r/);

    // Reconstruct the file with replaced lines
    const resultLines: string[] = [];

    // Add lines before the replacement range
    for (let i = 0; i < startLine - 1; i++) {
      const line = fileLines[i];
      if (line !== undefined) {
        resultLines.push(line);
      }
    }

    // Add the new content
    resultLines.push(...newLines);

    // Add lines after the replacement range
    for (let i = endLine; i < totalLines; i++) {
      const line = fileLines[i];
      if (line !== undefined) {
        resultLines.push(line);
      }
    }

    // Join back with newlines
    let result = resultLines.join('\n');

    // If the original file ended with a newline, preserve it
    if (endsWithNewline) {
      result += '\n';
    }

    // Write the file back
    await writeFile(path, result, 'utf8');

    const linesReplaced = endLine - startLine + 1;

    return {
      success: true,
      data: {
        path,
        lines_replaced: linesReplaced
      }
    };

  } catch (error: any) {
    return {
      success: false,
      error: formatNodeError(error, path, 'open')
    };
  }
}
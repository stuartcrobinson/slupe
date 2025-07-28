import type { SlupeAction } from '../../../nesl-action-parser/src/index';
import type { FileOpResult } from '../index';
import { readFile, writeFile } from 'fs/promises';
import { formatNodeError } from '../utils';
import { replaceText } from '../replaceText';

export async function handle__file_replace_text(action: SlupeAction): Promise<FileOpResult> {
  const { path, old_text, new_text } = action.parameters;

  // Validate old_text is not empty
  if (!old_text || old_text.length === 0) {
    return {
      success: false,
      error: 'file_replace_text: old_text cannot be empty'
    };
  }

  try {
    // Read existing file content
    const content = await readFile(path, 'utf8');

    // Count occurrences first
    let count = 0;
    let searchIndex = 0;
    while (true) {
      const index = content.indexOf(old_text, searchIndex);
      if (index === -1) break;
      count++;
      searchIndex = index + old_text.length;
    }

    // Validate exactly one occurrence
    if (count === 0) {
      return {
        success: false,
        error: `file_replace_text: old_text not found in file`
      };
    }
    if (count > 1) {
      return {
        success: false,
        error: `file_replace_text: old_text appears ${count} times, must appear exactly once`
      };
    }

    // Replace the single occurrence
    const { result, replacements } = replaceText(content, old_text, new_text, 1);

    // Write updated content back
    await writeFile(path, result, 'utf8');

    return {
      success: true,
      data: {
        path,
        replacements
      }
    };

  } catch (error: any) {
    // Special case for empty old_text validation error
    if (error.message === 'old_text cannot be empty') {
      return {
        success: false,
        error: 'file_replace_text: old_text cannot be empty'
      };
    }

    return {
      success: false,
      error: formatNodeError(error, path, 'open')
    };
  }
}
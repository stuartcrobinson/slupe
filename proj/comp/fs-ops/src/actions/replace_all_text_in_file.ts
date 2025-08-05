import type { SlupeAction } from '../../../nesl-action-parser/src/index.js';
import type { FileOpResult } from '../index.js';
import { readFile, writeFile } from 'fs/promises';
import { formatNodeError } from '../utils.js';
import { replaceText } from '../replaceText.js';

export async function handle__replace_all_text_in_file(action: SlupeAction): Promise<FileOpResult> {
  const { path, old_text, new_text, count } = action.parameters;

  // Validate old_text is not empty
  if (!old_text || old_text.length === 0) {
    return {
      success: false,
      error: 'replace_all_text_in_file: old_text cannot be empty'
    };
  }

  try {
    // Read existing file content
    const content = await readFile(path, 'utf8');

    // If count specified, validate it matches actual occurrences
    if (count !== undefined) {
      // Count actual occurrences
      let actualCount = 0;
      let searchIndex = 0;
      while (true) {
        const index = content.indexOf(old_text, searchIndex);
        if (index === -1) break;
        actualCount++;
        searchIndex = index + old_text.length;
      }

      if (actualCount !== count) {
        return {
          success: false,
          error: `replace_all_text_in_file: expected ${count} occurrences but found ${actualCount}`
        };
      }
    }

    // Replace all occurrences
    const { result, replacements } = replaceText(content, old_text, new_text);

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
        error: 'replace_all_text_in_file: old_text cannot be empty'
      };
    }

    return {
      success: false,
      error: formatNodeError(error, path, 'open')
    };
  }
}
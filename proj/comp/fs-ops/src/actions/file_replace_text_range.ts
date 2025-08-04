import type { SlupeAction } from '../../../nesl-action-parser/src/index.js';
import type { FileOpResult } from '../index.js';
import { readFile, writeFile } from 'fs/promises';
import { formatNodeError } from '../utils.js';

export async function handle__file_replace_text_range(action: SlupeAction): Promise<FileOpResult> {
  const { path, old_text_beginning, old_text_end, new_text } = action.parameters;

  // Validate markers are not empty
  if (!old_text_beginning || old_text_beginning.length === 0) {
    return {
      success: false,
      error: 'file_replace_text_range: old_text_beginning cannot be empty'
    };
  }

  if (!old_text_end || old_text_end.length === 0) {
    return {
      success: false,
      error: 'file_replace_text_range: old_text_end cannot be empty'
    };
  }

  try {
    // Read existing file content
    const content = await readFile(path, 'utf8');

    // Find the first occurrence of the start marker
    const startIndex = content.indexOf(old_text_beginning);
    if (startIndex === -1) {
      return {
        success: false,
        error: 'file_replace_text_range: old_text_beginning not found in file'
      };
    }

    // Check if there are multiple occurrences of the start marker
    const secondStartIndex = content.indexOf(old_text_beginning, startIndex + 1);
    if (secondStartIndex !== -1) {
      // Count total occurrences
      let count = 1;
      let searchIndex = startIndex + 1;
      while (true) {
        const index = content.indexOf(old_text_beginning, searchIndex);
        if (index === -1) break;
        count++;
        searchIndex = index + 1;
      }
      return {
        success: false,
        error: `file_replace_text_range: old_text_beginning appears ${count} times, must appear exactly once`
      };
    }

    // Find the first occurrence of the end marker after the end of the start marker
    const endIndex = content.indexOf(old_text_end, startIndex + old_text_beginning.length);
    if (endIndex === -1) {
      return {
        success: false,
        error: 'file_replace_text_range: old_text_end not found after old_text_beginning'
      };
    }

    // Check if there are multiple occurrences of the end marker after the start
    const endSearchStart = endIndex + old_text_end.length;
    const secondEndIndex = content.indexOf(old_text_end, endSearchStart);
    if (secondEndIndex !== -1) {
      // Count occurrences after the start marker
      let count = 1;
      let searchIndex = endSearchStart;
      while (true) {
        const index = content.indexOf(old_text_end, searchIndex);
        if (index === -1) break;
        count++;
        searchIndex = index + old_text_end.length;
      }
      return {
        success: false,
        error: `file_replace_text_range: old_text_end appears ${count} times after old_text_beginning, must appear exactly once`
      };
    }

    // Calculate replacement positions
    const replaceFrom = startIndex;
    const replaceTo = endIndex + old_text_end.length;

    // Perform replacement
    const newContent = content.slice(0, replaceFrom) + new_text + content.slice(replaceTo);

    // Write updated content back
    await writeFile(path, newContent, 'utf8');

    return {
      success: true,
      data: {
        path,
        replacements: 1
      }
    };

  } catch (error: any) {
    return {
      success: false,
      error: formatNodeError(error, path, 'open')
    };
  }
}
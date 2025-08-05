import type { SlupeAction } from '../../../nesl-action-parser/src/index.js';
import type { FileOpResult } from '../index.js';
import { rename, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { formatNodeError, fileExists } from '../utils.js';

export async function handle__move_file(action: SlupeAction): Promise<FileOpResult> {
  const { old_path, new_path } = action.parameters;

  try {
    // Pre-flight check for better error messages
    const sourceExists = await fileExists(old_path);

    if (!sourceExists) {
      return {
        success: false,
        error: `move_file: Source file not found '${old_path}' (ENOENT)`
      };
    }

    // Check if destination exists (for overwrote flag)
    const destExists = await fileExists(new_path);

    // Create parent directories for destination
    const parentDir = dirname(new_path);
    await mkdir(parentDir, { recursive: true });

    // Move the file
    await rename(old_path, new_path);

    const result: FileOpResult = {
      success: true,
      data: {
        old_path,
        new_path
      }
    };

    if (destExists) {
      result.data.overwrote = true;
    }

    return result;

  } catch (error: any) {
    return {
      success: false,
      error: formatNodeError(error, old_path, 'rename', new_path)
    };
  }
}
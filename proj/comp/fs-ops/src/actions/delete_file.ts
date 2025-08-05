import type { SlupeAction } from '../../../nesl-action-parser/src/index.js';
import type { FileOpResult } from '../index.js';
import { unlink } from 'fs/promises';
import { formatNodeError } from '../utils.js';

export async function handle__delete_file(action: SlupeAction): Promise<FileOpResult> {
  const { path } = action.parameters;

  try {
    await unlink(path);

    return {
      success: true,
      data: {
        path
      }
    };

  } catch (error: any) {
    return {
      success: false,
      error: formatNodeError(error, path, 'unlink')
    };
  }
}
import type { SlupeAction } from '../../../nesl-action-parser/src/index.ts';
import type { FileOpResult } from '../index.ts';
import { unlink } from 'fs/promises';
import { formatNodeError } from '../utils.ts';

export async function handle__file_delete(action: SlupeAction): Promise<FileOpResult> {
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
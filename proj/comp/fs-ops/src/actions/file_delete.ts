import type { SlupeAction } from '../../../nesl-action-parser/src/index';
import type { FileOpResult } from '../index';
import { unlink } from 'fs/promises';
import { formatNodeError } from '../utils';

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
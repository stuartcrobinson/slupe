import type { SlupeAction } from '../../../nesl-action-parser/src/index.js';

import type { FileOpResult } from '../index.js';
import { readFile } from 'fs/promises';
import { formatNodeError } from '../utils.js';

export async function handle__file_read(action: SlupeAction): Promise<FileOpResult> {
  const { path } = action.parameters;

  try {
    const content = await readFile(path, 'utf8');

    return {
      success: true,
      data: {
        path,
        content
      }
    };

  } catch (error: any) {
    return {
      success: false,
      error: formatNodeError(error, path, 'open')
    };
  }
}
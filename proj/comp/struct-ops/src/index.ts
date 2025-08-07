import type { SlupeAction } from '../../nesl-action-parser/src/index.js';
import type { FileOpResult } from '../../fs-ops/src/index.js';

export class StructOpsExecutor {
  async execute(action: SlupeAction): Promise<FileOpResult> {
    // Router for structure operations
    throw new Error('Not implemented');
  }
}
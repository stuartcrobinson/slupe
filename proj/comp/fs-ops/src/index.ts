/**
 * fs-ops - File system operations executor for slupe
 * 
 * Handles all file and directory operations from parsed NESL actions
 */

import type { SlupeAction } from '../../nesl-action-parser/src/index';
import type { FsGuard } from '../../fs-guard/src/index';

// Import all implemented action handlers
import { handle__file_write } from './actions/file_write';
import { handle__file_read } from './actions/file_read';
import { handle__file_read_numbered } from './actions/file_read_numbered';
import { handle__file_replace_text } from './actions/file_replace_text';
import { handle__file_replace_all_text } from './actions/file_replace_all_text';
import { handle__file_replace_lines } from './actions/file_replace_lines';
import { handle__file_delete } from './actions/file_delete';
import { handle__file_move } from './actions/file_move';
import { handle__files_read } from './actions/files_read';

export interface FileOpResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class FileOpError extends Error {
  constructor(
    message: string,
    public code: string,
    public path?: string,
    public operation?: string
  ) {
    super(message);
    this.name = 'FileOpError';
  }
}

// Actions that are specified but not yet implemented
const NOT_IMPLEMENTED = new Set([
  'dir_create',
  'dir_delete',
  'ls',
  'grep',
  'glob',
  'file_replace_text_range',
  'file_append',
  'exec',
  'context_add',
  'context_remove',
  'context_list',
  'context_prune',
  'context_clear',
  'git_squash',
  'undo',
  'git_step_back',
  'git_step_forward',
  'files_replace_all_text',
  'files_replace_text_in_parents'
]);

/**
 * File system operations executor with security guard
 */
export class FsOpsExecutor {
  private handlers: Map<string, (action: SlupeAction) => Promise<FileOpResult>>;

  constructor(private guard: FsGuard) {
    this.handlers = new Map([
      ['file_write', handle__file_write],
      ['file_read', handle__file_read],
      ['file_read_numbered', handle__file_read_numbered],
      ['file_replace_text', handle__file_replace_text],
      ['file_replace_all_text', handle__file_replace_all_text],
      ['file_replace_lines', handle__file_replace_lines],
      ['file_delete', handle__file_delete],
      ['file_move', handle__file_move],
      ['files_read', handle__files_read]
    ]);
  }

  /**
   * Execute a file system operation with guard checks
   */
  async execute(action: SlupeAction): Promise<FileOpResult> {
    try {
      // Check fs-guard permissions first
      const guardResult = await this.guard.check(action);
      if (!guardResult.allowed) {
        return {
          success: false,
          error: `fs-guard violation: ${guardResult.reason}`
        };
      }

      const handler = this.handlers.get(action.action);
      if (!handler) {
        // Check if it's a known but not implemented action
        if (NOT_IMPLEMENTED.has(action.action)) {
          return {
            success: false,
            error: `Action not yet implemented: ${action.action}`
          };
        }
        // Truly unknown action
        return {
          success: false,
          error: `Unknown action: ${action.action}`
        };
      }

      return await handler(action);
    } catch (error: any) {
      // This should never happen - handlers should catch their own errors
      return {
        success: false,
        error: `Unexpected error in execute: ${error.message}`
      };
    }
  }
}

/**
 * Legacy function export for backward compatibility
 * @deprecated Use FsOpsExecutor class instead
 */
export async function executeFileOperation(_action: SlupeAction): Promise<FileOpResult> {
  throw new Error('Direct function call deprecated. Use FsOpsExecutor class.');
}
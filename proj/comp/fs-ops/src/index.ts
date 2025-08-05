/**
 * fs-ops - File system operations executor for slupe
 * 
 * Handles all file and directory operations from parsed NESL actions
 */

import type { SlupeAction } from '../../nesl-action-parser/src/index.js';
import type { FsGuard } from '../../fs-guard/src/index.js';

// Import all implemented action handlers
import { handle__file_write } from './actions/file_write.js';
import { handle__file_read } from './actions/file_read.js';
import { handle__file_read_numbered } from './actions/file_read_numbered.js';
import { handle__file_replace_text } from './actions/file_replace_text.js';
import { handle__file_replace_all_text } from './actions/file_replace_all_text.js';
import { handle__file_replace_lines } from './actions/file_replace_lines.js';
import { handle__file_delete } from './actions/file_delete.js';
import { handle__file_move } from './actions/file_move.js';
import { handle__files_read } from './actions/files_read.js';
import { handle__file_replace_text_range } from './actions/file_replace_text_range.js';
import { handle__file_append } from './actions/file_append.js';

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

const debug = false;
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
      ['files_read', handle__files_read],
      ['file_replace_text_range', handle__file_replace_text_range],
      ['file_append', handle__file_append]
    ]);
  }

  /**
   * Execute a file system operation with guard checks
   */
  async execute(action: SlupeAction): Promise<FileOpResult> {
    try {
      // Check fs-guard permissions first
      debug&&console.time('guard-check');
      const guardResult = await this.guard.check(action);
      debug&&console.timeEnd('guard-check');
      
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

      debug&&console.time('handler-execute');
      const result = await handler(action);
      debug&&console.timeEnd('handler-execute');
      return result;
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
/**
 * fs-ops - File system operations executor for slupe
 * 
 * Handles all file and directory operations from parsed NESL actions
 */

import type { SlupeAction } from '../../nesl-action-parser/src/index.js';
import type { FsGuard } from '../../fs-guard/src/index.js';

// Import all implemented action handlers
import { handle__write_file } from './actions/write_file.js';
import { handle__read_file } from './actions/read_file.js';
import { handle__read_file_numbered } from './actions/read_file_numbered.js';
import { handle__replace_text_in_file } from './actions/replace_text_in_file.js';
import { handle__replace_all_text_in_file } from './actions/replace_all_text_in_file.js';
import { handle__replace_lines_in_file } from './actions/replace_lines_in_file.js';
import { handle__delete_file } from './actions/delete_file.js';
import { handle__move_file } from './actions/move_file.js';
import { handle__read_files } from './actions/read_files.js';
import { handle__replace_text_range_in_file } from './actions/replace_text_range_in_file.js';
import { handle__append_to_file } from './actions/append_to_file.js';

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
      ['write_file', handle__write_file],
      ['read_file', handle__read_file],
      ['read_file_numbered', handle__read_file_numbered],
      ['replace_text_in_file', handle__replace_text_in_file],
      ['replace_all_text_in_file', handle__replace_all_text_in_file],
      ['replace_lines_in_file', handle__replace_lines_in_file],
      ['delete_file', handle__delete_file],
      ['move_file', handle__move_file],
      ['read_files', handle__read_files],
      ['replace_text_range_in_file', handle__replace_text_range_in_file],
      ['append_to_file', handle__append_to_file]
    ]);
  }

  /**
   * Execute a file system operation with guard checks
   */
  async execute(action: SlupeAction): Promise<FileOpResult> {
    try {
      // Check fs-guard permissions first
      debug && console.time('guard-check');
      const guardResult = await this.guard.check(action);
      debug && console.timeEnd('guard-check');

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

      debug && console.time('handler-execute');
      const result = await handler(action);
      debug && console.timeEnd('handler-execute');
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
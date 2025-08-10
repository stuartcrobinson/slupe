import type { SlupeAction } from '../../nesl-action-parser/src/index.js';
import type { FsGuard } from '../../fs-guard/src/index.js';
import { FsIo } from '../../fs-io/src/index.js';
import { rename } from 'fs/promises';

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

export class FsOpsExecutor {
  private fsIo: FsIo;

  constructor(private guard: FsGuard) {
    this.fsIo = new FsIo(guard);
  }

  async execute(action: SlupeAction): Promise<FileOpResult> {
    try {
      if (NOT_IMPLEMENTED.has(action.action)) {
        return {
          success: false,
          error: `Action not yet implemented: ${action.action}`
        };
      }

      const handler = (this as any)[`handle_${action.action}`];
      if (!handler) {
        return {
          success: false,
          error: `Unknown action: ${action.action}`
        };
      }

      return handler.call(this, action);
    } catch (error: any) {
      return {
        success: false,
        error: `Unexpected error in execute: ${error.message}`
      };
    }
  }

  private async handle_write_file(action: SlupeAction): Promise<FileOpResult> {
    const { path, content } = action.parameters;
    if (!path || content === undefined) {
      return {
        success: false,
        error: 'Missing required parameters: path and content'
      };
    }
    
    const result = await this.fsIo.write(path, content);
    return {
      success: result.success,
      data: result.data,
      error: result.error
    };
  }

  private async handle_read_file(action: SlupeAction): Promise<FileOpResult> {
    const { path } = action.parameters;
    if (!path) {
      return {
        success: false,
        error: 'Missing required parameter: path'
      };
    }
    
    const result = await this.fsIo.read(path);
    if (result.success && result.data) {
      return {
        success: true,
        data: result.data.content
      };
    }
    return result;
  }

  private async handle_read_file_numbered(action: SlupeAction): Promise<FileOpResult> {
    const { path } = action.parameters;
    if (!path) {
      return {
        success: false,
        error: 'Missing required parameter: path'
      };
    }

    const result = await this.fsIo.read(path);
    if (!result.success) return result;

    const lines = result.data.content.split('\n');
    const maxLineNumWidth = lines.length.toString().length;
    const numberedLines = lines.map((line: string, i: number) => {
      const lineNum = (i + 1).toString().padStart(maxLineNumWidth, ' ');
      return `${lineNum} | ${line}`;
    });

    return {
      success: true,
      data: numberedLines.join('\n')
    };
  }

  private async handle_delete_file(action: SlupeAction): Promise<FileOpResult> {
    const { path } = action.parameters;
    if (!path) {
      return {
        success: false,
        error: 'Missing required parameter: path'
      };
    }
    
    const result = await this.fsIo.delete(path);
    return {
      success: result.success,
      error: result.error
    };
  }

  private async handle_append_to_file(action: SlupeAction): Promise<FileOpResult> {
    const { path, content } = action.parameters;
    if (!path || content === undefined) {
      return {
        success: false,
        error: 'Missing required parameters: path and content'
      };
    }
    
    const result = await this.fsIo.append(path, content);
    return {
      success: result.success,
      data: result.data,
      error: result.error
    };
  }

  private async handle_move_file(action: SlupeAction): Promise<FileOpResult> {
    const { old_path, new_path } = action.parameters;
    if (!old_path || !new_path) {
      return {
        success: false,
        error: 'Missing required parameters: old_path and new_path'
      };
    }

    const readCheck = await this.guard.checkPath(old_path, 'read');
    if (!readCheck.allowed) {
      return {
        success: false,
        error: readCheck.reason || 'Read access denied'
      };
    }

    const writeCheck = await this.guard.checkPath(new_path, 'write');
    if (!writeCheck.allowed) {
      return {
        success: false,
        error: writeCheck.reason || 'Write access denied'
      };
    }

    try {
      await rename(old_path, new_path);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to move file: ${error.message}`
      };
    }
  }

  private async handle_read_files(action: SlupeAction): Promise<FileOpResult> {
    const { paths } = action.parameters;
    if (!paths) {
      return {
        success: false,
        error: 'Missing required parameter: paths'
      };
    }

    const pathList = paths.split('\n').map((p: string) => p.trim()).filter((p: string) => p);
    const results: Record<string, string | { error: string }> = {};

    for (const path of pathList) {
      const result = await this.fsIo.read(path);
      if (result.success && result.data) {
        results[path] = result.data.content;
      } else {
        results[path] = { error: result.error || 'Unknown error' };
      }
    }

    return {
      success: true,
      data: results
    };
  }

  private async handle_replace_text_in_file(action: SlupeAction): Promise<FileOpResult> {
    const { path, old_text, new_text } = action.parameters;
    if (!path || old_text === undefined || new_text === undefined) {
      return {
        success: false,
        error: 'Missing required parameters: path, old_text, and new_text'
      };
    }

    const readResult = await this.fsIo.read(path);
    if (!readResult.success) return readResult;

    const content = readResult.data.content;
    const occurrences = content.split(old_text).length - 1;

    if (occurrences === 0) {
      return {
        success: false,
        error: `Text not found in file: ${path}`
      };
    }

    if (occurrences > 1) {
      return {
        success: false,
        error: `Multiple occurrences (${occurrences}) found. Use replace_all_text_in_file instead`
      };
    }

    const newContent = content.replace(old_text, new_text);
    const writeResult = await this.fsIo.write(path, newContent);
    return {
      success: writeResult.success,
      data: writeResult.data,
      error: writeResult.error
    };
  }

  private async handle_replace_all_text_in_file(action: SlupeAction): Promise<FileOpResult> {
    const { path, old_text, new_text, count } = action.parameters;
    if (!path || old_text === undefined || new_text === undefined) {
      return {
        success: false,
        error: 'Missing required parameters: path, old_text, and new_text'
      };
    }

    const readResult = await this.fsIo.read(path);
    if (!readResult.success) return readResult;

    const content = readResult.data.content;
    const occurrences = content.split(old_text).length - 1;

    if (occurrences === 0) {
      return {
        success: false,
        error: `Text not found in file: ${path}`
      };
    }

    let newContent: string;
    if (count !== undefined) {
      const maxReplacements = parseInt(count, 10);
      if (isNaN(maxReplacements)) {
        return {
          success: false,
          error: `Invalid count parameter: ${count}`
        };
      }

      let replacedCount = 0;
      newContent = content.replace(new RegExp(escapeRegex(old_text), 'g'), (match: string) => {
        if (replacedCount < maxReplacements) {
          replacedCount++;
          return new_text;
        }
        return match;
      });
    } else {
      newContent = content.split(old_text).join(new_text);
    }

    const writeResult = await this.fsIo.write(path, newContent);
    return {
      success: writeResult.success,
      data: writeResult.data,
      error: writeResult.error
    };
  }

  private async handle_replace_text_range_in_file(action: SlupeAction): Promise<FileOpResult> {
    const { path, old_text_beginning, old_text_end, new_text } = action.parameters;
    if (!path || !old_text_beginning || !old_text_end || new_text === undefined) {
      return {
        success: false,
        error: 'Missing required parameters'
      };
    }

    const readResult = await this.fsIo.read(path);
    if (!readResult.success) return readResult;

    const content = readResult.data.content;
    const startIndex = content.indexOf(old_text_beginning);
    if (startIndex === -1) {
      return {
        success: false,
        error: 'Beginning text not found in file'
      };
    }

    const endIndex = content.indexOf(old_text_end, startIndex);
    if (endIndex === -1) {
      return {
        success: false,
        error: 'End text not found after beginning text'
      };
    }

    const actualEndIndex = endIndex + old_text_end.length;
    const newContent = content.slice(0, startIndex) + new_text + content.slice(actualEndIndex);

    const writeResult = await this.fsIo.write(path, newContent);
    return {
      success: writeResult.success,
      data: writeResult.data,
      error: writeResult.error
    };
  }

  private async handle_replace_lines_in_file(action: SlupeAction): Promise<FileOpResult> {
    const { path, start_line, end_line, new_text } = action.parameters;
    if (!path || !start_line || !end_line || new_text === undefined) {
      return {
        success: false,
        error: 'Missing required parameters'
      };
    }

    const startLineNum = parseInt(start_line, 10);
    const endLineNum = parseInt(end_line, 10);

    if (isNaN(startLineNum) || isNaN(endLineNum)) {
      return {
        success: false,
        error: 'Invalid line numbers'
      };
    }

    if (startLineNum < 1 || endLineNum < startLineNum) {
      return {
        success: false,
        error: 'Invalid line range'
      };
    }

    const readResult = await this.fsIo.read(path);
    if (!readResult.success) return readResult;

    const lines = readResult.data.content.split('\n');

    if (endLineNum > lines.length) {
      return {
        success: false,
        error: `End line ${endLineNum} exceeds file length ${lines.length}`
      };
    }

    const newLines = [
      ...lines.slice(0, startLineNum - 1),
      new_text,
      ...lines.slice(endLineNum)
    ];

    const writeResult = await this.fsIo.write(path, newLines.join('\n'));
    return {
      success: writeResult.success,
      data: writeResult.data,
      error: writeResult.error
    };
  }
}

export async function executeFileOperation(_action: SlupeAction): Promise<FileOpResult> {
  throw new Error('Direct function call deprecated. Use FsOpsExecutor class.');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
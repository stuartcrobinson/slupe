import type { SlupeAction } from '../../nesl-action-parser/src/index.ts';
import type { FileOpResult } from '../../fs-ops/src/index.ts';
import { executeCommand } from './executeCommand.ts';

/**
 * Executor for shell/code execution operations
 */
export class ExecExecutor {
  constructor(/* future: execGuard */) { }

  async execute(action: SlupeAction): Promise<FileOpResult> {
    if (action.action !== 'exec') {
      return {
        success: false,
        error: `ExecExecutor only handles 'exec' action, got: ${action.action}`
      };
    }

    const execResult = await executeCommand(action);

    // Transform ExecResult to FileOpResult with fields orchestrator expects
    return {
      success: execResult.success,
      error: execResult.error,
      // Place stdout/stderr/exit_code at top level where orchestrator looks for them
      stdout: execResult.stdout,
      stderr: execResult.stderr,
      exit_code: execResult.exit_code
    } as any;
  }
}
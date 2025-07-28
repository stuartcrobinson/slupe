import type { ExecResult } from './types';

/**
 * Formats raw process execution results into standardized ExecResult
 * @param exitCode - Process exit code, null if process didn't exit normally
 * @param stdout - Captured standard output
 * @param stderr - Captured standard error
 * @param error - Error object if execution failed before process exit
 * @returns Formatted result with success based on exit code 0
 */
export function formatExecResult(
  exitCode: number | null,
  stdout: string,
  stderr: string,
  error?: Error
): ExecResult {
  // Error takes precedence - process didn't run or was killed
  if (error) {
    return {
      success: false,
      stdout: stdout || '',
      stderr: stderr || '',
      error: error.message,
      // Include exit code if available from error metadata
      ...(exitCode !== null && { exit_code: exitCode })
    };
  }
  
  // Normal process completion
  if (exitCode !== null) {
    return {
      success: exitCode === 0,
      stdout,
      stderr,
      exit_code: exitCode
    };
  }
  
  // Shouldn't reach here, but handle gracefully
  return {
    success: false,
    stdout,
    stderr,
    error: 'Unknown execution state'
  };
}
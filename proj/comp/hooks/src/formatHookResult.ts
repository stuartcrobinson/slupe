import type { CommandResult, HookResult } from './types.ts';

/**
 * Formats array of command results into a HookResult
 * Overall success is true only if all commands succeeded
 * Collects errors from failed commands
 */
export function formatHookResult(results: CommandResult[]): HookResult {
  const errors: Array<{ command: string; error: string }> = [];
  let allSuccess = true;

  for (const result of results) {
    if (!result.success) {
      allSuccess = false;
      errors.push({
        command: result.command,
        error: result.error || 'Command failed'
      });
    }
  }

  return {
    success: allSuccess,
    executed: results.length,
    ...(errors.length > 0 && { errors })
  };
}
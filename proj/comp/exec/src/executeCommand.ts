import { spawn } from 'child_process';
import type { ExecResult } from './types.js';
import { ExecError } from './types.js';
import { mapLanguageToCommand } from './mapLanguageToCommand.js';
import { buildSpawnOptions } from './buildSpawnOptions.js';
import { formatExecResult } from './formatExecResult.js';

/**
 * Executes code from parsed NESL action in specified language
 * @param action - SlupeAction with exec action and parameters
 * @returns ExecResult with success status, output, and exit code
 * Never throws - all errors captured in result
 */
export async function executeCommand(action: any): Promise<ExecResult> {
  try {
    // Validate action structure
    if (!action?.parameters?.lang || !action?.parameters?.code === undefined) {
      return formatExecResult(null, '', '',
        new Error('Invalid action: missing lang or code parameter'));
    }

    const { lang, code, cwd, timeout } = action.parameters;

    // Map language to command (may throw)
    const { command, args } = mapLanguageToCommand(lang, code);

    // Build spawn options with validated cwd (may throw)
    const options = await buildSpawnOptions(cwd);

    // Execute command and capture results
    return await runProcess(command, args, options, timeout);

  } catch (error) {
    // Convert exceptions to ExecResult format
    if (error instanceof ExecError) {
      return formatExecResult(null, '', '', error);
    }
    return formatExecResult(null, '', '',
      error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Spawns child process and captures output with timeout handling
 * @param command - Interpreter command to run
 * @param args - Arguments for the command
 * @param options - Spawn options including cwd and timeout
 * @returns ExecResult with captured output and exit code
 */
async function runProcess(
  command: string,
  args: string[],
  options: any,
  timeout?: number
): Promise<ExecResult> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let timeoutId: NodeJS.Timeout | null = null;

    const child = spawn(command, args, options);

    // Set up timeout (default 30s)
    const TIMEOUT_MS = timeout || 30000;
    timeoutId = setTimeout(() => {
      timedOut = true;
      // Kill entire process group if detached
      const pid = child.pid;
      if (pid && options.detached) {
        try {
          process.kill(-pid, 'SIGTERM'); // Negative PID kills the group
        } catch (e) {
          // Fallback to regular kill if group kill fails
          child.kill('SIGTERM');
        }
      } else {
        child.kill('SIGTERM');
      }
      // Grace period before SIGKILL
      setTimeout(() => {
        if (!child.killed) {
          if (pid && options.detached) {
            try {
              process.kill(-pid, 'SIGKILL');
            } catch (e) {
              child.kill('SIGKILL');
            }
          } else {
            child.kill('SIGKILL');
          }
        }
      }, 100); // 100ms grace - balance between speed and cleanup
    }, TIMEOUT_MS);

    // Capture output streams
    child.stdout?.on('data', (data) => {
      stdout += data.toString();
      // TODO: Implement size limit truncation
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
      // TODO: Implement size limit truncation
    });

    // Handle process completion
    child.on('close', (code, signal) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (timedOut) {
        resolve(formatExecResult(null, stdout, stderr,
          new Error(`exec: Process timeout after ${TIMEOUT_MS / 1000}s (TIMEOUT)`)));
      } else if (code !== null) {
        resolve(formatExecResult(code, stdout, stderr));
      } else if (signal) {
        resolve(formatExecResult(null, stdout, stderr,
          new Error(`Process killed by signal ${signal}`)));
      }
    });

    // Handle spawn errors (command not found, etc)
    child.on('error', (error) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Preserve original error details while including any captured output
      const errorMessage = (error as any).code === 'ENOENT'
        ? `exec: ${command} not found in PATH (ENOENT)`
        : `exec: ${error.message} (${(error as any).code || 'UNKNOWN'})`;

      resolve(formatExecResult(null, stdout, stderr, new Error(errorMessage)));
    });


  });
}
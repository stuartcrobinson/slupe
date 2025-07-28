import type { SpawnOptions } from 'child_process';
import { access } from 'fs/promises';
import { constants } from 'fs';
import { resolve } from 'path';
import { ExecError } from './types';

/**
 * Builds spawn options for child process with validated working directory
 * @param cwd - Optional working directory (resolved to absolute path)
 * @returns SpawnOptions with timeout, environment, and validated cwd
 * @throws ExecError if working directory doesn't exist
 */
export async function buildSpawnOptions(cwd?: string): Promise<SpawnOptions> {
  const options: SpawnOptions = {
    env: process.env,
    shell: false,
    windowsHide: true,
    detached: process.platform !== 'win32' // Enable process groups on Unix
  };
  
  // Set and validate working directory
  if (cwd) {
    const absoluteCwd = resolve(cwd);
    try {
      await access(absoluteCwd, constants.F_OK);
      options.cwd = absoluteCwd;
    } catch (err) {
      throw new ExecError(
        `exec: Working directory does not exist '${absoluteCwd}' (ENOENT)`,
        'CWD_INVALID',
        { cwd: absoluteCwd, originalError: err }
      );
    }
  } else {
    options.cwd = process.cwd();
  }
  
  return options;
}
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { DEFAULT_SLUPE_YAML } from './base-slupe.yml-defaults';

/**
 * Creates a starter slupe.yml file if it doesn't exist
 * @returns true if file was created, false if already exists
 */
export async function createStarterConfig(repoPath: string): Promise<boolean> {
  const configPath = join(repoPath, 'slupe.yml');

  try {
    await writeFile(configPath, DEFAULT_SLUPE_YAML, { flag: 'wx' });
    return true;
  } catch (error: any) {
    if (error.code === 'EEXIST') {
      return false;
    }
    throw error;
  }
}
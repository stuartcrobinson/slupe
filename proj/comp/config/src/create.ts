import { writeFile } from 'fs/promises';
import { join } from 'path';
import { DEFAULT_SLUPE_YAML } from './base-slupe.yml-defaults.js';

/**
 * Creates a starter slupe.yml file if it doesn't exist
 * @returns true if file was created, false if already exists
 */
export async function createStarterConfig(repoPath: string): Promise<boolean> {
  const configPath = join(repoPath, 'slupe.yml');
  
  let configContent = DEFAULT_SLUPE_YAML;
  
  // Remove exec action for production users (keep it only for tests)
  const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  
  if (!isTest) {
    configContent = configContent.replace(/^  - exec\n/m, '');
  }

  try {
    await writeFile(configPath, configContent, { flag: 'wx' });
    return true;
  } catch (error: any) {
    if (error.code === 'EEXIST') {
      return false;
    }
    throw error;
  }
}
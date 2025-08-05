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
    configContent = configContent.replace(/^  - file_read_numbered\n/m, '');

    // Find hooks section and uncomment all lines within it
    const lines = configContent.split('\n');
    const hooksIndex = lines.findIndex(line => /^hooks:\s*$/.test(line));

    if (hooksIndex !== -1) {
      let i = hooksIndex + 1;

      // Process lines until we hit a blank line, non-indented line, or EOF
      while (i < lines.length) {
        const line = lines[i];
        if (!line || line.trim() === '' || !line.startsWith(' ')) {
          break;
        }
        // Remove '# ' from start of line, preserving indentation
        lines[i] = line.replace(/^(\s*)#\s?/, '$1');
        i++;
      }

      configContent = lines.join('\n');
    }
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
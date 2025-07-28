import { readFile } from 'fs/promises';
import { join } from 'path';
import { load as loadYaml } from 'js-yaml';
import type { SlupeConfig } from './types.js';
import { validateConfig } from './validate.js';
import { createStarterConfig } from './create.js';
import { DEFAULT_SLUPE_YAML } from './base-slupe.yml-defaults.js';

export async function loadConfig(repoPath: string): Promise<SlupeConfig> {
  const configPath = join(repoPath, 'slupe.yml');

  try {
    const content = await readFile(configPath, 'utf8');
    const config = loadYaml(content) as SlupeConfig;

    // Validate config structure
    const validation = validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid config: ${validation.error}`);
    }

    // Keep patterns as-is, resolution happens in FsGuard
    return config;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Create the config file
      await createStarterConfig(repoPath);

      // Return config by parsing the same YAML we just wrote
      const config = loadYaml(DEFAULT_SLUPE_YAML) as SlupeConfig;

      return config;
    }
    throw error;
  }
}
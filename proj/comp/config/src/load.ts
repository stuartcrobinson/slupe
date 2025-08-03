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
    const userConfig = loadYaml(content) as SlupeConfig;

    // Validate config structure
    const validation = validateConfig(userConfig);
    if (!validation.valid) {
      throw new Error(`Invalid config: ${validation.error}`);
    }

    // Parse defaults to fill in missing sections
    const defaults = loadYaml(DEFAULT_SLUPE_YAML) as SlupeConfig;

    // Merge defaults for missing top-level sections only
    // This preserves user's complete control over any section they define
    const config: SlupeConfig = {
      ...userConfig,
      // Fill in missing sections from defaults
      'fs-guard': userConfig['fs-guard'] ?? defaults['fs-guard'],
      'hooks': userConfig['hooks'] ?? defaults['hooks'],
      'vars': userConfig['vars'] ?? defaults['vars']
    };

    // Keep patterns as-is, resolution happens in FsGuard
    return config;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Create the config file
      await createStarterConfig(repoPath);
      // Read the actual file we just created (which may have modifications like exec removal)
      const content = await readFile(configPath, 'utf8');
      const config = loadYaml(content) as SlupeConfig;
      return config;
    }
    throw error;
  }
}
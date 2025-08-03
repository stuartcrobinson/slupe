import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { loadConfig } from '../../src/load.js';

const TEST_DIR = '/tmp/t_config_load_test';

describe('loadConfig', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  test('loads valid config', async () => {
    const configContent = `version: 1
allowed-actions:
  - file_read
  - file_write
hooks:
  before:
    - run: echo "test"
vars:
  TEST: value
fs-guard:
  allowed:
    - "./**"
`;
    writeFileSync(join(TEST_DIR, 'slupe.yml'), configContent);

    const config = await loadConfig(TEST_DIR);

    expect(config.version).toBe(1);
    expect(config.hooks?.before).toHaveLength(1);
    expect(config.vars?.TEST).toBe('value');
    expect(config['fs-guard']?.allowed).toContain('./**');
  });

  test('returns default config when file missing', async () => {
    const config = await loadConfig(TEST_DIR);

    expect(config.version).toBe(1);
    expect(config['fs-guard']).toBeDefined();
    expect(config['fs-guard']?.allowed).toContain('./**');
    expect(config['fs-guard']?.allowed).toContain('/tmp/**');
    expect(config.hooks).toBeDefined();
    expect(config.hooks?.before).toBeUndefined();
    expect(config.hooks?.after).toBeUndefined();
  });

  test('throws on invalid YAML', async () => {
    const invalidYaml = `version: 1
  invalid: yaml: structure
`;
    writeFileSync(join(TEST_DIR, 'slupe.yml'), invalidYaml);

    await expect(loadConfig(TEST_DIR)).rejects.toThrow('bad indentation');
  });

  test('throws on invalid config structure', async () => {
    const invalidConfig = `version: "not a number"`;
    writeFileSync(join(TEST_DIR, 'slupe.yml'), invalidConfig);

    await expect(loadConfig(TEST_DIR)).rejects.toThrow('Invalid config: Config version must be a number');
  });

  test('throws on missing version', async () => {
    const noVersion = `hooks:
  before:
    - run: echo "test"
`;
    writeFileSync(join(TEST_DIR, 'slupe.yml'), noVersion);

    await expect(loadConfig(TEST_DIR)).rejects.toThrow('Invalid config: Config missing version');
  });
});
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { createStarterConfig } from '../../src/create';

const TEST_DIR = '/tmp/t_config_create_test';

describe('createStarterConfig', () => {
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

  test('creates starter config when missing', async () => {
    const created = await createStarterConfig(TEST_DIR);

    expect(created).toBe(true);
    expect(existsSync(join(TEST_DIR, 'slupe.yml'))).toBe(true);

    const content = readFileSync(join(TEST_DIR, 'slupe.yml'), 'utf8');
    expect(content).toContain('version: 1');
    expect(content).toContain('fs-guard:');
    expect(content).toContain('hooks:');
    expect(content).toContain('vars:');
  });

  test('returns false when file exists', async () => {
    writeFileSync(join(TEST_DIR, 'slupe.yml'), 'existing content');

    const created = await createStarterConfig(TEST_DIR);

    expect(created).toBe(false);

    // Verify existing content unchanged
    const content = readFileSync(join(TEST_DIR, 'slupe.yml'), 'utf8');
    expect(content).toBe('existing content');
  });

  test('throws on write error', async () => {
    // Make directory read-only (Unix-specific)
    if (process.platform !== 'win32') {
      await createStarterConfig(TEST_DIR); // Create file first
      rmSync(join(TEST_DIR, 'slupe.yml'));
      mkdirSync(join(TEST_DIR, 'slupe.yml')); // Create directory with same name

      const created = await createStarterConfig(TEST_DIR);
      expect(created).toBe(false);
    }
  });
});
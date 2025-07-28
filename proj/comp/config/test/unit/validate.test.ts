import { describe, test, expect } from 'vitest';
import { validateConfig } from '../../src/validate.ts';

describe('validateConfig', () => {
  test('accepts valid config', () => {
    const config = {
      version: 1,
      'allowed-actions': ['file_read', 'file_write', 'exec'],
      hooks: {
        before: [{ run: 'echo test' }],
        after: [{ run: 'echo done' }]
      },
      vars: {
        TEST: 'value'
      },
      'fs-guard': {
        allowed: ['./**'],
        denied: ['**/.git/**'],
        followSymlinks: false
      }
    };

    const result = validateConfig(config);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('rejects non-object config', () => {
    const result = validateConfig('not an object');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Config must be an object');
  });

  test('rejects missing version', () => {
    const result = validateConfig({ hooks: {} });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Config missing version');
  });

  test('rejects non-number version', () => {
    const result = validateConfig({ version: '1' });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Config version must be a number');
  });

  test('rejects non-array hooks.before', () => {
    const result = validateConfig({
      version: 1,
      hooks: { before: 'not an array' }
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('hooks.before must be an array');
  });

  test('rejects non-array hooks.after', () => {
    const result = validateConfig({
      version: 1,
      hooks: { after: {} }
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('hooks.after must be an array');
  });

  test('rejects non-object vars', () => {
    const result = validateConfig({
      version: 1,
      vars: []
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('vars must be an object');
  });

  test('rejects non-string var values', () => {
    const result = validateConfig({
      version: 1,
      vars: { TEST: 123 }
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("var 'TEST' must be a string");
  });

  test('rejects non-array fs-guard.allowed', () => {
    const result = validateConfig({
      version: 1,
      'allowed-actions': [],
      'fs-guard': { allowed: 'not an array' }
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('fs-guard.allowed must be an array');
  });

  test('rejects non-boolean fs-guard.followSymlinks', () => {
    const result = validateConfig({
      version: 1,
      'allowed-actions': [],
      'fs-guard': { followSymlinks: 'yes' }
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('fs-guard.followSymlinks must be a boolean');
  });

  test('rejects missing allowed-actions', () => {
    const result = validateConfig({ version: 1 });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Config missing required allowed-actions');
  });

  test('rejects non-array allowed-actions', () => {
    const result = validateConfig({
      version: 1,
      'allowed-actions': 'not an array'
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('allowed-actions must be an array');
  });

  test('rejects non-string items in allowed-actions', () => {
    const result = validateConfig({
      version: 1,
      'allowed-actions': ['file_read', 123, 'file_write']
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('allowed-actions must contain only strings');
  });

  test('accepts valid allowed-actions', () => {
    const result = validateConfig({
      version: 1,
      'allowed-actions': ['file_read', 'file_write', 'exec']
    });
    expect(result.valid).toBe(true);
  });

  test('accepts minimal config', () => {
    const result = validateConfig({
      version: 1,
      'allowed-actions': []
    });
    expect(result.valid).toBe(true);
  });

  test('accepts empty hooks', () => {
    const result = validateConfig({
      version: 1,
      'allowed-actions': [],
      hooks: {}
    });
    expect(result.valid).toBe(true);
  });
});
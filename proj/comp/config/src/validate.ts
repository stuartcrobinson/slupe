// SlupeConfig type is defined in types.js but not used here since we validate untyped input

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateConfig(config: any): ValidationResult {
  if (!config || typeof config !== 'object') {
    return {
      valid: false,
      error: 'Config must be an object'
    };
  }

  if (!config.version) {
    return {
      valid: false,
      error: 'Config missing version'
    };
  }

  if (typeof config.version !== 'number') {
    return {
      valid: false,
      error: 'Config version must be a number'
    };
  }

  // Validate hooks if present
  if (config.hooks) {
    if (typeof config.hooks !== 'object') {
      return {
        valid: false,
        error: 'hooks must be an object'
      };
    }

    if (config.hooks.before && !Array.isArray(config.hooks.before)) {
      return {
        valid: false,
        error: 'hooks.before must be an array'
      };
    }

    if (config.hooks.after && !Array.isArray(config.hooks.after)) {
      return {
        valid: false,
        error: 'hooks.after must be an array'
      };
    }
  }

  // Validate vars if present
  if (config.vars) {
    if (typeof config.vars !== 'object' || Array.isArray(config.vars)) {
      return {
        valid: false,
        error: 'vars must be an object'
      };
    }

    for (const [key, value] of Object.entries(config.vars)) {
      if (typeof value !== 'string') {
        return {
          valid: false,
          error: `var '${key}' must be a string`
        };
      }
    }
  }

  // Validate allowed-actions (required)
  if (!config['allowed-actions']) {
    return {
      valid: false,
      error: 'Config missing required allowed-actions'
    };
  }

  if (!Array.isArray(config['allowed-actions'])) {
    return {
      valid: false,
      error: 'allowed-actions must be an array'
    };
  }

  for (const tool of config['allowed-actions']) {
    if (typeof tool !== 'string') {
      return {
        valid: false,
        error: 'allowed-actions must contain only strings'
      };
    }
  }

  // Validate fs-guard if present
  if (config['fs-guard']) {
    const fsGuard = config['fs-guard'];
    if (typeof fsGuard !== 'object') {
      return {
        valid: false,
        error: 'fs-guard must be an object'
      };
    }

    if (fsGuard.allowed && !Array.isArray(fsGuard.allowed)) {
      return {
        valid: false,
        error: 'fs-guard.allowed must be an array'
      };
    }

    if (fsGuard.denied && !Array.isArray(fsGuard.denied)) {
      return {
        valid: false,
        error: 'fs-guard.denied must be an array'
      };
    }

    if (fsGuard.followSymlinks !== undefined && typeof fsGuard.followSymlinks !== 'boolean') {
      return {
        valid: false,
        error: 'fs-guard.followSymlinks must be a boolean'
      };
    }
  }

  return { valid: true };
}
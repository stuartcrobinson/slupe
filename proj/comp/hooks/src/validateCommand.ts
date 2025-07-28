import type { Command, ValidationResult } from './types';

/**
 * Validates a command object has required properties and valid values
 * Checks: run is non-empty string, timeout is positive if present
 */
export function validateCommand(cmd: Command): ValidationResult {
  // Check if cmd is an object
  if (!cmd || typeof cmd !== 'object') {
    return {
      valid: false,
      error: 'Command must be an object'
    };
  }

  // Check for run property
  if (!('run' in cmd)) {
    return {
      valid: false,
      error: 'Command must have \'run\' property'
    };
  }

  // Check run is a string
  if (typeof cmd.run !== 'string') {
    return {
      valid: false,
      error: 'Command run must be a string'
    };
  }

  // Check run is not empty (after trimming)
  if (cmd.run.trim() === '') {
    return {
      valid: false,
      error: 'Command run string cannot be empty'
    };
  }

  // Check timeout if present
  if ('timeout' in cmd && cmd.timeout !== undefined) {
    if (typeof cmd.timeout !== 'number' || cmd.timeout <= 0) {
      return {
        valid: false,
        error: 'Timeout must be positive'
      };
    }
  }

  return { valid: true };
}
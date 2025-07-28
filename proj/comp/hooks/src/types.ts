// Re-export public types from index
export type { HooksConfig, Command, HookContext, HookResult } from './index';

// Internal types
export interface CommandResult {
  command: string;
  success: boolean;
  error?: string;
  stdout?: string;
  stderr?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
import type { HooksConfig } from '../../hooks/src/index.js';

export interface SlupeConfig {
  version: number;
  hooks?: HooksConfig;
  vars?: Record<string, string>;
  'fs-guard'?: FsGuardConfig;
  'exec-guard'?: ExecGuardConfig; // future
  'allowed-actions': string[];
  clipboard?: boolean;
  'input_file'?: string;
  'output_file'?: string;
}

export interface FsGuardConfig {
  allowed?: string[];
  denied?: string[];
  followSymlinks?: boolean;
}

export interface ExecGuardConfig {
  languages?: string[];
  timeout?: number;
}
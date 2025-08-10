import { realpath } from 'fs/promises';
import { minimatch } from 'minimatch';
import { dirname, resolve, isAbsolute } from 'path';
import type { SlupeAction } from '../../nesl-action-parser/src/index.js';
import type { FsGuardConfig } from '../../orch/src/types.js';
import type { GuardCheckResult } from './types.js';

export class FsGuard {
  private allowedPatterns: string[];
  private deniedPatterns: string[];
  private followSymlinks: boolean;

  constructor(config: FsGuardConfig, private repoRoot: string) {
    // Config is now required - defaults are handled in loadConfig
    this.allowedPatterns = config.allowed || [];
    this.deniedPatterns = config.denied || [];
    this.followSymlinks = config.followSymlinks ?? false;

    // Resolve relative patterns from repo root
    this.allowedPatterns = this.allowedPatterns.map(p => this.resolvePattern(p));
    this.deniedPatterns = this.deniedPatterns.map(p => this.resolvePattern(p));
  }

  async checkPath(path: string, mode: 'read' | 'write'): Promise<GuardCheckResult> {
    return this._checkPath(path, mode);
  }

  async check(_action: SlupeAction): Promise<GuardCheckResult> {
    throw new Error('FsGuard.check(action) no longer supported - use checkPath(path, mode)');
  }

  private async _checkPath(path: string, permType: 'read' | 'write'): Promise<GuardCheckResult> {
    // Canonicalize path if it exists
    let canonicalPath = path;
    try {
      if (this.followSymlinks) {
        canonicalPath = await realpath(path);
      }
    } catch (error: any) {
      // Path doesn't exist yet
      if (permType === 'read') {
        // Can't read non-existent file
        return {
          allowed: false,
          reason: `Path does not exist: ${path}`
        };
      }
      // For writes, check parent directory if file doesn't exist
      try {
        const parent = dirname(path);
        if (this.followSymlinks) {
          canonicalPath = resolve(await realpath(parent), path.split('/').pop()!);
        }
      } catch {
        // Parent doesn't exist either - use non-canonical path
        canonicalPath = resolve(path);
      }
    }

    // Find most specific matching rule
    const allowMatch = this.findMostSpecificMatch(canonicalPath, this.allowedPatterns);
    const denyMatch = this.findMostSpecificMatch(canonicalPath, this.deniedPatterns);

    // If both match, most specific wins
    if (allowMatch && denyMatch) {
      if (allowMatch.specificity >= denyMatch.specificity) {
        return { allowed: true };
      }
    }

    // Deny match takes precedence
    if (denyMatch) {
      return {
        allowed: false,
        reason: `${permType === 'read' ? 'Read' : 'Write'} access denied for '${path}'`
      };
    }

    // Must have an allow match
    if (!allowMatch) {
      return {
        allowed: false,
        reason: `${permType === 'read' ? 'Read' : 'Write'} access denied for '${path}' - no matching allow rule`
      };
    }

    return { allowed: true };
  }

  private findMostSpecificMatch(path: string, patterns: string[]): { pattern: string; specificity: number } | null {
    let bestMatch: { pattern: string; specificity: number } | null = null;

    for (const pattern of patterns) {
      if (minimatch(path, pattern, { dot: true, nonegate: true, nocase: false })) {
        const specificity = this.calculateSpecificity(pattern);
        if (!bestMatch || specificity > bestMatch.specificity) {
          bestMatch = { pattern, specificity };
        }
      }
    }

    return bestMatch;
  }

  private calculateSpecificity(pattern: string): number {
    // Count non-wildcard segments
    const segments = pattern.split('/').filter(s => s.length > 0);
    let specificity = 0;

    for (const segment of segments) {
      if (!segment.includes('*') && !segment.includes('?')) {
        specificity += 2; // Exact segment
      } else if (segment === '*') {
        specificity += 0; // Single wildcard
      } else if (segment === '**') {
        specificity += 0; // Recursive wildcard
      } else {
        specificity += 1; // Partial wildcard
      }
    }

    return specificity;
  }

  private resolvePattern(pattern: string): string {
    if (isAbsolute(pattern)) {
      return pattern;
    }
    return resolve(this.repoRoot, pattern);
  }


}
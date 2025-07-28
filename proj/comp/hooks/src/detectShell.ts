/**
 * Detects the appropriate shell for the current platform
 * Used to provide better defaults for hooks on different OSes
 */
export function detectShell(): { shell: string; isWindows: boolean } {
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    // On Windows, prefer PowerShell over cmd if available
    // PowerShell is more capable and handles Unix-style commands better
    const shell = process.env.ComSpec || 'cmd.exe';
    
    // Could enhance this to detect PowerShell availability
    // For now, we'll document that Windows users should use PowerShell-compatible commands
    return { shell, isWindows };
  }
  
  // Unix-like systems (Linux, macOS)
  const shell = process.env.SHELL || '/bin/sh';
  return { shell, isWindows };
}

/**
 * Provides platform-appropriate example commands
 */
export function getPlatformExamples(): { 
  gitAdd: string; 
  gitCommit: string; 
  gitPush: string;
  gitStash: string;
} {
  const { } = detectShell();
  
  // Git commands are the same across platforms when using Git Bash or PowerShell
  // These work on all platforms with Git installed
  return {
    gitAdd: 'git add -A',
    gitCommit: 'git commit -m "${COMMIT_MSG}"',
    gitPush: 'git push',
    gitStash: 'git stash --include-untracked'
  };
}
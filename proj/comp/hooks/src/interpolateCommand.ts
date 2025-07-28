import type { Command, HookContext } from './types';

/**
 * Interpolates variables in a command's run string
 * Replaces ${VAR} patterns with values from vars and context
 * Context values override vars values
 * @throws Error if a variable is not found
 */
export function interpolateCommand(
  cmd: Command,
  vars: Record<string, string>,
  context?: HookContext
): Command {
  // Create a new command object to avoid mutation
  const interpolated = { ...cmd };
  
  // Build combined variable map (context overrides vars)
  const allVars: Record<string, string> = { ...vars };
  if (context) {
    // Convert context values to strings
    for (const [key, value] of Object.entries(context)) {
      allVars[key] = String(value);
    }
  }

  // Replace variables in the run string
  let runString = cmd.run;
  
  // First, handle escaped dollar signs
  runString = runString.replace(/\\\$/g, '\x00ESCAPED_DOLLAR\x00');
  
  // Find and replace all ${VAR} patterns
  const varPattern = /\$\{([^}]+)\}/g;
  const matches = runString.match(varPattern);
  
  if (matches) {
    for (const match of matches) {
      const varName = match.slice(2, -1); // Remove ${ and }
      
      if (!(varName in allVars)) {
        throw new Error(`Variable not found: ${varName}`);
      }
      
      const replacement = allVars[varName];
      if (replacement !== undefined) {
        runString = runString.replace(match, replacement);
      }
    }
  }
  
  // Restore escaped dollar signs
  runString = runString.replace(/\x00ESCAPED_DOLLAR\x00/g, '$');
  
  interpolated.run = runString;
  return interpolated;
}
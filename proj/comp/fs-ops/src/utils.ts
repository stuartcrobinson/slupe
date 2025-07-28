import { stat } from 'fs/promises';

/**
 * Check if a file or directory exists
 * @param path - File or directory path to check
 * @returns true if exists, false otherwise
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format Node.js filesystem errors into consistent error messages
 * @param error - The error object from Node.js
 * @param path - The file path involved in the operation
 * @param operation - The operation that was attempted
 * @returns Formatted error message string
 */
export function formatNodeError(error: any, path: string, operation: string, dest?: string): string {
  // Node.js errors have a code property
  if (error.code) {
    switch (error.code) {
      case 'ENOENT':
        if (operation === 'rename' && dest) {
          return `ENOENT: no such file or directory, rename '${path}' -> '${dest}'`;
        }
        return `ENOENT: no such file or directory, ${operation} '${path}'`;
      case 'EEXIST':
        return `EEXIST: file already exists, ${operation} '${path}'`;
      case 'EACCES':
        if (operation === 'rename' && dest) {
          return `EACCES: permission denied, rename '${path}' -> '${dest}'`;
        }
        return `EACCES: permission denied, ${operation} '${path}'`;
      case 'EISDIR':
        return `EISDIR: illegal operation on a directory, ${operation} '${path}'`;
      case 'ENOTDIR':
        return `ENOTDIR: not a directory, ${operation} '${path}'`;
      case 'ENOTEMPTY':
        return `ENOTEMPTY: directory not empty, ${operation} '${path}'`;
      default:
        return `${error.code}: ${error.message}`;
    }
  }
  
  // Fallback for non-Node errors
  return error.message || `Unknown error during ${operation} on '${path}'`;
}
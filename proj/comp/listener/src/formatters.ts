import type { ExecutionResult as OrchestratorResult } from '../../orch/src/index.js';
import { readFileSync } from 'fs';


export function formatSummary(orchResult: OrchestratorResult): string {
  const lines = ['=== SLUPE RESULTS ==='];
  
  // If no actions and no errors, indicate that
  if (!orchResult.results?.length && !orchResult.parseErrors?.length && !orchResult.hookErrors?.before?.length) {
    lines.push('No NESL blocks found');
  }



  // DEBUG: Log raw orchestrator result for parse errors
  if (orchResult.parseErrors && orchResult.parseErrors.length > 0) {
    // console.log('DEBUG: Raw parseErrors:', JSON.stringify(orchResult.parseErrors, null, 2));
  }

  // Handle hook errors first
  if (orchResult.hookErrors?.before) {
    for (const error of orchResult.hookErrors.before) {
      lines.push(`def ❌ - Hook failed: ${error.command}`);
      lines.push(`          Error: ${error.error}`);
      if (error.stderr?.trim()) {
        lines.push(`          stderr: ${error.stderr.trim()}`);
      }
      if (error.stdout?.trim()) {
        lines.push(`          stdout: ${error.stdout.trim()}`);
      }
    }
  }

  // Add execution results
  if (orchResult.results) {
    for (const result of orchResult.results) {
      let icon = result.success ? '✅' : '❌';
      const primaryParam = getPrimaryParamFromResult(result);

      // Check for partial success in files_read
      if (result.success && result.action === 'files_read' && result.data?.errors) {
        icon = '⚠️ ';
        const totalFiles = (result.data.paths?.length || 0) + (result.data.errors?.length || 0);
        const successCount = result.data.paths?.length || 0;
        const failCount = result.data.errors?.length || 0;
        lines.push(`${result.blockId} ${icon} ${result.action} ${primaryParam} - Read ${successCount} of ${totalFiles} files (${failCount} failed)`.trim());
      } else if (result.success) {
        lines.push(`${result.blockId} ${icon} ${result.action} ${primaryParam}`.trim());
      } else {
        // Debug log for exec failures
        if (result.action === 'exec' && !result.error) {
          console.log('DEBUG: Exec failed but no error field:', JSON.stringify(result, null, 2));
        }
        lines.push(`${result.blockId} ${icon} ${result.action} ${primaryParam} - ${getErrorSummary(result.error, result)}`.trim());
      }
    }
  }

  // Add parse errors - group by blockId
  if (orchResult.parseErrors) {
    const errorsByBlock = new Map<string, any[]>();

    // Group errors by blockId
    for (const error of orchResult.parseErrors) {
      const blockId = error.blockId || 'unknown';
      if (!errorsByBlock.has(blockId)) {
        errorsByBlock.set(blockId, []);
      }
      errorsByBlock.get(blockId)!.push(error);
    }

    // Format grouped errors
    for (const [blockId, errors] of errorsByBlock) {
      const firstError = errors[0];
      const action = firstError.action || '-';
      const lineInfo = firstError.blockStartLine ? ` (line ${firstError.blockStartLine})` : '';

      // Pad action to 10 characters for alignment
      const paddedAction = action.padEnd(10);

      if (errors.length === 1) {
        // Single error
        lines.push(`${blockId} ❌ ${paddedAction} ERROR: ${firstError.message}${lineInfo}`);
      } else {
        // Multiple errors - count unique messages
        const messageCount = new Map<string, number>();
        for (const error of errors) {
          const msg = error.message;
          messageCount.set(msg, (messageCount.get(msg) || 0) + 1);
        }

        // First line shows total count
        lines.push(`${blockId} ❌ ${paddedAction} ERROR: ${errors.length} syntax errors${lineInfo}`);

        // Sub-bullets for each unique error type
        const indent = ' '.repeat(20); // Align with ERROR: column
        for (const [msg, count] of messageCount) {
          if (count > 1) {
            lines.push(`${indent}- ${msg} (${count} occurrences)`);
          } else {
            lines.push(`${indent}- ${msg}`);
          }
        }
      }
    }
  }

  lines.push('=== END ===');
  return lines.join('\n');
}

function getPrimaryParamFromResult(result: any): string {
  if (!result.params) return '';
  if (result.params.path) return result.params.path;
  if (result.params.paths) {
    const paths = result.params.paths.trim().split('\n').filter((p: string) => p.trim());
    return `(${paths.length} files)`;
  }
  if (result.params.pattern) return result.params.pattern;
  if (result.params.lang) return result.params.lang;
  if (result.params.old_path) return result.params.old_path;
  return '';
}

function getErrorSummary(error?: string, result?: any): string {
  // Special handling for exec failures
  if (result?.action === 'exec' && result?.data?.stderr) {
    const stderr = result.data.stderr.trim();
    const lines = stderr.split('\n').filter((l: string) => l.trim());
    if (lines.length > 0) {
      // Get last non-empty line as likely error message
      return lines[lines.length - 1];
    }
    if (result.data.exit_code !== undefined) {
      return `Exit code ${result.data.exit_code}`;
    }
  }

  if (!error) return 'Unknown error';

  // Handle non-string errors
  if (typeof error !== 'string') {
    return 'Unknown error (non-string)';
  }

  // Extract key error info
  if (error.includes('File not found')) return 'File not found';
  if (error.includes('no such file or directory')) return 'File not found';
  if (error.includes('Permission denied')) return 'Permission denied';
  if (error.includes('Output too large')) return error; // Keep full message
  if (error.includes('TIMEOUT')) return error; // Keep timeout messages
  if (error.includes('ENOENT')) return error; // Keep command not found

  // For other errors, take first part before details
  const match = error.match(/^[^:]+:\s*([^'(]+)/);
  if (match) return match[1]!.trim();

  return error?.split('\n')[0] || 'Unknown error'; // First line only
}

/**
 * Format file read output in a human-readable way
 */
function formatFileReadOutput(result: any): string[] {
  const lines: string[] = [];

  if (result.action === 'file_read') {
    // Simple file read - data contains { path, content }
    const path = result.data.path || result.params?.path || 'unknown';
    lines.push(`=== START FILE: ${path} ===`);
    lines.push((result.data.content !== undefined ? result.data.content : result.data) || '[empty file]');
    lines.push(`=== END FILE: ${path} ===`);
  } else if (result.action === 'file_read_numbered') {
    // Numbered file read - data contains { path, content } where content has line numbers
    const path = result.data.path || result.params?.path || 'unknown';
    lines.push(`=== START FILE: [numbered] ${path} ===`);
    lines.push((result.data.content !== undefined ? result.data.content : result.data) || '[empty file]');
    lines.push(`=== END FILE: [numbered] ${path} ===`);
  } else if (result.action === 'files_read') {
    // Multiple files read - data contains { paths: string[], content: string[], errors?: [{path, error}] }
    // Each element in content array corresponds to the file at the same index in paths
    const successCount = result.data.paths?.length || 0;
    const failCount = result.data.errors?.length || 0;
    const totalCount = successCount + failCount;

    // Handle partial failures
    if (result.data.errors && result.data.errors.length > 0) {
      lines.push(`Successfully read ${successCount} of ${totalCount} files (${failCount} failed):`);
      lines.push('');

      // List successful files
      if (successCount > 0) {
        lines.push('✅ Successfully read:');
        for (const path of result.data.paths) {
          lines.push(`- ${path}`);
        }
        lines.push('');
      }

      // List failed files
      lines.push('❌ Failed to read:');
      for (const error of result.data.errors) {
        lines.push(`- ${error.path}: ${error.error}`);
      }
      lines.push('');

      // Show content of successful files
      if (successCount > 0) {
        for (let i = 0; i < result.data.paths.length; i++) {
          const path = result.data.paths[i];
          const content = result.data.content[i];

          lines.push(`=== START FILE: ${path} ===`);
          lines.push(content || '[empty file]');
          lines.push(`=== END FILE: ${path} ===`);

          // Add blank line between files (except after the last one)
          if (i < result.data.paths.length - 1) {
            lines.push('');
          }
        }
      }
    } else if (result.data.paths && result.data.content) {
      // All files read successfully
      lines.push(`Reading ${result.data.paths.length} files:`);

      // List all files first
      for (const path of result.data.paths) {
        lines.push(`- ${path}`);
      }

      // Add blank line before file contents
      lines.push('');

      // Format each file's content with START/END markers
      for (let i = 0; i < result.data.paths.length; i++) {
        const path = result.data.paths[i];
        const content = result.data.content[i];

        lines.push(`=== START FILE: ${path} ===`);
        lines.push(content || '[empty file]');
        lines.push(`=== END FILE: ${path} ===`);

        // Add blank line between files (except after the last one)
        if (i < result.data.paths.length - 1) {
          lines.push('');
        }
      }
    } else {
      // Fallback for unexpected format
      lines.push(`Reading 0 files:`);
    }
  }

  return lines;
}

export function formatFullOutput(orchResult: OrchestratorResult): string {
  const lines = ['=== SLUPE RESULTS ==='];

  // Handle hook errors first
  if (orchResult.hookErrors?.before) {
    for (const error of orchResult.hookErrors.before) {
      lines.push(`def ❌ - Hook failed: ${error.command}`);
      lines.push(`          Error: ${error.error}`);
      if (error.stderr?.trim()) {
        lines.push(`          stderr: ${error.stderr.trim()}`);
      }
      if (error.stdout?.trim()) {
        lines.push(`          stdout: ${error.stdout.trim()}`);
      }
    }
  }

  // Add execution results
  if (orchResult.results) {
    for (const result of orchResult.results) {
      let icon = result.success ? '✅' : '❌';
      const primaryParam = getPrimaryParamFromResult(result);

      // Check for partial success in files_read
      if (result.success && result.action === 'files_read' && result.data?.errors) {
        icon = '⚠️ ';
        const totalFiles = (result.data.paths?.length || 0) + (result.data.errors?.length || 0);
        const successCount = result.data.paths?.length || 0;
        const failCount = result.data.errors?.length || 0;
        lines.push(`${result.blockId} ${icon} ${result.action} ${primaryParam} - Read ${successCount} of ${totalFiles} files (${failCount} failed)`.trim());
      } else if (result.success) {
        lines.push(`${result.blockId} ${icon} ${result.action} ${primaryParam}`.trim());
      } else {
        lines.push(`${result.blockId} ${icon} ${result.action} ${primaryParam} - ${getErrorSummary(result.error, result)}`.trim());
      }
    }
  }

  // Add parse errors - group by blockId
  if (orchResult.parseErrors) {
    const errorsByBlock = new Map<string, any[]>();

    // Group errors by blockId
    for (const error of orchResult.parseErrors) {
      const blockId = error.blockId || 'unknown';
      if (!errorsByBlock.has(blockId)) {
        errorsByBlock.set(blockId, []);
      }
      errorsByBlock.get(blockId)!.push(error);
    }

    // Format grouped errors
    for (const [blockId, errors] of errorsByBlock) {
      const firstError = errors[0];
      const action = firstError.action || '-';
      const lineInfo = firstError.blockStartLine ? ` (line ${firstError.blockStartLine})` : '';

      // Pad action to 10 characters for alignment
      const paddedAction = action.padEnd(10);

      if (errors.length === 1) {
        // Single error
        lines.push(`${blockId} ❌ ${paddedAction} ERROR: ${firstError.message}${lineInfo}`);
      } else {
        // Multiple errors - count unique messages
        const messageCount = new Map<string, number>();
        for (const error of errors) {
          const msg = error.message;
          messageCount.set(msg, (messageCount.get(msg) || 0) + 1);
        }

        // First line shows total count
        lines.push(`${blockId} ❌ ${paddedAction} ERROR: ${errors.length} syntax errors${lineInfo}`);

        // Sub-bullets for each unique error type
        const indent = ' '.repeat(20); // Align with ERROR: column
        for (const [msg, count] of messageCount) {
          if (count > 1) {
            lines.push(`${indent}- ${msg} (${count} occurrences)`);
          } else {
            lines.push(`${indent}- ${msg}`);
          }
        }
      }
    }
  }

  lines.push('=== END ===', '', '=== OUTPUTS ===');

  // Group operations by file path for concise output
  const fileOperations = new Map<string, { blockId: string, action: string, success: boolean }[]>();

  // Collect all file operations that need to show content
  if (orchResult.results) {
    for (const result of orchResult.results) {
      // Check if this operation should show file contents
      let shouldShow = false;
      let filePath = '';

      // Failed replace operations where text wasn't found
      if (!result.success &&
        ['file_replace_text', 'file_replace_all_text'].includes(result.action) &&
        result.error?.includes('not found in file') &&
        result.params?.path) {
        shouldShow = true;
        filePath = result.params.path;
      }
      // Failed replace operations with duplicate text
      else if (!result.success &&
        ['file_replace_text', 'file_replace_all_text'].includes(result.action) &&
        result.error?.includes('appears') &&
        result.error?.includes('times') &&
        result.params?.path) {
        shouldShow = true;
        filePath = result.params.path;
      }
      // Successful file_read operations
      else if (result.success && result.action === 'file_read' && result.params?.path) {
        shouldShow = true;
        filePath = result.params.path;
      }

      if (shouldShow && filePath) {
        if (!fileOperations.has(filePath)) {
          fileOperations.set(filePath, []);
        }
        fileOperations.get(filePath)!.push({
          blockId: result.blockId,
          action: result.action,
          success: result.success
        });
      }
    }
  }

  // Output grouped file contents
  for (const [filePath, operations] of fileOperations) {
    // Format the operations list: [blockId ✅/❌, ...]
    const opsStr = operations
      .map(op => `${op.blockId} ${op.success ? '✅' : '❌'}`)
      .join(', ');

    lines.push('', `[${opsStr}] ${filePath}:`);
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      lines.push(`=== START FILE: ${filePath} ===`);
      lines.push(content);
      lines.push(`=== END FILE: ${filePath} ===`);
    } catch (err: any) {
      lines.push(`[Error reading file: ${err.message}]`);
    }
  }

  // Handle other output types (non-file operations)
  if (orchResult.results) {
    for (const result of orchResult.results) {
      // Skip file operations we already handled
      if (['file_read', 'file_replace_text', 'file_replace_all_text'].includes(result.action)) {
        continue;
      }

      if (result.data && shouldShowOutput(result.action)) {
        // Special formatting for failed exec commands
        if (result.action === 'exec' && !result.success) {
          lines.push('', `[${result.blockId}] exec ${result.params.lang || 'bash'} (failed):`);
          lines.push('command:');
          lines.push(result.data.command || result.params.code || '[command not available]');
          lines.push('');

          if (result.data.stdout) {
            lines.push('stdout:');
            lines.push(result.data.stdout.trimEnd());
            lines.push('');
          }

          if (result.data.stderr) {
            lines.push('stderr:');
            const stderrLines = result.data.stderr.trimEnd().split('\n');
            lines.push(...stderrLines.map((line: string) => '  ' + line));
            lines.push('');
          }

          if (result.data.exit_code !== undefined) {
            lines.push(`exit code: ${result.data.exit_code}`);
          }
          continue;
        }

        // Handle other output types
        const primaryParam = getPrimaryParamFromResult(result);
        const includeParam = !['file_read_numbered', 'files_read'].includes(result.action);
        const header = (primaryParam && includeParam)
          ? `[${result.blockId}] ${result.action} ${primaryParam}:`
          : `[${result.blockId}] ${result.action}:`;
        lines.push('', header);

        if (['file_read_numbered', 'files_read'].includes(result.action)) {
          const formattedOutput = formatFileReadOutput(result);
          lines.push(...formattedOutput);
        } else if (typeof result.data === 'string') {
          lines.push(result.data.trimEnd());
        } else if (result.data.stdout !== undefined || result.data.stderr !== undefined) {
          if (result.data.stdout) {
            lines.push(`stdout:\n${result.data.stdout.trimEnd()}`);
          }
          if (result.data.stderr) {
            lines.push(`stderr:\n${result.data.stderr.trimEnd()}`);
          }
        } else {
          lines.push(JSON.stringify(result.data, null, 2));
        }
      }
    }
  }

  lines.push('=== END ===');
  return lines.join('\n');
}

function shouldShowOutput(action: string): boolean {
  // Actions with output_display: never
  const neverShowOutput = ['file_write', 'file_replace_text', 'file_replace_all_text', 'file_append', 'file_delete', 'file_move', 'dir_create', 'dir_delete'];
  if (neverShowOutput.includes(action)) {
    return false;
  }

  // Actions with output_display: always
  const alwaysShowOutput = ['file_read', 'file_read_numbered', 'files_read', 'ls', 'grep', 'glob'];
  if (alwaysShowOutput.includes(action)) {
    return true;
  }

  // Actions with output_display: conditional
  if (action === 'exec') {
    // Always show output for debugging failed commands
    return true;
  }

  // Default to showing output for unknown actions
  return true;
}


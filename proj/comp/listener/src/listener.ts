import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import clipboard from 'clipboardy';

import type { ListenerConfig, ListenerHandle, ListenerState } from './types.js';
import { ListenerError } from './errors.js';
import { processContent } from './content-processor.js';
import { FileWatcher } from './file-watcher.js';
import { writeOutputs } from './output-writer.js';
import { ClipboardMonitor } from './clipboard-monitor.js';

// possible design issue/problem: we're passing the full content through multiple layers just to write it back. The stripped content would be better, but processContent doesn't return it.

const debug = false;

const activeListeners = new Map<string, ListenerHandle>();
const fileWatcher = new FileWatcher();

function generateId(): string {
  return `listener-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}


async function processFileChange(filePath: string, state: ListenerState): Promise<void> {
  if (state.isProcessing) {
    console.log('DEBUG: Already processing, skipping');
    return;
  }

  debug&&console.time('total-processing');
  try {
    state.isProcessing = true;

    debug&&console.time('read-file');
    const fullContent = await readFile(filePath, 'utf-8');
    debug&&console.timeEnd('read-file');
    
    debug&&console.time('processContent-total');
    const result = await processContent(
      fullContent,
      state.lastExecutedHash,
      state.debug || true, // Force debug on for timing
      dirname(filePath),
      state.slupeInstance
    );
    debug&&console.timeEnd('processContent-total');

    // console.log('DEBUG: processContent result:', result);

    if (!result) {
      // console.log('DEBUG: No result from processContent');
      return;
    }

    // Copy combined content to clipboard before writing files
    let clipboardCopyTime: Date | undefined;
    if (state.useClipboardWrite) {
      try {
        await clipboard.write(result.fullOutput);
        clipboardCopyTime = new Date();
        if (state.debug) {
          console.log('[Clipboard] Copied combined content to clipboard (length:', result.fullOutput.length + ')');
        }
      } catch (clipboardError) {
        console.error('[Clipboard] Error copying to clipboard:', clipboardError);
        // Don't fail the whole operation if clipboard fails
      }
    }

    // Update summary with clipboard timestamp if we copied
    if (clipboardCopyTime) {
      const timeStr = clipboardCopyTime.toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      }).toLowerCase();
      const clipboardLine = `📋 Output copied to clipboard @ ${timeStr}`;
      result.summary = result.summary.replace(
        '=== SLUPE RESULTS ===',
        `=== SLUPE RESULTS ===\n${clipboardLine}\n---------------------`
      );
    }

    if (state.debug) debug&&console.time('write-outputs');
    try {
      await writeOutputs(
        {
          inputPath: filePath,
          outputPath: state.outputPath
        },
        result.summary,
        result.fullOutput,
        result.originalContent
      );
    } catch (writeError) {
      console.error('DEBUG: Error writing outputs:', writeError);
      throw writeError;
    }
    if (state.debug) debug&&console.timeEnd('write-outputs');

    state.lastExecutedHash = result.hash;
    
    if (result.slupeInstance && !state.slupeInstance) {
      state.slupeInstance = result.slupeInstance;
    }

    // Run after hooks asynchronously (don't await)
    if (result.slupeInstance && result.afterHookContext) {
      result.slupeInstance.runAfterHooks(result.afterHookContext)
        .then((hookResult: any) => {
          if (!hookResult.success) {
            console.error('\n=== AFTER HOOKS FAILED ===');
            if (hookResult.errors) {
              for (const error of hookResult.errors) {
                console.error(`Command: ${error.command}`);
                console.error(`Error: ${error.error}`);
                if (error.stdout) console.error(`Stdout: ${error.stdout}`);
                if (error.stderr) console.error(`Stderr: ${error.stderr}`);
              }
            }
            console.error('=========================\n');
            process.exit(1);
          }
        })
        .catch((err: any) => {
          console.error('Unexpected error running after hooks:', err);
          process.exit(1);
        });
    }

  } catch (error) {
    console.error('listener: Error processing file change:', error);
  } finally {
    state.isProcessing = false;
    debug&&console.timeEnd('total-processing');
  }
}

export async function startListener(config: ListenerConfig): Promise<ListenerHandle> {
  if (!config.filePath) {
    throw new Error('listener: filePath is required');
  }
  if (!config.filePath.startsWith('/')) {
    throw new Error('listener: filePath must be absolute');
  }
  if (config.debounceMs !== undefined && config.debounceMs < 15) {
    throw new Error('listener: debounceMs must be at least 15');
  }

  if (activeListeners.has(config.filePath)) {
    throw new ListenerError('ALREADY_WATCHING', config.filePath);
  }

  const state: ListenerState = {
    lastExecutedHash: '',
    isProcessing: false,
    outputPath: join(dirname(config.filePath), config.outputFilename || '.slupe-output-latest.txt'),
    debug: config.debug || false,
    useClipboardRead: config.useClipboardRead || false,
    useClipboardWrite: config.useClipboardWrite || false,
    inputPath: config.filePath,
    slupeInstance: config.slupeInstance
  };

  const processHandler = async () => processFileChange(config.filePath, state);

  const watchHandle = await fileWatcher.watch(
    config.filePath,
    processHandler,
    config.debounceMs || 100
  );

  // Process the file immediately and wait for completion
  // console.log('DEBUG: Processing initial file content');
  await processHandler();
  // console.log('DEBUG: Initial processing complete');

  // Start clipboard monitoring if enabled
  let clipboardMonitor: ClipboardMonitor | undefined;
  if (config.useClipboardRead) {
    clipboardMonitor = new ClipboardMonitor(config.filePath);
    await clipboardMonitor.start();
  }

  const handle: ListenerHandle = {
    id: generateId(),
    filePath: config.filePath,
    stop: async () => {
      watchHandle.stop();
      if (clipboardMonitor) {
        clipboardMonitor.stop();
      }
      activeListeners.delete(config.filePath);
    }
  };

  activeListeners.set(config.filePath, handle);

  return handle;
}

export async function stopListener(handle: ListenerHandle): Promise<void> {
  await handle.stop();
}
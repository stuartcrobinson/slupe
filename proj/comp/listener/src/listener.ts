import { watchFile, unwatchFile, Stats } from 'fs';
import { readFile, writeFile, access, constants } from 'fs/promises';
import { dirname, join } from 'path';
import clipboard from 'clipboardy';

import type { ListenerConfig, ListenerHandle, ListenerState } from './types';
import { ListenerError } from './errors';
import { Slupe } from '../../orch/src/index';
import { formatSummary, formatFullOutput } from './formatters.ts';
import { computeContentHash } from './utils';

// Module-level state for tracking active listeners
const activeListeners = new Map<string, ListenerHandle>();

// Clipboard monitoring state
interface ClipboardEntry {
  content: string;
  timestamp: number;
}

let lastClipboard: ClipboardEntry | null = null;
let clipboardMonitorInterval: NodeJS.Timeout | null = null;

// Strip prepended summary section if present
function stripSummarySection(content: string): string {
  const marker = '=== END ===';
  const i = content.lastIndexOf(marker);
  return i === -1 ? content : content.slice(i + marker.length).trimStart();
}

// Extract NESL SHA IDs from content
function extractNeslShas(content: string): Set<string> {
  const shaPattern = /#!nesl\s*\[@[^:]+:\s*([a-zA-Z0-9]+)\]/g;
  const shas = new Set<string>();
  let match;
  while ((match = shaPattern.exec(content)) !== null) {
    if (match[1]) {
      shas.add(match[1]);
    }
  }
  return shas;
}



// Check clipboard for input trigger pattern
async function checkClipboardTrigger(current: ClipboardEntry, state: ListenerState): Promise<void> {
  if (!lastClipboard || current.timestamp - lastClipboard.timestamp > 1800) {
    lastClipboard = current;
    return;
  }

  // Determine smaller/larger
  const [smaller, larger] = current.content.length < lastClipboard.content.length
    ? [current.content, lastClipboard.content]
    : [lastClipboard.content, current.content];

  // Try to extract SHAs from smaller
  const shas = extractNeslShas(smaller);
  if (shas.size === 0) {
    lastClipboard = current;
    return;
  }

  // Check if all SHA end delimiters exist in larger
  const allFound = [...shas].every(sha => {
    const endPattern = new RegExp(`#!end_${sha}\\b`, 'i');
    return endPattern.test(larger);
  });

  if (allFound) {
    await writeFile(state.inputPath, smaller);
    if (state.debug) {
      console.log(`Clipboard trigger: wrote ${smaller.length} chars to input file`);
    }
  }

  lastClipboard = current;
}

// Monitor clipboard for input patterns
async function monitorClipboard(state: ListenerState): Promise<void> {
  try {
    const content = await clipboard.read();
    const current = { content, timestamp: Date.now() };

    if (lastClipboard && current.content !== lastClipboard.content) {
      await checkClipboardTrigger(current, state);
    } else if (!lastClipboard) {
      lastClipboard = current;
    }
  } catch (error) {
    if (state.debug) {
      console.error('Clipboard monitor error:', error);
    }
  }
}


// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };

  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
  };

  return debounced as T & { cancel: () => void };
}

// Generate unique ID for listener instance
function generateId(): string {
  return `listener-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Format clipboard status line
function formatClipboardStatus(success: boolean): string {

  return success ?
    `📋 Copied to clipboard` :
    `❌ Clipboard copy failed`;
}

// Process file changes
async function processFileChange(filePath: string, state: ListenerState): Promise<void> {
  // Check not already processing
  if (state.isProcessing) return;

  try {
    state.isProcessing = true;

    // Read file
    const fullContent = await readFile(filePath, 'utf-8');
    if (fullContent.trim() == "") {
      return;
    }

    // Strip summary section for hashing
    const contentForHash = stripSummarySection(fullContent).trim();

    // // DIAGNOSTIC: Log stripping results
    // console.log('\n=== STRIP SUMMARY ===');
    // console.log('Original length:', fullContent.length);
    // console.log('Stripped length:', contentForHash.length);
    // console.log('Stripped content preview:', contentForHash.substring(0, 150).replace(/\n/g, '\\n'));
    // console.log('=== END STRIP ===\n');

    // Compute hash of content (excluding summary)
    const currentHash = computeContentHash(contentForHash);

    // // DIAGNOSTIC: Log hash comparison
    // console.log('Current hash:', currentHash);
    // console.log('Last hash:', state.lastExecutedHash);

    // Skip if unchanged
    if (currentHash === state.lastExecutedHash) {
      // console.log('Content unchanged, skipping execution');
      return;
    }

    // Execute via orchestrator with full file content
    const slupe = await Slupe.create({ gitCommit: false });
    const orchResult = await slupe.execute(fullContent);

    // Debug logging
    if (state.debug) {
      console.log('\n=== DEBUG: Orchestrator Result ===');
      console.log('Executed actions:', orchResult.executedActions);
      console.log('Results:', orchResult.results?.length || 0);
      console.log('Parse errors:', orchResult.parseErrors?.length || 0);
      if (orchResult.parseErrors && orchResult.parseErrors.length > 0) {
        console.log('Raw parseErrors:', JSON.stringify(orchResult.parseErrors, null, 2));
      }

      // Add parse debug info if available
      if (orchResult.debug?.parseDebug) {
        const pd = orchResult.debug.parseDebug;
        console.log('\n--- Parse Debug ---');
        console.log('Input:', pd.rawInput);
        console.log('Parse result:', {
          blocks: pd.rawParseResult?.blocks?.length || 0,
          errors: pd.rawParseResult?.errors?.length || 0
        });
        if (pd.rawParseResult?.errors?.length > 0) {
          console.log('Nesl-js errors:', JSON.stringify(pd.rawParseResult.errors, null, 2));
        }
      }
      console.log('=== END DEBUG ===\n');
    }

    // Format outputs
    const summary = formatSummary(orchResult);
    const fullOutput = await formatFullOutput(orchResult);

    // Copy to clipboard if enabled
    let clipboardSuccess = false;
    let clipboardStatus = '';

    if (state.useClipboard) {
      try {
        await clipboard.write(fullOutput);
        clipboardSuccess = true;
      } catch (error) {
        console.error('listener: Clipboard write failed:', error);
      }
      clipboardStatus = formatClipboardStatus(clipboardSuccess);
    }

    // Write output file (without clipboard status)
    await writeFile(state.outputPath, fullOutput);

    // Prepend to input file
    const prepend = state.useClipboard && clipboardStatus
      ? clipboardStatus + '\n' + summary
      : summary;
    const updatedContent = prepend + '\n' + fullContent;
    await writeFile(filePath, updatedContent);

    // Update state
    state.lastExecutedHash = currentHash;

  } catch (error) {
    console.error('listener: Error processing file change:', error);
  } finally {
    state.isProcessing = false;
  }
}

export async function startListener(config: ListenerConfig): Promise<ListenerHandle> {
  // Validate config
  if (!config.filePath) {
    throw new Error('listener: filePath is required');
  }
  if (!config.filePath.startsWith('/')) {
    throw new Error('listener: filePath must be absolute');
  }
  if (config.debounceMs !== undefined && config.debounceMs < 100) {
    throw new Error('listener: debounceMs must be at least 100');
  }

  // Check file exists
  try {
    await access(config.filePath, constants.F_OK);
  } catch (error) {
    throw new ListenerError('FILE_NOT_FOUND', config.filePath);
  }

  // Check not already watching
  if (activeListeners.has(config.filePath)) {
    throw new ListenerError('ALREADY_WATCHING', config.filePath);
  }

  // Initialize state
  const state: ListenerState = {
    lastExecutedHash: '',
    isProcessing: false,
    outputPath: join(dirname(config.filePath), config.outputFilename || '.slupe-output-latest.txt'),
    debug: config.debug || false,
    useClipboard: config.useClipboard || false,
    inputPath: config.filePath
  };

  // Set up debounced handler
  const debouncedProcess = debounce(
    () => {
      // console.log('Debounced process executing');
      processFileChange(config.filePath, state);
    },
    config.debounceMs || 500
  );

  // Start watching
  watchFile(config.filePath, { interval: 500 }, (curr: Stats, prev: Stats) => {
    if (curr.mtime !== prev.mtime) {
      // console.log('File change detected, triggering debounced process');
      debouncedProcess();
    }
  });

  // Process initial content
  debouncedProcess();

  // Start clipboard monitoring if enabled
  if (config.useClipboard) {
    clipboardMonitorInterval = setInterval(() => {
      monitorClipboard(state);
    }, 50);
  }

  // Create handle
  const handle: ListenerHandle = {
    id: generateId(),
    filePath: config.filePath,
    stop: async () => {
      unwatchFile(config.filePath);
      debouncedProcess.cancel();
      if (clipboardMonitorInterval) {
        clearInterval(clipboardMonitorInterval);
        clipboardMonitorInterval = null;
      }
      activeListeners.delete(config.filePath);
    }
  };

  // Track active listener
  activeListeners.set(config.filePath, handle);

  return handle;
}

export async function stopListener(handle: ListenerHandle): Promise<void> {
  await handle.stop();
}
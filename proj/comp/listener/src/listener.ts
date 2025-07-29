import { watchFile, unwatchFile, Stats } from 'fs';
import { readFile, writeFile, access, constants } from 'fs/promises';
import { dirname, join } from 'path';
import clipboard from 'clipboardy';

import type { ListenerConfig, ListenerHandle, ListenerState } from './types.js';
import { ListenerError } from './errors.js';
import { Slupe } from '../../orch/src/index.js';
import { formatSummary, formatFullOutput } from './formatters.js';
import { computeContentHash } from './utils.js';

// Module-level state for tracking active listeners
const activeListeners = new Map<string, ListenerHandle>();

// Clipboard monitoring state
interface ClipboardEntry {
  content: string;
  timestamp: number;
}

interface ClipboardMonitorState {
  lastEntry: ClipboardEntry | null;
  previousNonEmpty: ClipboardEntry | null;  // Track the last non-empty content
  interval: NodeJS.Timeout | null;
}

// Strip prepended summary section if present
function stripSummarySection(content: string): string {
  const marker = '=== END ===';
  const i = content.lastIndexOf(marker);
  return i === -1 ? content : content.slice(i + marker.length).trimStart();
}

// Extract NESL end delimiters from content
function extractEndDelimiters(content: string): Set<string> {
  const endPattern = /#!end_([a-zA-Z0-9_-]+)\b/g;
  const delimiters = new Set<string>();
  let match;
  while ((match = endPattern.exec(content)) !== null) {
    if (match[1]) {
      delimiters.add(match[1]);
    }
  }
  return delimiters;
}



// Check clipboard for input trigger pattern
async function checkClipboardTrigger(current: ClipboardEntry, state: ListenerState): Promise<void> {
  const lastClipboard = state.clipboardMonitor?.lastEntry;
  
  console.log('[CLIP-TRIGGER] Entry:', {
    hasLastClipboard: !!lastClipboard,
    timeDiff: lastClipboard ? current.timestamp - lastClipboard.timestamp : 0,
    currentLen: current.content.length,
    lastLen: lastClipboard?.content.length,
    currentPreview: current.content.substring(0, 50).replace(/\n/g, '\\n')
  });

  // Skip comparison if either clipboard is empty - these are intermediate states
  if (current.content.length === 0 || lastClipboard?.content.length === 0) {
    console.log('[CLIP-TRIGGER] Exit: empty clipboard state');
    // Only update lastEntry if current is non-empty
    if (state.clipboardMonitor && current.content.length > 0) {
      state.clipboardMonitor.lastEntry = current;
    }
    return;
  }

  if (!lastClipboard || current.timestamp - lastClipboard.timestamp > 1800) {
    console.log('[CLIP-TRIGGER] Exit: timeout or no lastClipboard', {
      lastClipTimestamp: lastClipboard?.timestamp,
      currentTimestamp: current.timestamp,
      diff: lastClipboard ? current.timestamp - lastClipboard.timestamp : 'N/A'
    });
    if (state.clipboardMonitor) {
      state.clipboardMonitor.lastEntry = current;
    }
    return;
  }

  // Determine smaller/larger
  const [smaller, larger] = current.content.length < lastClipboard.content.length
    ? [current.content, lastClipboard.content]
    : [lastClipboard.content, current.content];

  console.log('[CLIP-TRIGGER] Size comparison:', {
    smallerLen: smaller.length,
    largerLen: larger.length,
    smallerPreview: smaller.substring(0, 100).replace(/\n/g, '\\n')
  });

  // Extract end delimiters from both
  const smallerDelimiters = extractEndDelimiters(smaller);
  const largerDelimiters = extractEndDelimiters(larger);
  
  console.log('[CLIP-TRIGGER] Smaller delimiters:', Array.from(smallerDelimiters));
  console.log('[CLIP-TRIGGER] Larger delimiters:', Array.from(largerDelimiters));
  
  // Find common delimiters
  const commonDelimiters = [...smallerDelimiters].filter(d => largerDelimiters.has(d));
  console.log('[CLIP-TRIGGER] Common delimiters:', commonDelimiters);
  
  if (commonDelimiters.length === 0) {
    console.log('[CLIP-TRIGGER] Exit: no common end delimiters');
    if (state.clipboardMonitor) {
      state.clipboardMonitor.lastEntry = current;
    }
    return;
  }

  // Check if smaller content contains NESL
  const hasNesl = smaller.includes('#!nesl');
  console.log('[CLIP-TRIGGER] Smaller content has NESL:', hasNesl);
  
  if (!hasNesl) {
    console.log('[CLIP-TRIGGER] Exit: no NESL in smaller content');
    if (state.clipboardMonitor) {
      state.clipboardMonitor.lastEntry = current;
    }
    return;
  }
  
  // Found matching delimiters and NESL - trigger processing
  console.log('[CLIP-TRIGGER] Writing to file and processing');
  await writeFile(state.inputPath, smaller);
  if (state.debug) {
    console.log(`Clipboard trigger: wrote ${smaller.length} chars to input file`);
  }
  // Immediately process the file change instead of waiting for file watcher
  await processFileChange(state.inputPath, state);

  if (state.clipboardMonitor) {
    state.clipboardMonitor.lastEntry = current;
  }
}

// Monitor clipboard for input patterns
async function monitorClipboard(state: ListenerState): Promise<void> {
  if (!state.clipboardMonitor) return;
  
  try {
    const content = await clipboard.read();
    const current = { content, timestamp: Date.now() };
    const lastClipboard = state.clipboardMonitor.lastEntry;

    if (lastClipboard && current.content !== lastClipboard.content) {
      console.log('[CLIP-MONITOR] Change detected, calling trigger check');
      console.log('[CLIP-MONITOR] Old length:', lastClipboard.content.length, 'New length:', current.content.length);
      await checkClipboardTrigger(current, state);
    } else if (!lastClipboard) {
      console.log('[CLIP-MONITOR] Setting initial clipboard');
      state.clipboardMonitor.lastEntry = current;
    } else {
      // Log every N checks to verify monitor is running
      if (Math.random() < 0.01) {
        console.log('[CLIP-MONITOR] Still monitoring, no changes');
      }
    }
  } catch (error) {
    console.error('[CLIP-MONITOR] Error:', error);
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
  console.log('[PROCESS-CHANGE] Entry:', {
    filePath,
    isProcessing: state.isProcessing,
    caller: new Error().stack?.split('\n')[2]
  });
  
  // Check not already processing
  if (state.isProcessing) {
    console.log('[PROCESS-CHANGE] Already processing, skipping');
    return;
  }

  try {
    state.isProcessing = true;
    console.log('[PROCESS-CHANGE] Lock acquired');

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
    console.log('[PROCESS-CHANGE] Executing content length:', fullContent.length);
    console.log('[PROCESS-CHANGE] Content preview:', fullContent.substring(0, 200).replace(/\n/g, '\\n'));
    
    const slupe = await Slupe.create({ gitCommit: false });
    const orchResult = await slupe.execute(fullContent);
    
    console.log('[PROCESS-CHANGE] Execution complete:', {
      hasResults: !!orchResult.results,
      resultCount: orchResult.results?.length || 0,
      hasErrors: !!orchResult.parseErrors,
      errorCount: orchResult.parseErrors?.length || 0,
      executedActions: orchResult.executedActions
    });

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
    
    console.log('[PROCESS-CHANGE] Formatted output:', {
      summaryLength: summary.length,
      summaryPreview: summary.substring(0, 100).replace(/\n/g, '\\n'),
      fullOutputLength: fullOutput.length,
      fullOutputPreview: fullOutput.substring(0, 200).replace(/\n/g, '\\n'),
      containsExpected: fullOutput.includes('✅ file_write')
    });

    // Copy to clipboard if enabled
    let clipboardSuccess = false;
    let clipboardStatus = '';

    if (state.useClipboard) {
      console.log('[PROCESS] Writing to clipboard, length:', fullOutput.length);
      console.log('[PROCESS] Output preview:', fullOutput.substring(0, 200).replace(/\n/g, '\\n'));
      try {
        await clipboard.write(fullOutput);
        clipboardSuccess = true;
        console.log('[PROCESS] Clipboard write successful');
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
    console.log('[START] Clipboard monitoring enabled');
    // Initialize clipboard monitor for this listener instance
    state.clipboardMonitor = {
      lastEntry: null,
      interval: setInterval(() => {
        monitorClipboard(state);
      }, 50)
    };
  }

  // Create handle
  const handle: ListenerHandle = {
    id: generateId(),
    filePath: config.filePath,
    stop: async () => {
      unwatchFile(config.filePath);
      debouncedProcess.cancel();
      if (state.clipboardMonitor?.interval) {
        clearInterval(state.clipboardMonitor.interval);
        state.clipboardMonitor.interval = null;
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
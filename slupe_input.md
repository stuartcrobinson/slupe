I'll implement all the performance improvements. Let me start with the file-watcher.ts changes to use fs.watch instead of watchFile:

```sh nesl
#!nesl [@three-char-SHA-256: a3f]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/file-watcher.ts"
old_text = <<'EOT_a3f'
import { watchFile, unwatchFile, Stats } from 'fs';
import { access, constants } from 'fs/promises';
import { ListenerError } from './errors.js';

export interface WatchHandle {
  stop: () => void;
}

export class FileWatcher {
  private activeWatches = new Map<string, WatchHandle>();

  async watch(
    filePath: string,
    onChange: () => void,
    debounceMs: number = 500
  ): Promise<WatchHandle> {
    if (this.activeWatches.has(filePath)) {
      throw new ListenerError('ALREADY_WATCHING', filePath);
    }

    try {
      await access(filePath, constants.F_OK);
    } catch (error) {
      throw new ListenerError('FILE_NOT_FOUND', filePath);
    }

    const debouncedOnChange = this.debounce(onChange, debounceMs);

    watchFile(filePath, { interval: 500 }, (curr: Stats, prev: Stats) => {
      if (curr.mtime !== prev.mtime) {
        debouncedOnChange();
      }
    });

    const handle: WatchHandle = {
      stop: () => {
        unwatchFile(filePath);
        debouncedOnChange.cancel();
        this.activeWatches.delete(filePath);
      }
    };

    this.activeWatches.set(filePath, handle);
    return handle;
  }
EOT_a3f
new_text = <<'EOT_a3f'
import { watch, FSWatcher } from 'fs';
import { access, constants } from 'fs/promises';
import { ListenerError } from './errors.js';

export interface WatchHandle {
  stop: () => void;
}

export class FileWatcher {
  private activeWatches = new Map<string, { handle: WatchHandle; watcher: FSWatcher }>();

  async watch(
    filePath: string,
    onChange: () => void,
    debounceMs: number = 200
  ): Promise<WatchHandle> {
    if (this.activeWatches.has(filePath)) {
      throw new ListenerError('ALREADY_WATCHING', filePath);
    }

    try {
      await access(filePath, constants.F_OK);
    } catch (error) {
      throw new ListenerError('FILE_NOT_FOUND', filePath);
    }

    const debouncedOnChange = this.debounce(onChange, debounceMs);

    const watcher = watch(filePath, (eventType, filename) => {
      if (eventType === 'change') {
        debouncedOnChange();
      }
    });

    const handle: WatchHandle = {
      stop: () => {
        watcher.close();
        debouncedOnChange.cancel();
        this.activeWatches.delete(filePath);
      }
    };

    this.activeWatches.set(filePath, { handle, watcher });
    return handle;
  }
EOT_a3f
#!end_a3f
```

```sh nesl
#!nesl [@three-char-SHA-256: b2k]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/file-watcher.ts"
old_text = <<'EOT_b2k'
  stopAll(): void {
    for (const [_, handle] of this.activeWatches) {
      handle.stop();
    }
    this.activeWatches.clear();
  }
EOT_b2k
new_text = <<'EOT_b2k'
  stopAll(): void {
    for (const [_, { handle }] of this.activeWatches) {
      handle.stop();
    }
    this.activeWatches.clear();
  }
EOT_b2k
#!end_b2k
```

Now let's update the types.ts to add the Slupe instance to ListenerState:

```sh nesl
#!nesl [@three-char-SHA-256: c5x]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/types.ts"
old_text = <<'EOT_c5x'
export interface ListenerState {
  lastExecutedHash: string;
  isProcessing: boolean;
  outputPath: string;
  inputPath: string;
  actionSchema?: Map<string, ActionDefinition>;
  debug?: boolean;
  useClipboard: boolean;
  clipboardMonitor?: {
    lastEntry: { content: string; timestamp: number } | null;
    interval: NodeJS.Timeout | null;
  };
}
EOT_c5x
new_text = <<'EOT_c5x'
export interface ListenerState {
  lastExecutedHash: string;
  isProcessing: boolean;
  outputPath: string;
  inputPath: string;
  actionSchema?: Map<string, ActionDefinition>;
  debug?: boolean;
  useClipboard: boolean;
  slupeInstance?: any;
  clipboardMonitor?: {
    lastEntry: { content: string; timestamp: number } | null;
    interval: NodeJS.Timeout | null;
  };
}
EOT_c5x
#!end_c5x
```

Now let's update content-processor.ts to reuse Slupe instance and add timing logs:

```sh nesl
#!nesl [@three-char-SHA-256: d7m]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/content-processor.ts"
old_text = <<'EOT_d7m'
export async function processContent(
  content: string,
  lastHash: string,
  debug?: boolean,
  repoPath?: string
): Promise<ProcessResult | null> {
EOT_d7m
new_text = <<'EOT_d7m'
export async function processContent(
  content: string,
  lastHash: string,
  debug?: boolean,
  repoPath?: string,
  slupeInstance?: any
): Promise<ProcessResult | null> {
EOT_d7m
#!end_d7m
```

```sh nesl
#!nesl [@three-char-SHA-256: e8n]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/content-processor.ts"
old_text = <<'EOT_e8n'
  const stripped = stripSummarySection(content);
  const hash = computeContentHash(stripped.trim());

  // console.log('DEBUG: Creating Slupe instance...');
  const slupe = await Slupe.create({ 
    gitCommit: false,
    repoPath 
  });
  // console.log('DEBUG: Executing content...');
  const orchResult = await slupe.execute(content);
  // console.log('DEBUG: Execution complete, hookErrors:', orchResult.hookErrors);
EOT_e8n
new_text = <<'EOT_e8n'
  const stripped = stripSummarySection(content);
  const hash = computeContentHash(stripped.trim());

  if (debug) console.time('slupe-create');
  const slupe = slupeInstance || await Slupe.create({ 
    gitCommit: false,
    repoPath 
  });
  if (debug && !slupeInstance) console.timeEnd('slupe-create');
  
  if (debug) console.time('slupe-execute');
  const orchResult = await slupe.execute(content);
  if (debug) console.timeEnd('slupe-execute');
EOT_e8n
#!end_e8n
```

```sh nesl
#!nesl [@three-char-SHA-256: f9p]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/content-processor.ts"
old_text = <<'EOT_f9p'
  return {
    summary,
    fullOutput,
    hash,
    originalContent: content,
    executedActions: orchResult.executedActions,
    errors: orchResult.parseErrors
  };
EOT_f9p
new_text = <<'EOT_f9p'
  return {
    summary,
    fullOutput,
    hash,
    originalContent: content,
    executedActions: orchResult.executedActions,
    errors: orchResult.parseErrors,
    slupeInstance: slupe
  };
EOT_f9p
#!end_f9p
```

Update the ProcessResult interface:

```sh nesl
#!nesl [@three-char-SHA-256: g3q]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/content-processor.ts"
old_text = <<'EOT_g3q'
export interface ProcessResult {
  summary: string;
  fullOutput: string;
  hash: string;
  originalContent: string;
  executedActions?: number;
  errors?: any[];
}
EOT_g3q
new_text = <<'EOT_g3q'
export interface ProcessResult {
  summary: string;
  fullOutput: string;
  hash: string;
  originalContent: string;
  executedActions?: number;
  errors?: any[];
  slupeInstance?: any;
}
EOT_g3q
#!end_g3q
```

Now let's update listener.ts to pass and store the Slupe instance:

```sh nesl
#!nesl [@three-char-SHA-256: h4r]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/listener.ts"
old_text = <<'EOT_h4r'
    const result = await processContent(
      fullContent,
      state.lastExecutedHash,
      state.debug,
      dirname(filePath)
    );
EOT_h4r
new_text = <<'EOT_h4r'
    if (state.debug) console.time('processContent-total');
    const result = await processContent(
      fullContent,
      state.lastExecutedHash,
      state.debug,
      dirname(filePath),
      state.slupeInstance
    );
    if (state.debug) console.timeEnd('processContent-total');
EOT_h4r
#!end_h4r
```

```sh nesl
#!nesl [@three-char-SHA-256: i5s]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/listener.ts"
old_text = <<'EOT_i5s'
    // console.log('DEBUG: Writing outputs...');
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
      // console.log('DEBUG: Outputs written successfully');
      
      // Verify the write actually happened
      // const verifyContent = await readFile(filePath, 'utf-8');
      // console.log('DEBUG: Verified file content starts with:', verifyContent.substring(0, 50));
    } catch (writeError) {
      console.error('DEBUG: Error writing outputs:', writeError);
      throw writeError;
    }

    state.lastExecutedHash = result.hash;
EOT_i5s
new_text = <<'EOT_i5s'
    if (state.debug) console.time('write-outputs');
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
    if (state.debug) console.timeEnd('write-outputs');

    state.lastExecutedHash = result.hash;
    
    if (result.slupeInstance && !state.slupeInstance) {
      state.slupeInstance = result.slupeInstance;
    }
EOT_i5s
#!end_i5s
```

Update the default debounce time in the listener:

```sh nesl
#!nesl [@three-char-SHA-256: j6t]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/listener.ts"
old_text = <<'EOT_j6t'
  const watchHandle = await fileWatcher.watch(
    config.filePath,
    processHandler,
    config.debounceMs || 500
  );
EOT_j6t
new_text = <<'EOT_j6t'
  const watchHandle = await fileWatcher.watch(
    config.filePath,
    processHandler,
    config.debounceMs || 200
  );
EOT_j6t
#!end_j6t
```

These changes implement all the performance improvements:

1. **Switched from `fs.watchFile` to `fs.watch`** - Using OS-level file watching for instant detection
2. **Reduced default debounce from 500ms to 200ms** - Faster response time
3. **Reuse Slupe instance** - The instance is created once and stored in the state
4. **Added timing logs** - When debug is enabled, you'll see exactly where time is spent
5. **Streamlined the file watching** - More efficient file system monitoring

The changes should make the listener feel much more responsive. You can run it with `debug: true` in the config to see the timing information and identify any remaining bottlenecks.
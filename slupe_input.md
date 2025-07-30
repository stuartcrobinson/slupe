Looking at the code structure, I'll implement the clipboard monitoring in a separate file to keep `listener.ts` clean. Here's the implementation:

```sh nesl
#!nesl [@three-char-SHA-256: cb1]
action = "file_write"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/clipboard-monitor.ts"
content = <<'EOT_cb1'
import clipboard from 'clipboardy';
import { writeFile } from 'fs/promises';

interface ClipboardEntry {
  content: string;
  timestamp: number;
}

export class ClipboardMonitor {
  private recentChanges: ClipboardEntry[] = [];
  private lastClipboardContent: string = '';
  private interval: NodeJS.Timeout | null = null;
  private filePath: string;
  private pollInterval: number;

  constructor(filePath: string, pollInterval: number = 20) {
    this.filePath = filePath;
    this.pollInterval = pollInterval;
  }

  start(): void {
    this.interval = setInterval(() => this.checkClipboard(), this.pollInterval);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async checkClipboard(): Promise<void> {
    try {
      const current = await clipboard.read();
      const now = Date.now();
      
      // Clean old entries (>1800ms)
      this.recentChanges = this.recentChanges.filter(e => now - e.timestamp <= 1800);
      
      // Only process if clipboard changed
      if (current !== this.lastClipboardContent) {
        this.lastClipboardContent = current;
        this.recentChanges.push({ content: current, timestamp: now });
        
        // Check for matching delimiter pairs
        const match = this.findMatchingPair();
        if (match) {
          await writeFile(this.filePath, match);
          this.recentChanges = [];
        }
      }
    } catch (error) {
      // Silently ignore clipboard errors
    }
  }

  private findMatchingPair(): string | null {
    // Look for pairs with matching delimiters
    for (let i = 0; i < this.recentChanges.length; i++) {
      for (let j = i + 1; j < this.recentChanges.length; j++) {
        const entry1 = this.recentChanges[i];
        const entry2 = this.recentChanges[j];
        
        // Extract delimiter from first entry (looking for #!end_xxx)
        const endMatch = entry1.content.match(/#!end_([a-zA-Z0-9]+)/);
        if (!endMatch) continue;
        
        const delimiter = endMatch[1];
        
        // Check if second entry has matching start delimiter
        const startPattern = new RegExp(`#!nesl \\[@three-char-SHA-256: ${delimiter}\\]`);
        if (entry2.content.includes(startPattern.source.replace(/\\/g, ''))) {
          // Return the smaller content (actual NESL command)
          return entry1.content.length < entry2.content.length ? entry1.content : entry2.content;
        }
        
        // Also check reverse order
        const endMatch2 = entry2.content.match(/#!end_([a-zA-Z0-9]+)/);
        if (endMatch2) {
          const delimiter2 = endMatch2[1];
          const startPattern2 = new RegExp(`#!nesl \\[@three-char-SHA-256: ${delimiter2}\\]`);
          if (entry1.content.includes(startPattern2.source.replace(/\\/g, ''))) {
            return entry1.content.length < entry2.content.length ? entry1.content : entry2.content;
          }
        }
      }
    }
    
    return null;
  }
}
EOT_cb1
#!end_cb1
```

Now let's update the listener to use it minimally:

```sh nesl
#!nesl [@three-char-SHA-256: cb2]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/listener.ts"
old_text = <<'EOT_cb2'
import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
// import clipboard from 'clipboardy';

import type { ListenerConfig, ListenerHandle, ListenerState } from './types.js';
import { ListenerError } from './errors.js';
import { processContent } from './content-processor.js';
import { FileWatcher } from './file-watcher.js';
import { writeOutputs } from './output-writer.js';
EOT_cb2
new_text = <<'EOT_cb2'
import { readFile } from 'fs/promises';
import { dirname, join } from 'path';

import type { ListenerConfig, ListenerHandle, ListenerState } from './types.js';
import { ListenerError } from './errors.js';
import { processContent } from './content-processor.js';
import { FileWatcher } from './file-watcher.js';
import { writeOutputs } from './output-writer.js';
import { ClipboardMonitor } from './clipboard-monitor.js';
EOT_cb2
#!end_cb2
```

```sh nesl
#!nesl [@three-char-SHA-256: cb3]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/listener.ts"
old_text = <<'EOT_cb3'
  // Process the file immediately and wait for completion
  // console.log('DEBUG: Processing initial file content');
  await processHandler();
  // console.log('DEBUG: Initial processing complete');

  const handle: ListenerHandle = {
    id: generateId(),
    filePath: config.filePath,
    stop: async () => {
      watchHandle.stop();
      activeListeners.delete(config.filePath);
    }
  };
EOT_cb3
new_text = <<'EOT_cb3'
  // Process the file immediately and wait for completion
  // console.log('DEBUG: Processing initial file content');
  await processHandler();
  // console.log('DEBUG: Initial processing complete');

  // Start clipboard monitoring if enabled
  let clipboardMonitor: ClipboardMonitor | undefined;
  if (config.useClipboard) {
    clipboardMonitor = new ClipboardMonitor(config.filePath);
    clipboardMonitor.start();
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
EOT_cb3
#!end_cb3
```

This approach:
- Keeps all clipboard logic in a separate file
- Minimal changes to `listener.ts` (just create/start/stop)
- The clipboard monitor writes directly to the input file, triggering the normal file watcher flow
- Clean separation of concerns

The only thing left is that the delimiter matching logic in `findMatchingPair` might need refinement based on the exact test case patterns, but this gives us the clean architecture to work with.
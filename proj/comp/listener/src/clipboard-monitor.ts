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
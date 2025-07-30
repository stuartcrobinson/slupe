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
        console.log('Clipboard changed, content length:', current.length);
        console.log('Content preview:', current.substring(0, 100));
        
        this.lastClipboardContent = current;
        this.recentChanges.push({ content: current, timestamp: now });
        
        // Check for matching delimiter pairs
        const match = this.findMatchingPair();
        if (match) {
          console.log('Match found! Writing to file:', this.filePath);
          await writeFile(this.filePath, match);
          this.recentChanges = [];
        }
      }
    } catch (error) {
      console.error('Clipboard error:', error);
    }
  }

  private findMatchingPair(): string | null {
    console.log('Checking for matching pairs, entries:', this.recentChanges.length);
    
    // Look for pairs with matching delimiters
    for (let i = 0; i < this.recentChanges.length; i++) {
      for (let j = 0; j < this.recentChanges.length; j++) {
        if (i === j) continue;
        
        const entry1 = this.recentChanges[i];
        const entry2 = this.recentChanges[j];
        
        // Extract delimiter from entries (looking for #!end_xxx)
        const endMatch1 = entry1.content.match(/#!end_([a-zA-Z0-9]+)/);
        const endMatch2 = entry2.content.match(/#!end_([a-zA-Z0-9]+)/);
        
        if (endMatch1) {
          const delimiter = endMatch1[1];
          console.log('Found end delimiter in entry', i, ':', delimiter);
          
          // Check if other entry has matching start delimiter
          if (entry2.content.includes(`#!nesl [@three-char-SHA-256: ${delimiter}]`)) {
            console.log('Found matching start in entry', j);
            // Return the smaller content (actual NESL command)
            return entry1.content.length < entry2.content.length ? entry1.content : entry2.content;
          }
        }
        
        if (endMatch2) {
          const delimiter = endMatch2[1];
          console.log('Found end delimiter in entry', j, ':', delimiter);
          
          // Check if other entry has matching start delimiter
          if (entry1.content.includes(`#!nesl [@three-char-SHA-256: ${delimiter}]`)) {
            console.log('Found matching start in entry', i);
            // Return the smaller content (actual NESL command)
            return entry1.content.length < entry2.content.length ? entry1.content : entry2.content;
          }
        }
      }
    }
    
    console.log('No matching pairs found');
    return null;
  }
}
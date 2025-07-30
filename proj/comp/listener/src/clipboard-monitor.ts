import clipboard from 'clipboardy';
import { writeFile } from 'fs/promises';

interface ClipboardEntry {
  content: string;
  timestamp: number | null;
}

export class ClipboardMonitor {
  private recentChanges: ClipboardEntry[] = [];
  private lastClipboardContent: string = '';
  private interval: NodeJS.Timeout | null = null;
  private filePath: string;
  private pollInterval: number;
  private checkCount: number = 0;
  private isInitialized: boolean = false;

  constructor(filePath: string, pollInterval: number = 20) {
    this.filePath = filePath;
    this.pollInterval = pollInterval;
  }

  async start(): Promise<void> {
    console.log('[ClipboardMonitor] Starting with poll interval:', this.pollInterval);
    
    // Initialize with current clipboard content and mark it with null timestamp
    try {
      this.lastClipboardContent = await clipboard.read();
      console.log('[ClipboardMonitor] Initialized with existing clipboard content length:', this.lastClipboardContent.length);
      
      // Add pre-existing content with null timestamp
      if (this.lastClipboardContent) {
        this.recentChanges.push({ content: this.lastClipboardContent, timestamp: null });
        console.log('[ClipboardMonitor] Added pre-existing content with null timestamp');
      }
    } catch (error) {
      console.log('[ClipboardMonitor] Could not read initial clipboard:', error);
      this.lastClipboardContent = '';
    }
    
    this.isInitialized = true;
    this.interval = setInterval(() => this.checkClipboard(), this.pollInterval);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    // Clear recent changes to prevent any pending matches
    this.recentChanges = [];
    this.isInitialized = false;
  }

  private async checkClipboard(): Promise<void> {
    if (!this.isInitialized) return;
    
    this.checkCount++;
    
    // Log every 10th check to verify polling is happening
    if (this.checkCount % 10 === 0) {
      console.log(`[ClipboardMonitor] Polling check #${this.checkCount}`);
    }
    
    try {
      const current = await clipboard.read();
      const now = Date.now();
      
      // Clean old entries (>1800ms) and null timestamp entries
      const beforeClean = this.recentChanges.length;
      this.recentChanges = this.recentChanges.filter(e => e.timestamp !== null && now - e.timestamp <= 1800);
      if (beforeClean !== this.recentChanges.length) {
        console.log(`[ClipboardMonitor] Cleaned ${beforeClean - this.recentChanges.length} old entries`);
      }
      
      // Only process if clipboard changed
      if (current !== this.lastClipboardContent) {
        console.log(`[ClipboardMonitor] Check #${this.checkCount}: Clipboard changed!`);
        console.log(`  Content length: ${current.length}`);
        console.log(`  Content preview: ${current.substring(0, 100).replace(/\n/g, '\\n')}`);
        console.log(`  Recent changes array size: ${this.recentChanges.length} -> ${this.recentChanges.length + 1}`);
        
        this.lastClipboardContent = current;
        this.recentChanges.push({ content: current, timestamp: now });
        
        // Log all entries with their delimiters
        console.log(`[ClipboardMonitor] Current entries:`);
        this.recentChanges.forEach((entry, i) => {
          const endMatch = entry.content.match(/^#!end_([a-zA-Z0-9]+)/m);
          console.log(`  [${i}] timestamp: ${entry.timestamp === null ? 'null' : entry.timestamp}, length: ${entry.content.length}, delimiter: ${endMatch ? endMatch[1] : 'none'}`);
        });
        
        // Check for matching delimiter pairs
        const match = this.findMatchingPair();
        if (match) {
          console.log('[ClipboardMonitor] Match found! Writing to file:', this.filePath);
          await writeFile(this.filePath, match);
          this.recentChanges = [];
        }
      }
    } catch (error) {
      console.error('[ClipboardMonitor] Error:', error);
    }
  }

  private findMatchingPair(): string | null {
    console.log('[ClipboardMonitor] Checking for matching pairs, entries:', this.recentChanges.length);
    
    // Look for pairs with matching delimiters, skip null timestamp entries
    for (let i = 0; i < this.recentChanges.length; i++) {
      for (let j = 0; j < this.recentChanges.length; j++) {
        if (i === j) continue;
        
        const entry1 = this.recentChanges[i];
        const entry2 = this.recentChanges[j];
        
        // Skip entries with null timestamps
        if (entry1.timestamp === null || entry2.timestamp === null) {
          continue;
        }
        
        // Extract delimiter from entries (looking for #!end_xxx)
        // Must be at start of a line
        const endMatch1 = entry1.content.match(/^#!end_([a-zA-Z0-9]+)/m);
        const endMatch2 = entry2.content.match(/^#!end_([a-zA-Z0-9]+)/m);
        
        console.log(`[ClipboardMonitor]   Comparing [${i}] and [${j}]:`);
        console.log(`    [${i}] delimiter: ${endMatch1 ? endMatch1[1] : 'none'}`);
        console.log(`    [${j}] delimiter: ${endMatch2 ? endMatch2[1] : 'none'}`);
        
        if (endMatch1 && endMatch2) {
          const delimiter1 = endMatch1[1];
          const delimiter2 = endMatch2[1];
          
          // If both entries have the same end delimiter, they match
          if (delimiter1 === delimiter2) {
            console.log(`[ClipboardMonitor] Found matching delimiters: ${delimiter1}`);
            console.log(`  Entry [${i}] length: ${entry1.content.length}`);
            console.log(`  Entry [${j}] length: ${entry2.content.length}`);
            const smaller = entry1.content.length < entry2.content.length ? entry1.content : entry2.content;
            console.log(`  Returning the smaller entry (length ${smaller.length})`);
            // Return the smaller content (actual NESL command)
            return smaller;
          }
        }
      }
    }
    
    console.log('[ClipboardMonitor] No matching pairs found');
    return null;
  }
}
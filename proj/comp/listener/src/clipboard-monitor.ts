import clipboard from 'clipboardy';
import { writeFile } from 'fs/promises';

interface ClipboardEntry {
  content: string;
  timestamp: number | null;
  detectedAt: number;
  checkNumber: number;
}

interface TransitionEvent {
  from: { length: number; preview: string };
  to: { length: number; preview: string };
  duration: number;
  checkNumber: number;
}

export class ClipboardMonitor {
  private recentChanges: ClipboardEntry[] = [];
  private lastClipboardContent: string = '';
  private interval: NodeJS.Timeout | null = null;
  private filePath: string;
  private pollInterval: number;
  private checkCount: number = 0;
  private isInitialized: boolean = false;
  private isChecking: boolean = false;
  
  private transitions: TransitionEvent[] = [];
  private lastChangeTime: number = 0;
  private unstableUntil: number = 0;
  private diagnosticMode: boolean = true;
  
  // New diagnostic fields
  private clipboardAccessLog: string[] = [];
  private contentHashes: Map<string, string> = new Map();

  constructor(filePath: string, pollInterval: number = 50) {
    this.filePath = filePath;
    this.pollInterval = pollInterval;
  }

  private logClipboardAccess(operation: string, duration: number, result: any) {
    const timestamp = Date.now();
    const entry = `[${timestamp}] ${operation} took ${duration}ms, result: ${
      typeof result === 'string' ? `string(len=${result.length})` : JSON.stringify(result)
    }`;
    this.clipboardAccessLog.push(entry);
    if (this.diagnosticMode && operation.includes('read')) {
      console.log(`[ClipboardMonitor.${operation}] ${entry}`);
    }
  }

  private getContentHash(content: string): string {
    // Simple hash for debugging
    return `${content.length}-${content.slice(0, 10).replace(/\n/g, '\\n')}-${content.slice(-10).replace(/\n/g, '\\n')}`;
  }

  async start(): Promise<void> {
    console.log('[ClipboardMonitor] Starting with poll interval:', this.pollInterval);
    console.log('[ClipboardMonitor] DIAGNOSTIC MODE ENABLED');

    try {
      const readStart = Date.now();
      this.lastClipboardContent = await clipboard.read();
      const readDuration = Date.now() - readStart;
      this.logClipboardAccess('start.read', readDuration, this.lastClipboardContent);
      
      console.log('[ClipboardMonitor] Initialized with existing clipboard content length:', this.lastClipboardContent.length);
      console.log('[ClipboardMonitor] Initial content hash:', this.getContentHash(this.lastClipboardContent));

      if (this.lastClipboardContent) {
        this.recentChanges.push({ 
          content: this.lastClipboardContent, 
          timestamp: null,
          detectedAt: Date.now(),
          checkNumber: 0
        });
        console.log('[ClipboardMonitor] Added pre-existing content with null timestamp');
      }
    } catch (error) {
      console.log('[ClipboardMonitor] Could not read initial clipboard:', error);
      this.lastClipboardContent = '';
    }

    this.isInitialized = true;
    this.scheduleNextCheck();
  }

  private scheduleNextCheck(): void {
    const now = Date.now();
    const baseInterval = this.pollInterval;
    
    let nextInterval = baseInterval;
    if (now < this.unstableUntil) {
      nextInterval = 1;
      if (this.diagnosticMode) {
        console.log(`[ClipboardMonitor] Using fast polling (${nextInterval}ms) until ${this.unstableUntil - now}ms from now`);
      }
    }
    
    this.interval = setTimeout(async () => {
      if (this.isChecking) {
        console.log('[ClipboardMonitor] Skipping check - previous check still running');
        this.scheduleNextCheck();
        return;
      }
      try {
        this.isChecking = true;
        await this.checkClipboard();
      } finally {
        this.isChecking = false;
        if (this.isInitialized) {
          this.scheduleNextCheck();
        }
      }
    }, nextInterval);
  }

  stop(): void {
    if (this.interval) {
      clearTimeout(this.interval);
      this.interval = null;
    }
    this.recentChanges = [];
    this.isInitialized = false;
    
    if (this.diagnosticMode) {
      console.log('\n[ClipboardMonitor] === DIAGNOSTIC SUMMARY ===');
      console.log('Transitions detected:');
      this.transitions.forEach((t, i) => {
        console.log(`  [${i}] Check #${t.checkNumber}: ${t.from.length} → ${t.to.length} bytes (${t.duration}ms)`);
        if (t.from.length === 0 && t.to.length > 1000) {
          console.log(`       ^ Large content appeared after empty! Took ${t.duration}ms`);
        }
      });
      
      console.log('\nClipboard access patterns:');
      const readOps = this.clipboardAccessLog.filter(log => log.includes('check.read'));
      console.log(`  Total read operations: ${readOps.length}`);
      
      // Find suspicious patterns
      const emptyReads = readOps.filter(log => log.includes('string(len=0)'));
      if (emptyReads.length > 0) {
        console.log(`  Empty clipboard reads: ${emptyReads.length}`);
      }
      
      // Log any slow operations
      const slowOps = this.clipboardAccessLog.filter(log => {
        const match = log.match(/took (\d+)ms/);
        return match && parseInt(match[1]) > 50;
      });
      if (slowOps.length > 0) {
        console.log(`  Slow operations (>50ms): ${slowOps.length}`);
        slowOps.forEach(op => console.log(`    ${op}`));
      }
    }
  }

  private async checkClipboard(): Promise<void> {
    if (!this.isInitialized) return;

    this.checkCount++;
    const checkStart = Date.now();

    if (this.checkCount % 50 === 0 && this.recentChanges.length > 0) {
      console.log(`[ClipboardMonitor] === State at check #${this.checkCount} ===`);
      this.recentChanges.forEach((entry, i) => {
        const preview = entry.content.substring(0, 30).replace(/\n/g, '\\n');
        const hasDelim = entry.content.includes('#!end_');
        const age = entry.timestamp ? checkStart - entry.timestamp : 'null';
        console.log(`  [${i}] len:${entry.content.length} age:${age}ms check#:${entry.checkNumber} preview:"${preview}..." has#!end_:${hasDelim}`);
      });
    }

    try {
      const readStart = Date.now();
      const current = await clipboard.read();
      const readDuration = Date.now() - readStart;
      this.logClipboardAccess('check.read', readDuration, current);
      
      const now = Date.now();

      const beforeClean = this.recentChanges.length;
      this.recentChanges = this.recentChanges.filter(e => e.timestamp !== null && now - e.timestamp <= 1800);
      if (beforeClean !== this.recentChanges.length) {
        console.log(`[ClipboardMonitor] Cleaned ${beforeClean - this.recentChanges.length} old entries`);
      }

      if (current !== this.lastClipboardContent) {
        const currentHash = this.getContentHash(current);
        const lastHash = this.getContentHash(this.lastClipboardContent);
        
        console.log(`[ClipboardMonitor] Check #${this.checkCount}: Content hash changed!`);
        console.log(`  From: ${lastHash}`);
        console.log(`  To:   ${currentHash}`);
        
        const transition: TransitionEvent = {
          from: { 
            length: this.lastClipboardContent.length, 
            preview: this.lastClipboardContent.substring(0, 20).replace(/\n/g, '\\n') 
          },
          to: { 
            length: current.length, 
            preview: current.substring(0, 20).replace(/\n/g, '\\n') 
          },
          duration: this.lastChangeTime ? now - this.lastChangeTime : 0,
          checkNumber: this.checkCount
        };
        this.transitions.push(transition);
        this.lastChangeTime = now;

        if (current === '') {
          console.log(`[ClipboardMonitor] Check #${this.checkCount}: Empty clipboard detected`);
          console.log(`  Previous content: ${this.lastClipboardContent.length} bytes`);
          console.log(`  Time since last change: ${transition.duration}ms`);
          console.log(`  Read operation took: ${readDuration}ms`);
          
          console.log(`  ⚠️  Empty clipboard detected - entering unstable period`);
          this.unstableUntil = now + 500;
        } else {
          console.log(`[ClipboardMonitor] Check #${this.checkCount}: Clipboard changed!`);
          console.log(`  Content length: ${current.length}`);
          console.log(`  Time since last change: ${transition.duration}ms`);
          console.log(`  Read operation took: ${readDuration}ms`);
          
          // Check if this looks like it should be the huge file
          if (current.includes('#!end_k9m') && current.length < 10000) {
            console.log(`  🚨 ANOMALY: Content has huge file delimiter but only ${current.length} bytes!`);
          }
          
          if (this.lastClipboardContent === '' && current.length === 5260) {
            console.log(`  ⚠️  Medium content (5260) appeared after empty - huge file may have been skipped!`);
          }
          
          if (this.lastClipboardContent === '' && current.length > 1000) {
            console.log(`  📊 Large content appeared ${transition.duration}ms after empty!`);
          }
          
          // Check for test inputs
          if (current.includes('valid_complex')) {
            console.log(`  🔍 Detected test-related content in clipboard!`);
          }
        }

        console.log(`  Recent changes array size: ${this.recentChanges.length} -> ${this.recentChanges.length + 1}`);

        this.lastClipboardContent = current;
        if (current.length > 0) {
          // Cancel fast polling when we get real content
          if (this.unstableUntil > now) {
            console.log(`  Canceling fast polling - real content detected`);
            this.unstableUntil = 0;
          }
        }
        
        this.recentChanges.push({ 
          content: current, 
          timestamp: now,
          detectedAt: now,
          checkNumber: this.checkCount
        });

        if (this.diagnosticMode && this.recentChanges.length >= 2) {
          const last = this.recentChanges[this.recentChanges.length - 1];
          const prev = this.recentChanges[this.recentChanges.length - 2];
          if (last && prev && prev.content === '' && last.content.length > 1000) {
            console.log(`  📈 Pattern: empty→large in ${last.detectedAt - prev.detectedAt}ms`);
          }
        }

        console.log(`[ClipboardMonitor] Current entries:`);
        this.recentChanges.forEach((entry, i) => {
          const endMatch = entry.content.match(/^(#!end_[a-zA-Z0-9]+)/m);
          console.log(`  [${i}] timestamp: ${entry.timestamp === null ? 'null' : entry.timestamp}, length: ${entry.content.length}, delimiter: ${endMatch ? endMatch[1] : 'none'}, hash: ${this.getContentHash(entry.content)}`);
        });

        const match = this.findMatchingPair();
        if (match) {
          console.log('[ClipboardMonitor] Match found! Writing to file:', this.filePath);
          const writeStart = Date.now();
          await writeFile(this.filePath, match);
          const writeDuration = Date.now() - writeStart;
          console.log(`[ClipboardMonitor] File write completed in ${writeDuration}ms`);
          this.recentChanges = [];
        }
      }
    } catch (error) {
      console.error('[ClipboardMonitor] Error in check:', error);
      console.error('[ClipboardMonitor] Error details:', {
        checkNumber: this.checkCount,
        recentChangesCount: this.recentChanges.length,
        lastContentLength: this.lastClipboardContent.length
      });
    }
    
    const checkDuration = Date.now() - checkStart;
    if (checkDuration > 20) {
      console.log(`[ClipboardMonitor] Check #${this.checkCount} took ${checkDuration}ms (slow!)`);
    }
  }

  private findMatchingPair(): string | null {
    console.log('[ClipboardMonitor] Checking for matching pairs, entries:', this.recentChanges.length);

    for (let i = 0; i < this.recentChanges.length; i++) {
      for (let j = 0; j < this.recentChanges.length; j++) {
        if (i === j) continue;

        const entry1 = this.recentChanges[i];
        const entry2 = this.recentChanges[j];

        if (!entry1 || !entry2 || entry1.timestamp === null || entry2.timestamp === null) {
          continue;
        }

        const start = Date.now();
        const endMatches1 = Array.from(entry1.content.matchAll(/^(#!end_[a-zA-Z0-9]+)/gm));
        const endMatches2 = Array.from(entry2.content.matchAll(/^(#!end_[a-zA-Z0-9]+)/gm));
        const regexTime = Date.now() - start;
        if (regexTime > 10) {
          console.log(`[ClipboardMonitor] Regex parsing took ${regexTime}ms for entries of length ${entry1.content.length} and ${entry2.content.length}`);
        }

        const delimiters1 = endMatches1.map(m => m[1]);
        const delimiters2 = endMatches2.map(m => m[1]);

        console.log(`[ClipboardMonitor]   Comparing [${i}] and [${j}]:`);
        console.log(`    [${i}] delimiters: ${delimiters1.length > 0 ? delimiters1.join(', ') : 'none'}, hash: ${this.getContentHash(entry1.content)}`);
        console.log(`    [${j}] delimiters: ${delimiters2.length > 0 ? delimiters2.join(', ') : 'none'}, hash: ${this.getContentHash(entry2.content)}`);
        
        if (delimiters1.length === 0 && entry1.content.includes('#!end_')) {
          const idx = entry1.content.indexOf('#!end_');
          console.log(`    [${i}] has #!end_ but not at line start. Context: "${entry1.content.substring(Math.max(0, idx - 10), idx + 20).replace(/\n/g, '\\n')}"`);
        }
        if (delimiters2.length === 0 && entry2.content.includes('#!end_')) {
          const idx = entry2.content.indexOf('#!end_');
          console.log(`    [${j}] has #!end_ but not at line start. Context: "${entry2.content.substring(Math.max(0, idx - 10), idx + 20).replace(/\n/g, '\\n')}"`);
        }

        for (const d1 of delimiters1) {
          for (const d2 of delimiters2) {
            if (d1 === d2) {
              console.log(`[ClipboardMonitor] Found matching delimiter: ${d1}`);
              console.log(`  Entry [${i}] length: ${entry1.content.length}, hash: ${this.getContentHash(entry1.content)}`);
              console.log(`  Entry [${j}] length: ${entry2.content.length}, hash: ${this.getContentHash(entry2.content)}`);
              const smaller = entry1.content.length < entry2.content.length ? entry1.content : entry2.content;
              console.log(`  Returning the smaller entry (length ${smaller.length})`);
              return smaller;
            }
          }
        }
      }
    }

    console.log('[ClipboardMonitor] No matching pairs found');
    return null;
  }
}
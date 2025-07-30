I'll implement your suggestions. First, let me update the test code to write unique content before starting the monitor, and rewrite it after the test:

```sh nesl
#!nesl [@three-char-SHA-256: m3k]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/test/unit/clipboard.test.ts"
old_text = <<'EOT_m3k'
  for (const testCase of cases) {
    it(testCase.name, async () => {
      console.log(`[TEST ${testCase.name}] Test case:`, {
        name: testCase.name,
        inputsCount: testCase.inputs.length,
        expectedOutput: testCase.expectedOutput
      });
      
      const testDir = `/tmp/t_${testCase.name}`;
      const inputFile = join(testRepoPath, 'input.md');
      const outputFile = join(testRepoPath, '.slupe-output-latest.txt');
      
      try {
        await mkdir(testDir, { recursive: true });
        await writeFile(inputFile, '');
        
        handle = await startListener({
          filePath: inputFile,
          useClipboard: true,
          debounceMs: 100
        });
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Write unique content to ensure clipboard monitor detects changes
        const initContent = `init-${testCase.name}-${Date.now()}`;
        console.log(`\n[TEST ${testCase.name}] Writing init content:`, initContent);
        await clipboard.write(initContent);
        await new Promise(resolve => setTimeout(resolve, 30));
EOT_m3k
new_text = <<'EOT_m3k'
  for (const testCase of cases) {
    it(testCase.name, async () => {
      console.log(`[TEST ${testCase.name}] Test case:`, {
        name: testCase.name,
        inputsCount: testCase.inputs.length,
        expectedOutput: testCase.expectedOutput
      });
      
      const testDir = `/tmp/t_${testCase.name}`;
      const inputFile = join(testRepoPath, 'input.md');
      const outputFile = join(testRepoPath, '.slupe-output-latest.txt');
      
      // Write unique content BEFORE starting monitor
      const uniqueContent = `unique-${testCase.name}-${Date.now()}`;
      console.log(`[TEST ${testCase.name}] Writing unique content before monitor start:`, uniqueContent);
      await clipboard.write(uniqueContent);
      
      try {
        await mkdir(testDir, { recursive: true });
        await writeFile(inputFile, '');
        
        handle = await startListener({
          filePath: inputFile,
          useClipboard: true,
          debounceMs: 100
        });
EOT_m3k
#!end_m3k
```

```sh nesl
#!nesl [@three-char-SHA-256: n7p]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/test/unit/clipboard.test.ts"
old_text = <<'EOT_n7p'
      } finally {
        await rm(testDir, { recursive: true, force: true }).catch(() => {});
      }
    });
  }
EOT_n7p
new_text = <<'EOT_n7p'
      } finally {
        // Rewrite unique content before stopping monitor
        if (handle) {
          console.log(`[TEST ${testCase.name}] Rewriting unique content before cleanup:`, uniqueContent);
          await clipboard.write(uniqueContent);
          await handle.stop();
          handle = null;
        }
        
        await rm(testDir, { recursive: true, force: true }).catch(() => {});
      }
    });
  }
EOT_n7p
#!end_n7p
```

Now I need to update the clipboard monitor to handle pre-existing content with null timestamp:

```sh nesl
#!nesl [@three-char-SHA-256: p8q]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/clipboard-monitor.ts"
old_text = <<'EOT_p8q'
interface ClipboardEntry {
  content: string;
  timestamp: number;
}
EOT_p8q
new_text = <<'EOT_p8q'
interface ClipboardEntry {
  content: string;
  timestamp: number | null;
}
EOT_p8q
#!end_p8q
```

```sh nesl
#!nesl [@three-char-SHA-256: r2t]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/clipboard-monitor.ts"
old_text = <<'EOT_r2t'
  async start(): Promise<void> {
    console.log('[ClipboardMonitor] Starting with poll interval:', this.pollInterval);
    
    // Initialize with current clipboard content to ignore pre-existing content
    try {
      this.lastClipboardContent = await clipboard.read();
      console.log('[ClipboardMonitor] Initialized with existing clipboard content length:', this.lastClipboardContent.length);
    } catch (error) {
      console.log('[ClipboardMonitor] Could not read initial clipboard:', error);
      this.lastClipboardContent = '';
    }
    
    this.isInitialized = true;
    this.interval = setInterval(() => this.checkClipboard(), this.pollInterval);
  }
EOT_r2t
new_text = <<'EOT_r2t'
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
EOT_r2t
#!end_r2t
```

```sh nesl
#!nesl [@three-char-SHA-256: s4v]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/clipboard-monitor.ts"
old_text = <<'EOT_s4v'
      // Clean old entries (>1800ms)
      const beforeClean = this.recentChanges.length;
      this.recentChanges = this.recentChanges.filter(e => now - e.timestamp <= 1800);
      if (beforeClean !== this.recentChanges.length) {
        console.log(`[ClipboardMonitor] Cleaned ${beforeClean - this.recentChanges.length} old entries`);
      }
EOT_s4v
new_text = <<'EOT_s4v'
      // Clean old entries (>1800ms) but keep null timestamp entries
      const beforeClean = this.recentChanges.length;
      this.recentChanges = this.recentChanges.filter(e => e.timestamp === null || now - e.timestamp <= 1800);
      if (beforeClean !== this.recentChanges.length) {
        console.log(`[ClipboardMonitor] Cleaned ${beforeClean - this.recentChanges.length} old entries`);
      }
EOT_s4v
#!end_s4v
```

```sh nesl
#!nesl [@three-char-SHA-256: t6w]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/clipboard-monitor.ts"
old_text = <<'EOT_t6w'
        // Log all entries with their delimiters
        console.log(`[ClipboardMonitor] Current entries:`);
        this.recentChanges.forEach((entry, i) => {
          const endMatch = entry.content.match(/#!end_([a-zA-Z0-9]+)/);
          console.log(`  [${i}] timestamp: ${entry.timestamp}, length: ${entry.content.length}, delimiter: ${endMatch ? endMatch[1] : 'none'}`);
        });
EOT_t6w
new_text = <<'EOT_t6w'
        // Log all entries with their delimiters
        console.log(`[ClipboardMonitor] Current entries:`);
        this.recentChanges.forEach((entry, i) => {
          const endMatch = entry.content.match(/#!end_([a-zA-Z0-9]+)/);
          console.log(`  [${i}] timestamp: ${entry.timestamp === null ? 'null' : entry.timestamp}, length: ${entry.content.length}, delimiter: ${endMatch ? endMatch[1] : 'none'}`);
        });
EOT_t6w
#!end_t6w
```

```sh nesl
#!nesl [@three-char-SHA-256: u8x]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/clipboard-monitor.ts"
old_text = <<'EOT_u8x'
  private findMatchingPair(): string | null {
    console.log('[ClipboardMonitor] Checking for matching pairs, entries:', this.recentChanges.length);
    
    // Look for pairs with matching delimiters
    for (let i = 0; i < this.recentChanges.length; i++) {
      for (let j = 0; j < this.recentChanges.length; j++) {
        if (i === j) continue;
        
        const entry1 = this.recentChanges[i];
        const entry2 = this.recentChanges[j];
EOT_u8x
new_text = <<'EOT_u8x'
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
EOT_u8x
#!end_u8x
```
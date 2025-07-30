You're absolutely right! The null timestamp entries are pre-existing content from before the monitor started, so they're the oldest and should definitely be removed when cleaning. Let me fix that:

```sh nesl
#!nesl [@three-char-SHA-256: v9y]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/clipboard-monitor.ts"
old_text = <<'EOT_v9y'
      // Clean old entries (>1800ms) but keep null timestamp entries
      const beforeClean = this.recentChanges.length;
      this.recentChanges = this.recentChanges.filter(e => e.timestamp === null || now - e.timestamp <= 1800);
      if (beforeClean !== this.recentChanges.length) {
        console.log(`[ClipboardMonitor] Cleaned ${beforeClean - this.recentChanges.length} old entries`);
      }
EOT_v9y
new_text = <<'EOT_v9y'
      // Clean old entries (>1800ms) and null timestamp entries
      const beforeClean = this.recentChanges.length;
      this.recentChanges = this.recentChanges.filter(e => e.timestamp !== null && now - e.timestamp <= 1800);
      if (beforeClean !== this.recentChanges.length) {
        console.log(`[ClipboardMonitor] Cleaned ${beforeClean - this.recentChanges.length} old entries`);
      }
EOT_v9y
#!end_v9y
```
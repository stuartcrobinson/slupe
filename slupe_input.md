=== SLUPE RESULTS ===
v8k ✅ file_replace_text /Users/stuart/repos/slupe/proj/comp/listener/src/formatters.ts
=== END ===
Actually, no. I think we're fixing the symptom rather than the root cause. The test is checking if the listener processes content when started, but we're changing what "initial content" means rather than understanding why plain text isn't being processed.

Let me understand better what the listener is supposed to do with plain text content. Looking at the code flow:

1. The listener watches a file
2. When the file changes (or on initial start), it reads the content
3. It calls `processContent` which:
   - Strips any existing SLUPE results section
   - Checks if content changed (via hash)
   - Executes the content through Slupe
   - Formats the results

The issue is that when there are no NESL blocks, the orchestrator still returns a valid result with empty actions, and the formatters should still produce a "=== SLUPE RESULTS ===" section (even if it just says no actions were found).

Let me check what happens with empty content in the formatters:

```sh nesl
#!nesl [@three-char-SHA-256: v8k]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/formatters.ts"
old_text = <<'EOT_v8k'
export function formatSummary(orchResult: OrchestratorResult): string {
  const lines = ['=== SLUPE RESULTS ==='];
EOT_v8k
new_text = <<'EOT_v8k'
export function formatSummary(orchResult: OrchestratorResult): string {
  const lines = ['=== SLUPE RESULTS ==='];
  
  // If no actions and no errors, indicate that
  if (!orchResult.results?.length && !orchResult.parseErrors?.length && !orchResult.hookErrors?.before?.length) {
    lines.push('No NESL blocks found');
  }
EOT_v8k
#!end_v8k
```

This way, even plain text files will get a SLUPE results section indicating no blocks were found, which is more informative than changing the test data.
I'll help you overhaul the system to check if the file starts with `=== SLUPE RESULTS` (ignoring leading whitespace) to determine whether to execute.

Here's the NESL to make these changes:

```sh nesl
#!nesl [@three-char-SHA-256: a3f]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/content-processor.ts"
old_text = <<'EOT_a3f'
export function stripSummarySection(content: string): string {
  const startMarker = '=== SLUPE RESULTS ===';
  const endMarker = '=== END ===';
  
  // Check if content starts with a SLUPE results section (with some tolerance for leading content)
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1 || startIndex > 100) {
    // No SLUPE section at the beginning of file
    return content;
  }
  
  // Find the corresponding END marker after the start
  const endIndex = content.indexOf(endMarker, startIndex);
  if (endIndex === -1) {
    return content; // Malformed section, keep content as-is
  }
  
  // Return content after the END marker, trimming leading whitespace
  return content.slice(endIndex + endMarker.length).trimStart();
}
EOT_a3f
new_text = <<'EOT_a3f'
export function stripSummarySection(content: string): string {
  const startMarker = '=== SLUPE RESULTS ===';
  const endMarker = '=== END ===';
  
  const trimmed = content.trimStart();
  
  if (!trimmed.startsWith(startMarker)) {
    return content;
  }
  
  const endIndex = content.indexOf(endMarker);
  if (endIndex === -1) {
    return content;
  }
  
  return content.slice(endIndex + endMarker.length).trimStart();
}

export function hasExistingSlupeResults(content: string): boolean {
  return content.trimStart().startsWith('=== SLUPE RESULTS');
}
EOT_a3f
#!end_a3f
```

```sh nesl
#!nesl [@three-char-SHA-256: b7x]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/content-processor.ts"
old_text = <<'EOT_b7x'
export async function processContent(
  content: string,
  lastHash: string,
  debug?: boolean,
  repoPath?: string
): Promise<ProcessResult | null> {
  // console.log('DEBUG processContent called with:', { 
  //   contentLength: content.length, 
  //   lastHash,
  //   contentPreview: content.substring(0, 50)
  // });
  
  if (content.trim() === '') {
    // console.log('DEBUG: Empty content, returning null');
    return null;
  }

  const stripped = stripSummarySection(content);
  const hash = computeContentHash(stripped.trim());

  if (hash === lastHash) {
    // console.log('DEBUG: Hash unchanged, skipping processing', { hash, lastHash });
    return null;
  }
EOT_b7x
new_text = <<'EOT_b7x'
export async function processContent(
  content: string,
  lastHash: string,
  debug?: boolean,
  repoPath?: string
): Promise<ProcessResult | null> {
  // console.log('DEBUG processContent called with:', { 
  //   contentLength: content.length, 
  //   lastHash,
  //   contentPreview: content.substring(0, 50)
  // });
  
  if (content.trim() === '') {
    // console.log('DEBUG: Empty content, returning null');
    return null;
  }

  if (hasExistingSlupeResults(content)) {
    // console.log('DEBUG: File already has SLUPE results, skipping processing');
    return null;
  }

  const stripped = stripSummarySection(content);
  const hash = computeContentHash(stripped.trim());
EOT_b7x
#!end_b7x
```

Now let's update the test file to match the new behavior:

```sh nesl
#!nesl [@three-char-SHA-256: c9k]
action = "file_read"
path = "/Users/stuart/repos/slupe/proj/comp/listener/test/unit/stripSummarySection.test.ts"
#!end_c9k
```
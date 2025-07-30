You're right! Looking at the test, I can see the issue now. The test waits 700ms after starting the listener, but from the debug output, we can see that the `processContent` is being called but the results show:

```
DEBUG: processContent result: {
  summary: '=== SLUPE RESULTS ===\ndef ❌ - Hook failed: git commit -m "before ${COMMIT_MSG}"\n...',
  fullOutput: '=== SLUPE RESULTS ===\n...',
  ...
}
DEBUG: Writing outputs...
DEBUG: Outputs written
```

But then the test fails because the file still contains `'initial content'` instead of the expected SLUPE results.

The issue is that `writeOutputs` is being called, but the test is reading the file and finding the original content unchanged. This suggests that either:

1. The write operation hasn't completed when the test reads the file
2. There's an error in the write operation that's being silently swallowed

Let me fix this by adding better error handling and ensuring the write completes:

```sh nesl
#!nesl [@three-char-SHA-256: fix]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/listener.ts"
old_text = <<'EOT_fix'
    console.log('DEBUG: Writing outputs...');
    await writeOutputs(
      {
        inputPath: filePath,
        outputPath: state.outputPath
      },
      result.summary,
      result.fullOutput,
      result.originalContent
    );
    console.log('DEBUG: Outputs written');
EOT_fix
new_text = <<'EOT_fix'
    console.log('DEBUG: Writing outputs...');
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
      console.log('DEBUG: Outputs written successfully');
      
      // Verify the write actually happened
      const verifyContent = await readFile(filePath, 'utf-8');
      console.log('DEBUG: Verified file content starts with:', verifyContent.substring(0, 50));
    } catch (writeError) {
      console.error('DEBUG: Error writing outputs:', writeError);
      throw writeError;
    }
EOT_fix
#!end_fix
```

Now let's also add some debugging to the output-writer to ensure it's actually writing:

```sh nesl
#!nesl [@three-char-SHA-256: dbg]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/output-writer.ts"
old_text = <<'EOT_dbg'
export async function writeOutputs(
  paths: OutputPaths,
  summary: string,
  fullOutput: string,
  originalContent: string
): Promise<void> {
  await writeFile(paths.outputPath, fullOutput);
  
  const updatedContent = summary + '\n' + originalContent;
  await writeFile(paths.inputPath, updatedContent);
}
EOT_dbg
new_text = <<'EOT_dbg'
export async function writeOutputs(
  paths: OutputPaths,
  summary: string,
  fullOutput: string,
  originalContent: string
): Promise<void> {
  console.log('DEBUG writeOutputs: Writing to outputPath:', paths.outputPath);
  await writeFile(paths.outputPath, fullOutput);
  
  const updatedContent = summary + '\n' + originalContent;
  console.log('DEBUG writeOutputs: Writing to inputPath:', paths.inputPath);
  console.log('DEBUG writeOutputs: Updated content preview:', updatedContent.substring(0, 100));
  await writeFile(paths.inputPath, updatedContent);
  console.log('DEBUG writeOutputs: Both writes completed');
}
EOT_dbg
#!end_dbg
```

Now run the test again to see what's happening:

```bash
cd /Users/stuart/repos/slupe && npm test -- /Users/stuart/repos/slupe/proj/comp/listener/test/unit/stopListener.test.ts
```
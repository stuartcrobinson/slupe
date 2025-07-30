You're absolutely right. Let me diagnose the issue properly. The test is still failing with the same error - the file still contains "initial content" instead of being updated with SLUPE results.

Let me trace through what should happen:
1. Listener starts and calls `processFileChange` immediately
2. `processFileChange` reads the file and calls `processContent`
3. `processContent` should return a result with summary and fullOutput
4. `writeOutputs` should write the summary + original content back to the file

But the file isn't being updated. Let me add some debugging to understand where the flow is breaking:

```sh nesl
#!nesl [@three-char-SHA-256: d7g]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/src/listener.ts"
old_text = <<'EOT_d7g'
async function processFileChange(filePath: string, state: ListenerState): Promise<void> {
  if (state.isProcessing) {
    return;
  }

  try {
    state.isProcessing = true;

    const fullContent = await readFile(filePath, 'utf-8');
    
    const result = await processContent(
      fullContent,
      state.lastExecutedHash,
      state.debug
    );

    if (!result) {
      return;
    }

    await writeOutputs(
      {
        inputPath: filePath,
        outputPath: state.outputPath
      },
      result.summary,
      result.fullOutput,
      result.originalContent
    );

    state.lastExecutedHash = result.hash;

  } catch (error) {
    console.error('listener: Error processing file change:', error);
  } finally {
    state.isProcessing = false;
  }
}
EOT_d7g
new_text = <<'EOT_d7g'
async function processFileChange(filePath: string, state: ListenerState): Promise<void> {
  if (state.isProcessing) {
    console.log('DEBUG: Already processing, skipping');
    return;
  }

  try {
    state.isProcessing = true;

    const fullContent = await readFile(filePath, 'utf-8');
    console.log('DEBUG: Read content:', fullContent);
    
    const result = await processContent(
      fullContent,
      state.lastExecutedHash,
      state.debug
    );

    console.log('DEBUG: processContent result:', result);

    if (!result) {
      console.log('DEBUG: No result from processContent');
      return;
    }

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

    state.lastExecutedHash = result.hash;

  } catch (error) {
    console.error('listener: Error processing file change:', error);
  } finally {
    state.isProcessing = false;
  }
}
EOT_d7g
#!end_d7g
```

Now let's run the test again to see where it's failing:

```bash
cd /Users/stuart/repos/slupe && npm test -- /Users/stuart/repos/slupe/proj/comp/listener/test/unit/stopListener.test.ts
```
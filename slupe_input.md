Now I understand! The `output-writer.ts` writes:
1. The `fullOutput` to the output file (`.slupe-output-latest.txt`)
2. The `summary + originalContent` back to the input file

So the test is looking in the wrong place. The output file only contains the SLUPE execution results, not the original content. The original content is written back to the input file with the summary prepended.

Let's fix the test to check the correct behavior:

```sh nesl
#!nesl [@three-char-SHA-256: e8p]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/test/unit/startListener.test.ts"
old_text = <<'EOT_e8p'
    const outputPath = join(testDir, '.slupe-output-latest.txt');
    const initialOutput = await readFile(outputPath, 'utf-8');
    expect(initialOutput).toContain('Initial content');
EOT_e8p
new_text = <<'EOT_e8p'
    const outputPath = join(testDir, '.slupe-output-latest.txt');
    const initialOutput = await readFile(outputPath, 'utf-8');
    // The output file contains SLUPE execution results
    expect(initialOutput).toContain('SLUPE RESULTS');
    expect(initialOutput).toContain('file_write /tmp/test-initial.txt');
    
    // The original content is written back to the input file with summary prepended
    const inputFileContent = await readFile(testFile, 'utf-8');
    expect(inputFileContent).toContain('Initial content');
    expect(inputFileContent).toContain('SLUPE RESULTS');
EOT_e8p
#!end_e8p
```

```sh nesl
#!nesl [@three-char-SHA-256: f9m]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/test/unit/startListener.test.ts"
old_text = <<'EOT_f9m'
    // Check that the output was updated
    const updatedOutput = await readFile(outputPath, 'utf-8');
    expect(updatedOutput).toContain('Updated content');
    expect(updatedOutput).toContain('This is the new content');
EOT_f9m
new_text = <<'EOT_f9m'
    // Check that the output was updated
    const updatedOutput = await readFile(outputPath, 'utf-8');
    expect(updatedOutput).toContain('SLUPE RESULTS');
    expect(updatedOutput).toContain('file_write /tmp/test-updated.txt');
    
    // Check the input file has the updated content
    const updatedInputContent = await readFile(testFile, 'utf-8');
    expect(updatedInputContent).toContain('Updated content');
    expect(updatedInputContent).toContain('This is the new content');
EOT_f9m
#!end_f9m
```

Now let's run the test again:

```bash
npm test -- /Users/stuart/repos/slupe/proj/comp/listener/test/unit/startListener.test.ts
```
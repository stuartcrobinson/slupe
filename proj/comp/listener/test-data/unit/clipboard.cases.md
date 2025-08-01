# Clipboard Integration Tests

the following test cases show a series of fenced code blocks separated by numbers.  each block is text that gets added to clipboard, and the numbers are the amount of time in milliseconds before the next item is added to the clipboard ("copied")


# Core Clipboard Monitoring System
The system monitors clipboard changes and looks for paired clipboard entries that together form a valid NESL command:

1. **Delimiter Matching**: The system looks for matching delimiters in clipboard entries:
   - First clipboard entry contains an ending delimiter (e.g., `#!end_abc`)
   - A subsequent clipboard entry contains the matching start delimiter (e.g., `#!nesl [@three-char-SHA-256: abc]`)
   - The delimiters must have the same identifier (e.g., "abc")

2. **Timing Constraints**: 
   - There's a 1800ms timeout window between related clipboard entries
   - If more than 1800ms passes between the first and second entry, no action is triggered
   - Empty clipboard entries or unrelated content can appear between the two matching entries without breaking the pattern

3. **Content Assembly**:
   - When matching delimiters are found within the timeout window, the system combines the content
   - The smaller clipboard entry is used as the "target" (typically contains the actual NESL command)
   - The larger entry is treated as supplementary and ignored for execution purposes

4. **NESL Execution**:
   - Once a valid NESL command is assembled, it's executed
   - Results are displayed with success indicators (e.g., "✅ file_write /path/to/file")
   - The output includes "=== SLUPE RESULTS ===" header when execution occurs

### Key Behaviors from Test Cases:

1. **Order Independence**: The NESL command parts can be copied in either order - the system identifies which is the actual command based on size
2. **Robustness**: The system ignores:
   - Clipboard entries that don't contain matching delimiters
   - Content after the timeout window
   - Mismatched delimiter pairs
3. **Immediate Execution**: As soon as a valid pair is detected, the command executes without waiting for additional clipboard changes



## simplest

### inputs

```sh
#!end_aa
```

55

```sh
X
#!end_aa
```

### output contains
```
=== SLUPE RESULTS ===
```



## simplest_fail_1

### inputs

```sh
#!end_aa
```

55

```sh
X
#!end_bb
```

### output contains
null



## simplest_fail_2

### inputs

```sh
#!end_aa
```

5

```sh
X
#!end_aab
```

### output contains
null


## simple_works

### inputs

```sh
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
#!end_d748f3s
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

55

```sh
#!nesl [@three-char-SHA-256: d748f3s]
action = "file_write"
path = "/tmp/t_simple_works/2.txt"
content = "hi"
#!end_d748f3s
```


### output contains
```
✅ file_write /tmp/t_simple_works/2.txt
```


## simple_fails

### inputs

```sh
#!nesl [@three-char-SHA-256: b8fw34t]
action = "file_write"
path = "/tmp/t_simple_fails/1.txt"
content = "hi"
#!end_b8fw34t
```

55

```sh
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
x#!end_b8fw34t
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

```

### output contains
null


## simple_fails2

### inputs

```sh
#!nesl [@three-char-SHA-256: as7]
action = "file_write"
path = "/tmp/t_simple_fails2/1.txt"
content = "hi"
#!end_as7
```

5

```sh
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 #!end_as7
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

```

### output contains
null


## target_copied_first

### inputs

```sh nesl
#!nesl [@three-char-SHA-256: f73js6]
action = "file_write"
path = "/tmp/t_target_copied_first/out.txt"
content = <<'EOT_f73js6'
hello
EOT_f73js6
#!end_f73js6
```

55

```sh nesl
lalala
#!nesl [@three-char-SHA-256: f73js6]
action = "file_read"
path = "/tmp/t_target_copied_first/out.txt"
#!end_f73js6
this clipboard content gets ignored because its the bigger one
this clipboard content gets ignored because its the bigger one
this clipboard content gets ignored because its the bigger one
```

### output contains
```
✅ file_write /tmp/t_target_copied_first/out.txt
```

## target_copied_second_fast

### inputs

```sh nesl
lalala
this clipboard content gets ignored because its the bigger one
#!nesl [@three-char-SHA-256: xyz]
action = "file_write"
path = "/tmp/t_target_copied_second_fast/first.txt"
content = <<'EOT_xyz'
test content
EOT_xyz
#!end_xyz
```

55

```sh nesl
#!nesl [@three-char-SHA-256: xyz]
action = "file_write"
path = "/tmp/t_target_copied_second_fast/second.txt"
content = <<'EOT_xyz'
test content
EOT_xyz
#!end_xyz
```

### output contains
```
✅ file_write /tmp/t_target_copied_second_fast/second.txt
```

## near_timeout_boundary

### inputs
```sh nesl
#!nesl [@three-char-SHA-256: def]
action = "file_write"
path = "/tmp/t_near_timeout_boundary/first.txt"
content = <<'EOT_def'
slow
EOT_def
#!end_def
```

1700

```sh nesl
this clipboard content gets ignored because its the bigger one
#!nesl [@three-char-SHA-256: def]
action = "file_write"
path = "/tmp/t_near_timeout_boundary/second.txt"
content = <<'EOT_def'
ignored content
EOT_def
#!end_def
```

### output contains
```
✅ file_write /tmp/t_near_timeout_boundary/first.txt
```

## exceeds_1800_timeout_no_trigger

### inputs
```sh nesl
#!nesl [@three-char-SHA-256: ghi]
action = "file_write"
path = "/tmp/t_exceeds_timeout_no_trigger/test.txt"
content = <<'EOT_ghi'
timeout
EOT_ghi
#!end_ghi
```

1850

```sh nesl
asdifasdfkasdf
#!nesl [@three-char-SHA-256: ghi]
action = "file_write"
path = "/tmp/t_exceeds_timeout_no_trigger/ignored.txt"
content = <<'EOT_ghi'
ignored
EOT_ghi
#!end_ghi
```

### output contains
null

## mismatched_delimiters_no_trigger

### inputs
```sh nesl
#!nesl [@three-char-SHA-256: jkl]
action = "file_write"
path = "/tmp/t_mismatched_delimiters_no_trigger/test.txt"
content = <<'EOT_jkl'
mismatch
EOT_jkl
#!end_jkl
```

55

```sh nesl
as;doifjsodfij
#!nesl [@three-char-SHA-256: 56d]
action = "file_write"
path = "/tmp/t_mismatched_delimiters_no_trigger/different.txt"
content = <<'EOT_56d'
different delimiter
EOT_56d
#!end_56d
```

### output contains
null

## valid_target_content_separated_by_empty_clipboard_1

### inputs


```sh nesl
#!nesl [@three-char-SHA-256: 34g]
action = "file_write"
path = "/tmp/t_valid_target_content_separated_by_empty_clipboard_1/1st.txt"
content = <<'EOT_34g'
hello
EOT_34g
#!end_34g
```

55


```sh nesl
hey hey hey hey hey hey hey hey 
```

55


```sh nesl
lalala
#!nesl [@three-char-SHA-256: 34g]
action = "file_read"
path = "/tmp/t_valid_target_content_separated_by_empty_clipboard_1/3rd.txt"
#!end_34g
this clipboard content gets ignored because its the bigger one
this clipboard content gets ignored because its the bigger one
this clipboard content gets ignored because its the bigger one
```

### output contains
```
✅ file_write /tmp/t_valid_target_content_separated_by_empty_clipboard_1/1st.txt
```


## valid_target_content_separated_by_empty_clipboard_2

### inputs

```sh nesl
lalala
#!nesl [@three-char-SHA-256: abc]
action = "file_read"
path = "/tmp/t_valid_target_content_separated_by_empty_clipboard_2/1st.txt"
#!end_abc
this clipboard content gets ignored because its the bigger one
this clipboard content gets ignored because its the bigger one
this clipboard content gets ignored because its the bigger one
```

55


```sh nesl
```

55


```sh nesl
hi
```

55


```sh nesl
#!nesl [@three-char-SHA-256: abc]
action = "file_write"
path = "/tmp/t_valid_target_content_separated_by_empty_clipboard_2/4th.txt"
content = <<'EOT_abc'
hello
EOT_abc
#!end_abc
```


### output contains
```
✅ file_write /tmp/t_valid_target_content_separated_by_empty_clipboard_2/4th.txt
```


## invalid_target_content_separated_by_empty_clipboard_timeout

### inputs

```sh nesl
lalala
#!nesl [@three-char-SHA-256: abc]
action = "file_read"
path = "/tmp/t_invalid_target_content_separated_by_empty_clipboard_timeout/1st.txt"
#!end_abc
this clipboard content gets ignored because its the bigger one
this clipboard content gets ignored because its the bigger one
this clipboard content gets ignored because its the bigger one
```

700


```sh nesl
```

700


```sh nesl
hi
```

700


```sh nesl
#!nesl [@three-char-SHA-256: abc]
action = "file_write"
path = "/tmp/t_invalid_target_content_separated_by_empty_clipboard_timeout/4th.txt"
content = <<'EOT_abc'
hello
EOT_abc
#!end_abc
```


### output contains
null



## valid_complex

### inputs

```sh nesl
#!nesl [@three-char-SHA-256: abc]
action = "file_write"
path = "/tmp/t_valid_complex/1.txt"
content = <<'EOT_abc'
hello
EOT_abc
#!end_abc

#!nesl [@three-char-SHA-256: abc]
action = "file_read"
path = "/tmp/t_valid_complex/1st.txt"
#!end_abc
```

55


```sh nesl
```

55


```sh nesl
#!nesl [@three-char-SHA-256: abc]
action = "file_write"
path = "/tmp/t_valid_complex/1.txt"
content = <<'EOT_abc'
hello
EOT_abc
#!end_abc

#!nesl [@three-char-SHA-256: abc]
action = "file_read"
path = "/tmp/t_valid_complex/1st.txt"
#!end_abc

RetryClaude can make mistakes. Please double-check responses.Research Opus 4
```

### output contains
```
✅ file_write /tmp/t_valid_complex/1.txt
```




## valid_very_complex

### inputs

````sh nesl
Here's the refactored test to reuse resources:

```sh nesl
#!nesl [@three-char-SHA-256: rf1]
action = "file_replace_text"
path = "/tmp/valid_very_complex/proj/comp/listener/test/unit/clipboard.test.ts"
old_text = <<'EOT_rf1'
describe('clipboard integration', async () => {
  const cases = await parseTestCases();
  let handle: ListenerHandle | null = null;
  let testRepoPath: string;
  
  beforeEach(async () => {
    testRepoPath = mkdtempSync(join(tmpdir(), 'slupe-clipboard-test-'));
  });
  
  afterEach(async () => {
    if (handle) {
      await handle.stop();
      handle = null;
    }
    
    await rm(testRepoPath, { recursive: true, force: true }).catch(() => {});
  });
EOT_rf1
new_text = <<'EOT_rf1'
describe('clipboard integration', async () => {
  const cases = await parseTestCases();
  let handle: ListenerHandle | null = null;
  let sharedRepoPath: string;
  let sharedSlupeInstance: any;
  
  beforeAll(async () => {
    // Create shared temp directory and Slupe instance once
    sharedRepoPath = mkdtempSync(join(tmpdir(), 'slupe-clipboard-shared-'));
    
    // Create shared Slupe instance
    const { Slupe } = await import('../../orch/src/index.js');
    sharedSlupeInstance = await Slupe.create({ 
      gitCommit: false,
      repoPath: sharedRepoPath 
    });
  });
  
  afterAll(async () => {
    // Clean up shared resources
    await rm(sharedRepoPath, { recursive: true, force: true }).catch(() => {});
  });
  
  afterEach(async () => {
    if (handle) {
      await handle.stop();
      handle = null;
    }
  });
EOT_rf1
#!end_rf1
```

Now update each test to use a unique filename in the shared directory:

```sh nesl
#!nesl [@three-char-SHA-256: rf2]
action = "file_replace_text"
path = "/tmp/valid_very_complex/proj/comp/listener/test/unit/clipboard.test.ts"
old_text = <<'EOT_rf2'
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
EOT_rf2
new_text = <<'EOT_rf2'
  for (const testCase of cases) {
    it(testCase.name, async () => {
      console.log(`[TEST ${testCase.name}] Test case:`, {
        name: testCase.name,
        inputsCount: testCase.inputs.length,
        expectedOutput: testCase.expectedOutput
      });
      
      const testDir = `/tmp/t_${testCase.name}`;
      const inputFile = join(sharedRepoPath, `${testCase.name}.md`);
      const outputFile = join(sharedRepoPath, `.slupe-output-${testCase.name}.txt`);
EOT_rf2
#!end_rf2
```

Update the listener config to pass the shared Slupe instance:

```sh nesl
#!nesl [@three-char-SHA-256: rf3]
action = "file_replace_text"
path = "/tmp/valid_very_complex/proj/comp/listener/test/unit/clipboard.test.ts"
old_text = <<'EOT_rf3'
        handle = await startListener({
          filePath: inputFile,
          useClipboard: true,
          debounceMs: 15  // Minimum allowed for tests
        });
EOT_rf3
new_text = <<'EOT_rf3'
        handle = await startListener({
          filePath: inputFile,
          useClipboard: true,
          debounceMs: 15,  // Minimum allowed for tests
          outputFilename: `.slupe-output-${testCase.name}.txt`
        });
EOT_rf3
#!end_rf3
```

Now we need to update the listener to accept a Slupe instance. First, update the types:

```sh nesl
#!nesl [@three-char-SHA-256: rf4]
action = "file_replace_text"
path = "/tmp/valid_very_complex/proj/comp/listener/src/types.ts"
old_text = <<'EOT_rf4'
export interface ListenerConfig {
  filePath: string;
  outputFilename?: string;
  debounceMs?: number;
  debug?: boolean;
  useClipboard?: boolean;
}
EOT_rf4
new_text = <<'EOT_rf4'
export interface ListenerConfig {
  filePath: string;
  outputFilename?: string;
  debounceMs?: number;
  debug?: boolean;
  useClipboard?: boolean;
  slupeInstance?: any;
}
EOT_rf4
#!end_rf4
```

Update the listener to use the provided Slupe instance:

```sh nesl
#!nesl [@three-char-SHA-256: rf5]
action = "file_replace_text"
path = "/tmp/valid_very_complex/proj/comp/listener/src/listener.ts"
old_text = <<'EOT_rf5'
  const state: ListenerState = {
    lastExecutedHash: '',
    isProcessing: false,
    outputPath: join(dirname(config.filePath), config.outputFilename || '.slupe-output-latest.txt'),
    debug: config.debug || false,
    useClipboard: config.useClipboard || false,
    inputPath: config.filePath
  };
EOT_rf5
new_text = <<'EOT_rf5'
  const state: ListenerState = {
    lastExecutedHash: '',
    isProcessing: false,
    outputPath: join(dirname(config.filePath), config.outputFilename || '.slupe-output-latest.txt'),
    debug: config.debug || false,
    useClipboard: config.useClipboard || false,
    inputPath: config.filePath,
    slupeInstance: config.slupeInstance
  };
EOT_rf5
#!end_rf5
```

Fix the test to pass the shared Slupe instance:

```sh nesl
#!nesl [@three-char-SHA-256: rf6]
action = "file_replace_text"
path = "/tmp/valid_very_complex/proj/comp/listener/test/unit/clipboard.test.ts"
old_text = <<'EOT_rf6'
        handle = await startListener({
          filePath: inputFile,
          useClipboard: true,
          debounceMs: 15,  // Minimum allowed for tests
          outputFilename: `.slupe-output-${testCase.name}.txt`
        });
EOT_rf6
new_text = <<'EOT_rf6'
        handle = await startListener({
          filePath: inputFile,
          useClipboard: true,
          debounceMs: 15,  // Minimum allowed for tests
          outputFilename: `.slupe-output-${testCase.name}.txt`,
          slupeInstance: sharedSlupeInstance
        });
EOT_rf6
#!end_rf6
```

Also fix the standalone test at the bottom:

```sh nesl
#!nesl [@three-char-SHA-256: rf7]
action = "file_replace_text"
path = "/tmp/valid_very_complex/proj/comp/listener/test/unit/clipboard.test.ts"
old_text = <<'EOT_rf7'
  it('should add clipboard timestamp to input file after copying', async () => {
    const inputFile = join(testRepoPath, 'input.md');
EOT_rf7
new_text = <<'EOT_rf7'
  it('should add clipboard timestamp to input file after copying', async () => {
    const inputFile = join(sharedRepoPath, 'clipboard-timestamp-test.md');
EOT_rf7
#!end_rf7
```

And update its listener config:

```sh nesl
#!nesl [@three-char-SHA-256: rf8]
action = "file_replace_text"
path = "/tmp/valid_very_complex/proj/comp/listener/test/unit/clipboard.test.ts"
old_text = <<'EOT_rf8'
    handle = await startListener({
      filePath: inputFile,
      useClipboard: true,
      debounceMs: 100
    });
EOT_rf8
new_text = <<'EOT_rf8'
    handle = await startListener({
      filePath: inputFile,
      useClipboard: true,
      debounceMs: 15,
      outputFilename: '.slupe-output-clipboard-timestamp-test.txt',
      slupeInstance: sharedSlupeInstance
    });
EOT_rf8
#!end_rf8
```

And update the file path in the test:

```sh nesl
#!nesl [@three-char-SHA-256: rf9]
action = "file_replace_text"
path = "/tmp/valid_very_complex/proj/comp/listener/test/unit/clipboard.test.ts"
old_text = <<'EOT_rf9'
path = "${testRepoPath}/test.txt"
EOT_rf9
new_text = <<'EOT_rf9'
path = "${sharedRepoPath}/test.txt"
EOT_rf9
#!end_rf9
```

This refactoring:
1. Creates the temp directory and Slupe instance once in `beforeAll`
2. Each test uses a unique filename in the shared directory
3. Passes the shared Slupe instance to avoid recreating it
4. Cleans up only the listener between tests, not the entire directory
5. Should save ~5-10ms per test from Slupe creation, plus directory creation overhead
````

55


```sh nesl
```

55


````sh nesl
Here's how we could reduce the default delay:

sh
#!nesl [@three-char-SHA-256: td1]
action = "file_replace_text"
path = "/tmp/valid_very_complex/proj/comp/listener/test/unit/clipboard.test.ts"
old_text = <<'EOT_td1'
          } else {
            console.log(`  No delay specified, waiting 50ms default...`);
            await new Promise(resolve => setTimeout(resolve, 50));
          }
EOT_td1
new_text = <<'EOT_td1'
          } else {
            console.log(`  No delay specified, waiting 20ms default...`);
            await new Promise(resolve => setTimeout(resolve, 20));
          }



since these tests are all happening in series, i wonder if we could change them to resuse all these per test:

Creating a new temp directory
Starting a new listener (which creates a new Slupe instance)
Starting a new file watcher
wdyt? brainstorm first

Edit
Yes! This is a great optimization opportunity. Since the tests run in series, we could definitely reuse these resources. Here's my thinking:

What we could reuse:

Slupe instance - This is the biggest win. It's stateless between executions, so perfect for reuse.
File watcher - Also stateless, just watches for file changes.
Temp directory - We'd need to clean files between tests but keep the directory.
What we'd need to handle carefully:

Listener state - Currently each test gets a fresh ListenerState object. We'd need to reset this between tests.
Clipboard monitor - This maintains state (recentChanges array) that would need clearing between tests.
File cleanup - Clear any files created by previous tests.
Test isolation - Ensure one test's side effects don't affect the next.
Proposed approach:

Use beforeAll to create shared resources (temp dir, Slupe instance)
Keep starting/stopping the listener per test (since it's lightweight once we have Slupe)
OR: Have one long-running listener and just swap out the monitored file
Use afterEach to clean up files and reset state
Use afterAll to clean up shared resources
Challenges:

The listener is currently tied to a specific file path, so we'd need to either: a) Make the listener support changing its monitored file b) Create different input files for each test in the same directory
Option (b) seems simpler - each test uses a unique filename in the shared temp directory.

This could easily cut 100-200ms off each test by eliminating the Slupe creation and file system setup overhead. What do you think about this approach?




yes lets do b.  nesl now please

Edit
Here's the refactored test to reuse resources:

sh
#!nesl [@three-char-SHA-256: rf1]
action = "file_replace_text"
path = "/tmp/valid_very_complex/proj/comp/listener/test/unit/clipboard.test.ts"
old_text = <<'EOT_rf1'
describe('clipboard integration', async () => {
  const cases = await parseTestCases();
  let handle: ListenerHandle | null = null;
  let testRepoPath: string;
  
  beforeEach(async () => {
    testRepoPath = mkdtempSync(join(tmpdir(), 'slupe-clipboard-test-'));
  });
  
  afterEach(async () => {
    if (handle) {
      await handle.stop();
      handle = null;
    }
    
    await rm(testRepoPath, { recursive: true, force: true }).catch(() => {});
  });
EOT_rf1
new_text = <<'EOT_rf1'
describe('clipboard integration', async () => {
  const cases = await parseTestCases();
  let handle: ListenerHandle | null = null;
  let sharedRepoPath: string;
  let sharedSlupeInstance: any;
  
  beforeAll(async () => {
    // Create shared temp directory and Slupe instance once
    sharedRepoPath = mkdtempSync(join(tmpdir(), 'slupe-clipboard-shared-'));
    
    // Create shared Slupe instance
    const { Slupe } = await import('../../orch/src/index.js');
    sharedSlupeInstance = await Slupe.create({ 
      gitCommit: false,
      repoPath: sharedRepoPath 
    });
  });
  
  afterAll(async () => {
    // Clean up shared resources
    await rm(sharedRepoPath, { recursive: true, force: true }).catch(() => {});
  });
  
  afterEach(async () => {
    if (handle) {
      await handle.stop();
      handle = null;
    }
  });
EOT_rf1
#!end_rf1
Now update each test to use a unique filename in the shared directory:

sh
#!nesl [@three-char-SHA-256: rf2]
action = "file_replace_text"
path = "/tmp/valid_very_complex/proj/comp/listener/test/unit/clipboard.test.ts"
old_text = <<'EOT_rf2'
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
EOT_rf2
new_text = <<'EOT_rf2'
  for (const testCase of cases) {
    it(testCase.name, async () => {
      console.log(`[TEST ${testCase.name}] Test case:`, {
        name: testCase.name,
        inputsCount: testCase.inputs.length,
        expectedOutput: testCase.expectedOutput
      });
      
      const testDir = `/tmp/t_${testCase.name}`;
      const inputFile = join(sharedRepoPath, `${testCase.name}.md`);
      const outputFile = join(sharedRepoPath, `.slupe-output-${testCase.name}.txt`);
EOT_rf2
#!end_rf2
Update the listener config to pass the shared Slupe instance:

sh
#!nesl [@three-char-SHA-256: rf3]
action = "file_replace_text"
path = "/tmp/valid_very_complex/proj/comp/listener/test/unit/clipboard.test.ts"
old_text = <<'EOT_rf3'
        handle = await startListener({
          filePath: inputFile,
          useClipboard: true,
          debounceMs: 15  // Minimum allowed for tests
        });
EOT_rf3
new_text = <<'EOT_rf3'
        handle = await startListener({
          filePath: inputFile,
          useClipboard: true,
          debounceMs: 15,  // Minimum allowed for tests
          outputFilename: `.slupe-output-${testCase.name}.txt`
        });
EOT_rf3
#!end_rf3
Now we need to update the listener to accept a Slupe instance. First, update the types:

sh
#!nesl [@three-char-SHA-256: rf4]
action = "file_replace_text"
path = "/tmp/valid_very_complex/proj/comp/listener/src/types.ts"
old_text = <<'EOT_rf4'
export interface ListenerConfig {
  filePath: string;
  outputFilename?: string;
  debounceMs?: number;
  debug?: boolean;
  useClipboard?: boolean;
}
EOT_rf4
new_text = <<'EOT_rf4'
export interface ListenerConfig {
  filePath: string;
  outputFilename?: string;
  debounceMs?: number;
  debug?: boolean;
  useClipboard?: boolean;
  slupeInstance?: any;
}
EOT_rf4
#!end_rf4
Update the listener to use the provided Slupe instance:

sh
#!nesl [@three-char-SHA-256: rf5]
action = "file_replace_text"
path = "/tmp/valid_very_complex/proj/comp/listener/src/listener.ts"
old_text = <<'EOT_rf5'
  const state: ListenerState = {
    lastExecutedHash: '',
    isProcessing: false,
    outputPath: join(dirname(config.filePath), config.outputFilename || '.slupe-output-latest.txt'),
    debug: config.debug || false,
    useClipboard: config.useClipboard || false,
    inputPath: config.filePath
  };
EOT_rf5
new_text = <<'EOT_rf5'
  const state: ListenerState = {
    lastExecutedHash: '',
    isProcessing: false,
    outputPath: join(dirname(config.filePath), config.outputFilename || '.slupe-output-latest.txt'),
    debug: config.debug || false,
    useClipboard: config.useClipboard || false,
    inputPath: config.filePath,
    slupeInstance: config.slupeInstance
  };
EOT_rf5
#!end_rf5
Fix the test to pass the shared Slupe instance:

sh
#!nesl [@three-char-SHA-256: rf6]
action = "file_replace_text"
path = "/tmp/valid_very_complex/proj/comp/listener/test/unit/clipboard.test.ts"
old_text = <<'EOT_rf6'
        handle = await startListener({
          filePath: inputFile,
          useClipboard: true,
          debounceMs: 15,  // Minimum allowed for tests
          outputFilename: `.slupe-output-${testCase.name}.txt`
        });
EOT_rf6
new_text = <<'EOT_rf6'
        handle = await startListener({
          filePath: inputFile,
          useClipboard: true,
          debounceMs: 15,  // Minimum allowed for tests
          outputFilename: `.slupe-output-${testCase.name}.txt`,
          slupeInstance: sharedSlupeInstance
        });
EOT_rf6
#!end_rf6
Also fix the standalone test at the bottom:

sh
#!nesl [@three-char-SHA-256: rf7]
action = "file_replace_text"
path = "/tmp/valid_very_complex/proj/comp/listener/test/unit/clipboard.test.ts"
old_text = <<'EOT_rf7'
  it('should add clipboard timestamp to input file after copying', async () => {
    const inputFile = join(testRepoPath, 'input.md');
EOT_rf7
new_text = <<'EOT_rf7'
  it('should add clipboard timestamp to input file after copying', async () => {
    const inputFile = join(sharedRepoPath, 'clipboard-timestamp-test.md');
EOT_rf7
#!end_rf7
And update its listener config:

sh
#!nesl [@three-char-SHA-256: rf8]
action = "file_replace_text"
path = "/tmp/valid_very_complex/proj/comp/listener/test/unit/clipboard.test.ts"
old_text = <<'EOT_rf8'
    handle = await startListener({
      filePath: inputFile,
      useClipboard: true,
      debounceMs: 100
    });
EOT_rf8
new_text = <<'EOT_rf8'
    handle = await startListener({
      filePath: inputFile,
      useClipboard: true,
      debounceMs: 15,
      outputFilename: '.slupe-output-clipboard-timestamp-test.txt',
      slupeInstance: sharedSlupeInstance
    });
EOT_rf8
#!end_rf8
And update the file path in the test:

sh
#!nesl [@three-char-SHA-256: rf9]
action = "file_replace_text"
path = "/tmp/valid_very_complex/proj/comp/listener/test/unit/clipboard.test.ts"
old_text = <<'EOT_rf9'
path = "${testRepoPath}/test.txt"
EOT_rf9
new_text = <<'EOT_rf9'
path = "${sharedRepoPath}/test.txt"
EOT_rf9
#!end_rf9
This refactoring:

Creates the temp directory and Slupe instance once in beforeAll
Each test uses a unique filename in the shared directory
Passes the shared Slupe instance to avoid recreating it
Cleans up only the listener between tests, not the entire directory
Should save ~5-10ms per test from Slupe creation, plus directory creation overhead








````

### output contains
```
❌
```

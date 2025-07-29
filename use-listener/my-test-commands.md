
=== SLUPE RESULTS ===
fx4 ✅ file_replace_text /Users/stuart/repos/slupe/proj/comp/listener/test/integration/listener-workflow-v2.test.ts
=== END ===

The issue is that `it.each` needs the array at test collection time, but it's empty until `beforeAll` runs. This is a fundamental limitation of `it.each`.

Here's the fix:

```sh nesl
#!nesl [@three-char-SHA-256: fx4]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/test/integration/listener-workflow-v2.test.ts"
old_text = <<'EOT_fx4'
// Load test cases at module level
const testCasesPromise = parseTestCases();


describe('listener workflow v2', () => {
  let testCases: TestCase[] = [];

  beforeAll(async () => {
    testCases = await testCasesPromise;
  });

  // Use it.each to create separate test for each test case
  it.each(testCases)('$name', async (testCase) => {
EOT_fx4
new_text = <<'EOT_fx4'
// Load test cases at module level
const testCasesPromise = parseTestCases();

describe('listener workflow v2', async () => {
  const testCases = await testCasesPromise;

  // Use it.each to create separate test for each test case
  it.each(testCases)('$name', async (testCase) => {
EOT_fx4
#!end_fx4
```

This uses async in the describe block, which Vitest supports for dynamic test generation.
#!/usr/bin/env tsx

import { startListener, stopListener } from '../proj/comp/listener/src/index.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const TEST_FILE = join(process.cwd(), 'use-listener', 'my-test-commands.md');

async function main() {
  // Create initial test file if it doesn't exist
  try {
    await writeFile(TEST_FILE, `# Test Commands

Try adding NESL blocks below this line:

\`\`\`sh nesl
#!nesl [@three-char-SHA-256: abc]
action = "ls"
path = "."
#!end_abc
\`\`\`

`, { flag: 'wx' }); // wx = write only if doesn't exist
    console.log(`Created test file: ${TEST_FILE}`);
  } catch (e) {
    console.log(`Using existing test file: ${TEST_FILE}`);
  }

  // Start the listener
  console.log('Starting listener...');
  const handle = await startListener({
    filePath: TEST_FILE,
    debounceMs: 500,
    outputFilename: '.my-test-output.txt',
    debug: true
  });

  console.log(`
🎧 Listener started!
📝 Edit file: ${TEST_FILE}
📋 Output will be copied to clipboard
📄 Full output saved to: .my-test-output.txt

Press Ctrl+C to stop
`);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\nStopping listener...');
    await stopListener(handle);
    process.exit(0);
  });

  // Keep process alive
  await new Promise(() => { });
}

main().catch(console.error);
#!/usr/bin/env node

import { startListener } from '../proj/comp/listener/src/index.ts';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';

// Configuration
const testFile = resolve('./test-listener.md');
const initialContent = `# My Test Document

This is my test file for the listener.

<!-- Add your NESL blocks below -->
`;

async function main() {
  try {
    // Create the test file with initial content
    await writeFile(testFile, initialContent);
    console.log(`Created test file: ${testFile}`);

    // Start the listener
    console.log('\nStarting listener...');
    const handle = await startListener({
      filePath: testFile,
      debounceMs: 500,  // Half second debounce
      outputFilename: '.slupe-output-latest.txt'
    });

    console.log(`✅ Listener started!`);
    console.log(`📝 Watching: ${testFile}`);
    console.log(`📋 Output will be written to: .slupe-output-latest.txt`);
    console.log(`\nThe listener is now running. Try adding NESL blocks to the file!`);
    console.log('Press Ctrl+C to stop.\n');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\nStopping listener...');
      await handle.stop();
      console.log('Listener stopped. Goodbye!');
      process.exit(0);
    });

    // Keep the process running
    process.stdin.resume();

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
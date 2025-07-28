console.log('--- TOP OF FILE ---');

import { unlink, rename, mkdir, writeFile, readFile } from 'fs/promises';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
// import { dirname } from 'path';

console.log('=== Node.js File Operation Error Spike ===\n');

// Helper to capture error details
async function tryOperation(name: string, operation: () => Promise<any>) {
  console.log(`\n--- ${name} ---`);
  try {
    const result = await operation();
    console.log('SUCCESS:', result);
  } catch (err: any) {
    console.log('ERROR CODE:', err.code);
    console.log('ERROR MESSAGE:', err.message);
    console.log('ERROR SYSCALL:', err.syscall);
    console.log('ERROR PATH:', err.path);
    console.log('ERROR DEST:', err.dest);
    console.log('FULL ERROR:', err);
  }
}
console.log('Script started!');

async function main() {
  console.log('Main is running');
  await tryOperation('Simple write to /tmp', async () => {
    await writeFile('/tmp/test-check.txt', 'Hello world');
    return 'Wrote /tmp/test-check.txt';
  });
  // Setup
  const testDir = '/tmp/spike-test';
  if (existsSync(testDir)) {
    const { rmSync } = await import('fs');
    rmSync(testDir, { recursive: true, force: true });
  }
  mkdirSync(testDir);
  
  // Test 1: Delete non-existent file
  await tryOperation('Delete non-existent file', async () => {
    return await unlink('/tmp/spike-test/does-not-exist.txt');
  });

  // Test 2: Delete from read-only location
  await tryOperation('Delete from /root/', async () => {
    return await unlink('/root/test.txt');
  });

  // Test 3: Move non-existent file
  await tryOperation('Move non-existent file', async () => {
    return await rename('/tmp/spike-test/ghost.txt', '/tmp/spike-test/moved.txt');
  });

  // Test 4: Move to non-existent directory
  writeFileSync('/tmp/spike-test/source.txt', 'test');
  await tryOperation('Move to non-existent directory', async () => {
    return await rename('/tmp/spike-test/source.txt', '/tmp/spike-test/subdir/dest.txt');
  });

  // Test 5: Move from/to /root/
  await tryOperation('Move from /root/', async () => {
    return await rename('/root/source.txt', '/tmp/spike-test/dest.txt');
  });

  writeFileSync('/tmp/spike-test/moveable.txt', 'test');
  await tryOperation('Move to /root/', async () => {
    return await rename('/tmp/spike-test/moveable.txt', '/root/dest.txt');
  });

  // Test 6: Write to /root/
  await tryOperation('Write to /root/', async () => {
    return await writeFile('/root/test.txt', 'content');
  });

  // Test 7: Create directory in /root/
  await tryOperation('Create directory in /root/', async () => {
    return await mkdir('/root/testdir');
  });

  // Test 8: Move with overwrite
  writeFileSync('/tmp/spike-test/src-exists.txt', 'source');
  writeFileSync('/tmp/spike-test/dst-exists.txt', 'destination');
  await tryOperation('Move overwriting existing file', async () => {
    await rename('/tmp/spike-test/src-exists.txt', '/tmp/spike-test/dst-exists.txt');
    // Check if destination was overwritten
    const content = await readFile('/tmp/spike-test/dst-exists.txt', 'utf8');
    return `Overwrite successful. Content: "${content}"`;
  });

  // Cleanup
  const { rmSync } = await import('fs');
  rmSync(testDir, { recursive: true, force: true });
}

main().catch(console.error);
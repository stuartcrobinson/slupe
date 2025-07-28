// Debug script to trace file_move execution
import { fileExists } from '../../proj/comp/fs-ops/src/fileSystemUtils.js';
import { mkdir, writeFile, existsSync } from 'fs/promises';
import { dirname } from 'path';

async function debugFileMove() {
  console.log('=== FILE MOVE DEBUG ===\n');

  // Test 007 scenario
  const testDir = '/tmp/007-file-move-success';
  const sourcePath = `${testDir}/source-file.txt`;
  const destPath = `${testDir}/destination-file.txt`;

  // Clean up
  try {
    const { rmSync } = await import('fs');
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  } catch (e) { }

  // Create test directory
  await mkdir(testDir, { recursive: true });

  // Create source file
  await writeFile(sourcePath, 'File to be moved');
  console.log('Created source file');

  // Check destination before move
  const destExistsBefore = await fileExists(destPath);
  console.log(`Destination exists before move: ${destExistsBefore}`);

  // Check with different methods
  try {
    await import('fs/promises').then(fs => fs.access(destPath));
    console.log('fs.access says destination EXISTS');
  } catch {
    console.log('fs.access says destination DOES NOT exist');
  }

  // Check directory contents
  const { readdirSync } = await import('fs');
  console.log(`\nDirectory contents before move:`);
  console.log(readdirSync(testDir));

  // Test the fileExists function multiple times
  console.log('\nTesting fileExists consistency:');
  for (let i = 0; i < 5; i++) {
    const exists = await fileExists(destPath);
    console.log(`  Attempt ${i + 1}: ${exists}`);
  }

  // Check if there's a race condition with test cleanup
  console.log('\nChecking for stale files from previous test runs:');
  const staleFiles = [
    '/tmp/007-file-move-success/destination-file.txt',
    '/tmp/016-file-move-creates-parent-dirs/new/deeply/nested/moved-file.txt'
  ];

  for (const file of staleFiles) {
    const exists = await fileExists(file);
    if (exists) {
      console.log(`  FOUND STALE FILE: ${file}`);
      // Check its content
      const { readFileSync } = await import('fs');
      try {
        const content = readFileSync(file, 'utf8');
        console.log(`    Content: "${content}"`);
      } catch (e) {
        console.log(`    Could not read: ${e.message}`);
      }
    }
  }
}

debugFileMove().catch(console.error);
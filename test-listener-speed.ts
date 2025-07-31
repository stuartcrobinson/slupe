import { startListener } from './proj/comp/listener/src/index.js';
import { writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const testFile = join(tmpdir(), 'slupe-speed-test.md');

console.log('Test file:', testFile);

await writeFile(testFile, `# Speed Test

\`\`\`sh nesl
#!nesl [@three-char-SHA-256: tst]
action = "file_write"
path = "/tmp/speed-test.txt"
content = <<'EOT_tst'
Speed test content
EOT_tst
#!end_tst
\`\`\`
`);

console.log('Starting listener...');
const handle = await startListener({
  filePath: testFile,
  debounceMs: 50, // Even lower for testing
  debug: true
});

console.log('Listener started. Now updating file...');

setTimeout(async () => {
  console.time('file-update-to-output');
  await writeFile(testFile, `# Updated Speed Test

\`\`\`sh nesl
#!nesl [@three-char-SHA-256: upd]
action = "file_write"
path = "/tmp/speed-test-updated.txt"
content = <<'EOT_upd'
Updated speed test content
EOT_upd
#!end_upd
\`\`\`
`);
  
  // Check when output appears
  const checkInterval = setInterval(async () => {
    try {
      const outputPath = join(tmpdir(), '.slupe-output-latest.txt');
      const { readFile } = await import('fs/promises');
      const content = await readFile(outputPath, 'utf-8');
      if (content.includes('upd')) {
        console.timeEnd('file-update-to-output');
        clearInterval(checkInterval);
        await handle.stop();
        process.exit(0);
      }
    } catch (e) {}
  }, 10);
}, 1000);
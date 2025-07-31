// // stuart@Stuarts-MacBook-Pro ~/r/slupe (dev) [1]> cd /Users/stuart/repos/slupe && node test-listener-speed.js
// // node:internal/modules/esm/resolve:275
// //     throw new ERR_MODULE_NOT_FOUND(
// //           ^
// // Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/Users/stuart/repos/slupe/proj/comp/listener/src/index.js' imported from /Users/stuart/repos/slupe/test-listener-speed.js
// //     at finalizeResolution (node:internal/modules/esm/resolve:275:11)
// //     at moduleResolve (node:internal/modules/esm/resolve:860:10)
// //     at defaultResolve (node:internal/modules/esm/resolve:984:11)
// //     at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:736:12)
// //     at #cachedDefaultResolve (node:internal/modules/esm/loader:660:25)
// //     at ModuleLoader.resolve (node:internal/modules/esm/loader:643:38)
// //     at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:279:38)
// //     at ModuleJob._link (node:internal/modules/esm/module_job:137:49) {
// //   code: 'ERR_MODULE_NOT_FOUND',
// //   url: 'file:///Users/stuart/repos/slupe/proj/comp/listener/src/index.js'
// // }
// // Node.js v23.9.0
// // stuart@Stuarts-MacBook-Pro ~/r/slupe (dev) [1]>

// // Edit
// // The module isn't built. Let's check if there's a build output directory:

// // sh
// // #!nesl [@three-char-SHA-256: m8t]
// // action = "file_read"
// // path = "/Users/stuart/repos/slupe/package.json"
// // #!end_m8t





// import { startListener } from './proj/comp/listener/src/index.js';
// import { writeFile } from 'fs/promises';
// import { tmpdir } from 'os';
// import { join } from 'path';

// const testFile = join(tmpdir(), 'slupe-speed-test.md');

// console.log('Test file:', testFile);

// await writeFile(testFile, `# Speed Test

// \`\`\`sh nesl
// #!nesl [@three-char-SHA-256: tst]
// action = "file_write"
// path = "/tmp/speed-test.txt"
// content = <<'EOT_tst'
// Speed test content
// EOT_tst
// #!end_tst
// \`\`\`
// `);

// console.log('Starting listener...');
// const handle = await startListener({
//   filePath: testFile,
//   debounceMs: 50, // Even lower for testing
//   debug: true
// });

// console.log('Listener started. Now updating file...');

// setTimeout(async () => {
//   console.time('file-update-to-output');
//   await writeFile(testFile, `# Updated Speed Test

// \`\`\`sh nesl
// #!nesl [@three-char-SHA-256: upd]
// action = "file_write"
// path = "/tmp/speed-test-updated.txt"
// content = <<'EOT_upd'
// Updated speed test content
// EOT_upd
// #!end_upd
// \`\`\`
// `);
  
//   // Check when output appears
//   const checkInterval = setInterval(async () => {
//     try {
//       const outputPath = join(tmpdir(), '.slupe-output-latest.txt');
//       const { readFile } = await import('fs/promises');
//       const content = await readFile(outputPath, 'utf-8');
//       if (content.includes('upd')) {
//         console.timeEnd('file-update-to-output');
//         clearInterval(checkInterval);
//         await handle.stop();
//         process.exit(0);
//       }
//     } catch (e) {}
//   }, 10);
// }, 1000);
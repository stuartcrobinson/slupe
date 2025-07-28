#!/usr/bin/env node

import { startListener } from '../comp/listener/src/index';
import { loadConfig } from '../comp/config/src/index';
import { join } from 'path';
import { access, writeFile } from 'fs/promises';

async function main() {
  const args = process.argv.slice(2);
  const hasClipboardFlag = args.includes('--clipboard');

  const config = await loadConfig(process.cwd());
  const useClipboard = hasClipboardFlag || (config.clipboard ?? false);

  const filePath = join(process.cwd(), 'slupe_input.md');

  // Create file if it doesn't exist
  try {
    await access(filePath);
  } catch {
    await writeFile(filePath, '', 'utf8');
    console.log(`Created: ${filePath}`);
  }

  console.log(`Starting listener on: ${filePath}`);
  console.log(`Clipboard: ${useClipboard ? 'enabled' : 'disabled'}`);

  const handle = await startListener({
    filePath,
    debounceMs: 500,
    outputFilename: '.slupe_output.md',
    useClipboard
  });

  process.on('SIGINT', async () => {
    console.log('\nStopping...');
    await handle.stop();
    process.exit(0);
  });

  await new Promise(() => { });
}

main().catch(console.error);
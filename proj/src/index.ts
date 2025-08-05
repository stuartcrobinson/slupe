#!/usr/bin/env node

import { startListener } from '../comp/listener/src/index.js';
import { loadConfig } from '../comp/config/src/index.js';
import { updateInstructions } from '../comp/instruct-gen/src/index.js';
import { join } from 'path';
import { access, writeFile } from 'fs/promises';

function showHelp(): void {
  console.log(`Usage: slupe [options]

Options:
  --clipboard-read         Enable clipboard monitoring (default: true)
  --clipboard-write        Enable clipboard writing (default: true)
  --no-clipboard-read      Disable clipboard monitoring
  --no-clipboard-write     Disable clipboard writing
  --input_file <path>      Input file path (default: slupe_input.md)
  --output_file <path>     Output file path (default: .slupe_output.md)
  --help                   Show this help message

Config file options (slupe.yml):
  clipboard_read: boolean  Enable clipboard monitoring (default: true)
  clipboard_write: boolean Enable clipboard writing (default: true)
  input_file: string       Default input file path
  output_file: string      Default output file path
  debounce_ms: number      File watch debounce in milliseconds (default: 200)
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    showHelp();
    process.exit(0);
  }
  
  const getArgValue = (flag: string): string | undefined => {
    const index = args.indexOf(flag);
    if (index >= 0 && index + 1 < args.length) {
      return args[index + 1];
    }
    return undefined;
  };

  const hasClipboardReadFlag = args.includes('--clipboard-read');
  const hasClipboardWriteFlag = args.includes('--clipboard-write');
  const hasNoClipboardReadFlag = args.includes('--no-clipboard-read');
  const hasNoClipboardWriteFlag = args.includes('--no-clipboard-write');
  const inputFileArg = getArgValue('--input_file');
  const outputFileArg = getArgValue('--output_file');

  const config = await loadConfig(process.cwd());
  
  // Generate NESL instructions before any processing
  await updateInstructions(process.cwd(), config['allowed-actions']);
  
  const useClipboardRead = hasClipboardReadFlag ? true : 
                          hasNoClipboardReadFlag ? false : 
                          (config.clipboard_read ?? true);
  const useClipboardWrite = hasClipboardWriteFlag ? true :
                           hasNoClipboardWriteFlag ? false :
                           (config.clipboard_write ?? true);
  const inputFile = inputFileArg || config['input_file'] || 'slupe_input.md';
  const outputFile = outputFileArg || config['output_file'] || '.slupe_output.md';

  const filePath = join(process.cwd(), inputFile);

  // Create file if it doesn't exist
  try {
    await access(filePath);
  } catch {
    await writeFile(filePath, '', 'utf8');
    console.log(`Created: ${filePath}`);
  }

  console.log(`Starting listener on: ${filePath}`);
  console.log(`Clipboard read: ${useClipboardRead ? 'enabled' : 'disabled'}`);
  console.log(`Clipboard write: ${useClipboardWrite ? 'enabled' : 'disabled'}`);
  if (useClipboardRead) {
    console.log('To input nesl actions via clipboard, copy the target content, and then copy some content that includes the original content plus some extra text, within 2 seconds. (either order)');
  }

  const debounceMs = config.debounce_ms || parseInt(process.env.SLUPE_DEBOUNCE || '50', 10);
  
  console.log(`Using debounceMs: ${debounceMs}`);
  
  const handle = await startListener({
    filePath,
    debounceMs,
    outputFilename: outputFile,
    useClipboardRead,
    useClipboardWrite
  });

  process.on('SIGINT', async () => {
    console.log('\nStopping...');
    await handle.stop();
    process.exit(0);
  });

  await new Promise(() => { });
}

main().catch(console.error);
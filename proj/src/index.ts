#!/usr/bin/env node

import { startListener } from '../comp/listener/src/index.js';
import { loadConfig } from '../comp/config/src/index.js';
import { join } from 'path';
import { access, writeFile } from 'fs/promises';

function showHelp(): void {
  console.log(`Usage: slupe [options]

Options:
  --clipboard              Enable clipboard copy on execution
  --input_file <path>      Input file path (default: slupe_input.md)
  --output_file <path>     Output file path (default: .slupe_output.md)
  --help                   Show this help message

Config file options (slupe.yml):
  clipboard: boolean       Enable clipboard by default
  input_file: string       Default input file path
  output_file: string      Default output file path
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

  const hasClipboardFlag = args.includes('--clipboard');
  const inputFileArg = getArgValue('--input_file');
  const outputFileArg = getArgValue('--output_file');

  const config = await loadConfig(process.cwd());
  const useClipboard = hasClipboardFlag || (config.clipboard ?? false);
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
  console.log(`Clipboard: ${useClipboard ? 'enabled' : 'disabled'}`);

  const handle = await startListener({
    filePath,
    debounceMs: 500,
    outputFilename: outputFile,
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
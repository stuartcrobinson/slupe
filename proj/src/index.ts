#!/usr/bin/env node

import { startListener } from '../comp/listener/src/index.js';
import { loadConfig } from '../comp/config/src/index.js';
import { updateInstructions } from '../comp/instruct-gen/src/index.js';
import { join, dirname } from 'path';
import { access, writeFile, readFile, appendFile } from 'fs/promises';
import * as readline from 'readline';
import { fileURLToPath } from 'url';

// Get version from package.json
async function getVersion(): Promise<string> {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const packagePath = join(dirname(__filename), '../../package.json');
    const packageContent = await readFile(packagePath, 'utf-8');
    const packageData = JSON.parse(packageContent);
    return packageData.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function showHelp(): void {
  console.log(`
⛵️ slupe - LLM coder 'tools' for any model

Usage: slupe [options]

Options:
  --clipboard-read         Enable clipboard monitoring (default: true)
  --clipboard-write        Enable clipboard writing (default: true)
  --no-clipboard-read      Disable clipboard monitoring
  --no-clipboard-write     Disable clipboard writing
  --input_file <path>      Input file path (default: slupe_input.md)
  --output_file <path>     Output file path (default: .slupe_output.md)
  --debug                  Enable debug output
  --help                   Show this help message

Terminal Commands:
  ?                        Show help
  c                        Clear input file
  s                        Show current status
  r                        Force reload file
  <paste NESL content>     Add content to input file (30+ chars)

Config file options (slupe.yml):
  clipboard_read: boolean  Enable clipboard monitoring (default: true)
  clipboard_write: boolean Enable clipboard writing (default: true)
  input_file: string       Default input file path
  output_file: string      Default output file path
  debounce_ms: number      File watch debounce in milliseconds (default: 200)

Examples:
  slupe                    Start with defaults
  slupe --debug            Start with debug output
  slupe --no-clipboard     Start without clipboard features

Learn more: https://github.com/stuartcrobinson/slupe
`);
}

function showQuickHelp(): void {
  console.log(`
Need help? 
• Add \`\`\`nesl blocks to execute file operations
• Run 'slupe --help' for full documentation
• Visit github.com/stuartcrobinson/slupe

Terminal commands: ? (help), c (clear), s (status), r (reload)
Or paste NESL content directly (30+ characters)
`);
}

async function setupTerminalInput(
  inputFilePath: string,
  useClipboardRead: boolean,
  useClipboardWrite: boolean,
  outputFile: string,
  version: string
): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
  });

  // Prevent the default prompt
  rl.setPrompt('');

  rl.on('SIGINT', () => {
    process.emit('SIGINT');
  });

  rl.on('line', async (input) => {
    const trimmed = input.trim();

    // Handle short commands (< 30 chars)
    if (trimmed.length < 30) {
      switch (trimmed.toLowerCase()) {
        case '?':
        case 'h':
        case 'help':
          showQuickHelp();
          break;

        case 'c':
        case 'clear':
          await writeFile(inputFilePath, '', 'utf8');
          console.log('✓ Input file cleared');
          break;

        case 's':
        case 'status':
          console.log(`
⛵️ slupe v${version}
📁 Input:  ${inputFilePath}
📁 Output: ${outputFile}
📋 Clipboard: read ${useClipboardRead ? '✓' : '✗'} write ${useClipboardWrite ? '✓' : '✗'}
`);
          break;

        case 'r':
        case 'reload':
          // Force reload by appending a newline
          await appendFile(inputFilePath, '\n', 'utf8');
          console.log('✓ Reloading file...');
          break;

        default:
          if (trimmed.length > 0) {
            console.log(`Unknown command: '${trimmed}'. Type ? for help.`);
          }
      }
    } else {
      // Treat as NESL content to append to file
      try {
        const currentContent = await readFile(inputFilePath, 'utf8');
        const newContent = currentContent.trim() + '\n\n' + trimmed + '\n';
        await writeFile(inputFilePath, newContent, 'utf8');
        console.log('✓ Content added to input file');
      } catch (error) {
        console.error('Error writing to input file:', error);
      }
    }
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const version = await getVersion();

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
  const hasDebugFlag = args.includes('--debug');
  const inputFileArg = getArgValue('--input_file');
  const outputFileArg = getArgValue('--output_file');

  const config = await loadConfig(process.cwd());

  // Generate NESL instructions before any processing
  await updateInstructions(process.cwd(), config['allowed-actions']);

  const useClipboardRead = hasClipboardReadFlag ? true :
    hasNoClipboardReadFlag ? false :
      (config.clipboard ?? true);
  const useClipboardWrite = hasClipboardWriteFlag ? true :
    hasNoClipboardWriteFlag ? false :
      (config.clipboard ?? true);
  const inputFile = inputFileArg || config['input_file'] || 'slupe_input.md';
  const outputFile = outputFileArg || config['output_file'] || '.slupe_output.md';

  const filePath = join(process.cwd(), inputFile);
  const outputPath = join(process.cwd(), outputFile);

  // Create file if it doesn't exist
  try {
    await access(filePath);
  } catch {
    await writeFile(filePath, '', 'utf8');
  }

  // Clean startup message
  console.log(`⛵️ slupe v${version} • Watching ${inputFile} → ${outputFile}`);
  console.log(`📋 Clipboard: read ${useClipboardRead ? '✓' : '✗'} write ${useClipboardWrite ? '✓' : '✗'} • ? for help`);

  if (hasDebugFlag) {
    const debounceMs = config.debounce_ms || parseInt(process.env.SLUPE_DEBOUNCE || '50', 10);
    console.log(`\n[DEBUG] Mode enabled`);
    console.log(`[DEBUG] Working directory: ${process.cwd()}`);
    console.log(`[DEBUG] Debounce: ${debounceMs}ms`);
    console.log(`[DEBUG] Full input path: ${filePath}`);
    console.log(`[DEBUG] Full output path: ${outputPath}`);
    if (useClipboardRead) {
      console.log('[DEBUG] Clipboard tip: Copy target content, then copy content+extra within 2 seconds');
    }
  }

  const debounceMs = config.debounce_ms || parseInt(process.env.SLUPE_DEBOUNCE || '50', 10);

  const handle = await startListener({
    filePath,
    debounceMs,
    outputFilename: outputFile,
    useClipboardRead,
    useClipboardWrite,
    debug: hasDebugFlag
  });

  // Setup terminal input handling
  await setupTerminalInput(
    filePath,
    useClipboardRead,
    useClipboardWrite,
    outputPath,
    version
  );

  process.on('SIGINT', async () => {
    const farewells = [
      '👋 bye-bye',
      '👋 seeya',
      '👋 bye bye',
      '👋 ciao',
      '👋 peace',
      '👋 have a good day',
      '👋 take it easy',
      '👋 toodle-oo',
      '👋 laters',
      '👋 may the wind be at your back and the sun upon your face',
      '👋 thanks for using slupe!',
      '👋 l8r',
    ];

    const randomFarewell = farewells[Math.floor(Math.random() * farewells.length)];
    console.log('\n' + randomFarewell);
    await handle.stop();
    process.exit(0);
  });

  await new Promise(() => { });
}

main().catch(console.error);
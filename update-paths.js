import { marked } from 'marked';
import fs from 'fs/promises';
import path from 'path';

async function processFiles(fileListText) {
  const files = fileListText.trim().split('\n').filter(f => f.trim());

  for (const file of files) {
    try {
      await processFile(file.trim());
      console.log(`✓ Processed: ${file}`);
    } catch (error) {
      console.error(`✗ Error processing ${file}:`, error.message);
    }
  }
}

async function processFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  let currentTestName = null;
  let inNeslBlock = false;
  let inHeredoc = false;
  let heredocDelimiter = null;
  let modified = false;

  const updatedLines = lines.map((line, index) => {
    // Track current test name from ### headers
    if (line.startsWith('### ')) {
      currentTestName = 't_' + line.substring(8).trim();
      return line;
    }

    // Track NESL block boundaries
    if (line.includes('#!NESL')) {
      inNeslBlock = true;
      return line;
    }
    if (line.includes('#!END_NESL')) {
      inNeslBlock = false;
      return line;
    }

    // Check for heredoc start
    if (inNeslBlock && line.includes('<<')) {
      const heredocMatch = line.match(/<<'?([A-Z_]+)'?$/);
      if (heredocMatch) {
        inHeredoc = true;
        heredocDelimiter = heredocMatch[1];
        return line;
      }
    }

    // Check for heredoc end
    if (inHeredoc && line.trim() === heredocDelimiter) {
      inHeredoc = false;
      heredocDelimiter = null;
      return line;
    }

    // Replace /tmp/ with /tmp/{test-name}/ everywhere if we have a current test
    if (currentTestName) {
      const replacedLine = line.replace(/\/tmp\//g, `/tmp/${currentTestName}/`);
      if (replacedLine !== line) {
        modified = true;
        return replacedLine;
      }
    }

    return line;
  });

  if (modified) {
    await fs.writeFile(filePath, updatedLines.join('\n'));
  }

  return modified;
}

// Main execution
async function main() {
  // Read file list from stdin or from a file
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node update-paths.js <file-list.txt>');
    console.log('   or: node update-paths.js - (to read from stdin)');
    process.exit(1);
  }

  let fileListText;

  if (args[0] === '-') {
    // Read from stdin
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    fileListText = Buffer.concat(chunks).toString();
  } else {
    // Read from file
    fileListText = await fs.readFile(args[0], 'utf-8');
  }

  await processFiles(fileListText);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { processFiles, processFile };
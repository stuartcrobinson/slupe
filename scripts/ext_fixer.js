#!/usr/bin/env node

import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join, dirname, resolve } from 'path';

const IMPORT_REGEX = /^(\s*(?:import|export)\s+(?:type\s+)?(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)?(?:\s*,\s*(?:\{[^}]*\}|\w+))?\s+from\s+['"])([^'"]+)(['"];?\s*)$/gm;

async function fileExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function findActualFile(basePath, importPath) {
  // Skip if already has extension
  if (importPath.endsWith('.ts') || importPath.endsWith('.js') || importPath.endsWith('.json')) {
    return importPath;
  }
  
  // Skip node_modules
  if (!importPath.startsWith('.')) {
    return importPath;
  }
  
  const absolutePath = resolve(dirname(basePath), importPath);
  
  // Check in order: exact match as .ts, as index.ts, as .js, as index.js
  const candidates = [
    absolutePath + '.ts',
    join(absolutePath, 'index.ts'),
    absolutePath + '.js',
    join(absolutePath, 'index.js'),
  ];
  
  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      // Return relative path with extension
      const ext = candidate.endsWith('index.ts') ? '/index.ts' : '.ts';
      return importPath + ext;
    }
  }
  
  // Default to .ts if nothing found
  return importPath + '.ts';
}

async function processFile(filePath) {
  const content = await readFile(filePath, 'utf8');
  let modified = false;
  
  const newContent = await content.replace(IMPORT_REGEX, async (match, prefix, importPath, suffix) => {
    if (importPath.startsWith('.') && !importPath.endsWith('.ts') && !importPath.endsWith('.js')) {
      const newPath = await findActualFile(filePath, importPath);
      if (newPath !== importPath) {
        modified = true;
        return prefix + newPath + suffix;
      }
    }
    return match;
  });
  
  // Process replacements sequentially to handle async
  let processedContent = content;
  const matches = [...content.matchAll(IMPORT_REGEX)];
  
  for (const match of matches) {
    const [fullMatch, prefix, importPath, suffix] = match;
    if (importPath.startsWith('.') && !importPath.endsWith('.ts') && !importPath.endsWith('.js')) {
      const newPath = await findActualFile(filePath, importPath);
      if (newPath !== importPath) {
        modified = true;
        processedContent = processedContent.replace(fullMatch, prefix + newPath + suffix);
      }
    }
  }
  
  if (modified) {
    await writeFile(filePath, processedContent);
    console.log(`Updated: ${filePath}`);
  }
}

async function processDirectory(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      await processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      await processFile(fullPath);
    }
  }
}

// Run the script
const targetDir = process.argv[2] || 'proj';
console.log(`Processing TypeScript files in: ${targetDir}`);
await processDirectory(targetDir);
console.log('Done!');
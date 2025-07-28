#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DATA_DIR = path.join(__dirname, './proj/comp/fs-ops/test-data/integration');

// Read and parse test case files
function parseTestFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const testGroups = new Map();
  let currentGroup = null;
  let currentContent = [];
  let inGroup = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for group header (## group_name)
    if (line.match(/^## \w+$/)) {
      // Save previous group if exists
      if (currentGroup) {
        testGroups.set(currentGroup, currentContent.join('\n'));
      }
      
      // Start new group
      currentGroup = line.substring(3).trim();
      currentContent = [`# ${currentGroup} Integration Tests\n`];
      
      // Add status line if it exists
      if (i + 2 < lines.length && lines[i + 2].includes('**Status**:')) {
        currentContent.push(lines[i + 2]);
        currentContent.push('');
        i += 2;
      }
      
      currentContent.push(`## ${currentGroup}`);
      inGroup = true;
    } else if (inGroup) {
      currentContent.push(line);
    }
  }
  
  // Save last group
  if (currentGroup) {
    testGroups.set(currentGroup, currentContent.join('\n'));
  }
  
  return testGroups;
}

// Process files
function restructureTests() {
  const files = [
    'file-operations.cases.md',
    'files-read.cases.md'
  ];
  
  console.log('Starting test case restructuring...');
  console.log('Test data directory:', TEST_DATA_DIR);
  
  if (!fs.existsSync(TEST_DATA_DIR)) {
    console.error(`Error: Directory not found: ${TEST_DATA_DIR}`);
    process.exit(1);
  }
  
  console.log('\nFiles in directory:');
  fs.readdirSync(TEST_DATA_DIR).forEach(f => console.log(`  ${f}`));
  console.log('');
  
  for (const file of files) {
    const filePath = path.join(TEST_DATA_DIR, file);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: ${filePath} not found, skipping...`);
      continue;
    }
    
    console.log(`Processing ${file}...`);
    const testGroups = parseTestFile(filePath);
    
    // Create individual files for each group
    for (const [groupName, content] of testGroups) {
      const newFileName = `${groupName}.cases.md`;
      const newFilePath = path.join(TEST_DATA_DIR, newFileName);
      
      // Clean up trailing empty lines
      const cleanedContent = content.replace(/\n+$/, '\n');
      
      fs.writeFileSync(newFilePath, cleanedContent);
      console.log(`  Created: ${newFileName}`);
    }
  }
  
  // Remove original files
  console.log('\nRemoving original files...');
  for (const file of files) {
    const filePath = path.join(TEST_DATA_DIR, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`  Removed: ${file}`);
    }
  }
  
  // List all test case files in the directory
  console.log('\nFinal test case files:');
  const finalFiles = fs.readdirSync(TEST_DATA_DIR)
    .filter(f => f.endsWith('.cases.md'))
    .sort();
  
  finalFiles.forEach(f => {
    console.log(`  ${f}`);
  });
  
  console.log('\nRestructuring complete!');
}

// Run the script
try {
  restructureTests();
} catch (error) {
  console.error('Error during restructuring:', error.message);
  process.exit(1);
}
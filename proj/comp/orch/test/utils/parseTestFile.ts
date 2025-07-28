import { readFileSync } from 'fs';
import { load as loadYaml } from 'js-yaml';

export interface TestCase {
  name: string;
  config: any;
  input: string;
  expected: any;
  verify?: boolean;
}

/**
 * Parse test cases from markdown file containing:
 * - Test name as ## heading
 * - YAML config block
 * - NESL input block
 * - JSON expected output block
 */
export function parseTestFile(filepath: string): TestCase[] {
  const content = readFileSync(filepath, 'utf8');
  const testCases: TestCase[] = [];
  
  // Split by test case headers (## XXX-name)
  const sections = content.split(/^## /m).slice(1); // Skip content before first ##
  
  for (const section of sections) {
    const lines = section.split('\n');
    const name = lines[0].trim();
    
    let config: any = {};
    let input = '';
    let expected: any = {};
    let verify = false;
    
    let currentBlock = '';
    let blockType = '';
    let inCodeBlock = false;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for code block markers
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          blockType = line.slice(3).trim();
          currentBlock = '';
        } else {
          // End of code block - process it
          inCodeBlock = false;
          
          if (blockType === 'yaml') {
            const parsed = loadYaml(currentBlock);
            // Extract config from under 'config:' key if present
            config = parsed?.config || parsed || {};
          } else if (blockType === 'sh nesl') {
            input = currentBlock;
          } else if (blockType === 'json') {
            try {
              expected = JSON.parse(currentBlock);
            } catch (e) {
              console.error(`Failed to parse JSON for test case "${name}":`);
              console.error(`JSON content:\n${currentBlock}`);
              console.error(`Error: ${e}`);
              throw e;
            }
          }
          
          blockType = '';
        }
      } else if (inCodeBlock) {
        currentBlock += line + '\n';
      } else if (line.startsWith('Verify:')) {
        verify = true;
      }
    }
    
    // Trim trailing newline from input
    input = input.trimEnd();
    
    testCases.push({
      name,
      config,
      input,
      expected,
      verify
    });
  }
  
  return testCases;
}
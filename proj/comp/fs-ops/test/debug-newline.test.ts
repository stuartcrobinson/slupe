// Minimal debug test to trace where newlines are lost
import { describe, it } from 'vitest';
import { readFileSync, writeFileSync } from 'fs';
import { marked } from 'marked';
import { parseNeslResponse } from '../../nesl-action-parser/src/index.js';
import { FsOpsExecutor } from '../../src/index.js';
import type { FsGuard } from '../../fs-guard/src/index.js';

const mockGuard: FsGuard = {
  async check(action) {
    return { allowed: true };
  }
};

describe('Debug newline issue', () => {
  it('trace 001-append-after-write', async () => {
    // Read the test case directly
    const mdContent = readFileSync('/Users/stuart/repos/slupe/proj/comp/fs-ops/test-data/integration/write_replace_result_contents/file_append.cases.md', 'utf8');
    
    // Extract just the 001 test section
    const test001Match = mdContent.match(/### 001-append-after-write([\s\S]*?)(?=###|$)/);
    if (!test001Match) throw new Error('Could not find test 001');
    
    const test001Content = test001Match[1];
    console.log('\n=== RAW MARKDOWN ===');
    console.log(JSON.stringify(test001Content.substring(0, 500)));
    
    // Parse with marked
    const tokens = marked.lexer(test001Content);
    const codeBlocks = tokens.filter(t => t.type === 'code');
    
    console.log('\n=== MARKED TOKENS ===');
    codeBlocks.forEach((block, i) => {
      console.log(`Code block ${i}:`);
      console.log(`Length: ${block.text.length}`);
      console.log(`Last chars: ${JSON.stringify(block.text.slice(-20))}`);
      console.log(`Raw: ${JSON.stringify(block.raw)}`);
    });
    
    // Parse the append NESL (second code block)
    const appendNesl = codeBlocks[1].text;
    console.log('\n=== NESL INPUT ===');
    console.log(`Full append NESL: ${JSON.stringify(appendNesl)}`);
    
    const parseResult = await parseNeslResponse(appendNesl);
    console.log('\n=== PARSE RESULT ===');
    console.log(JSON.stringify(parseResult, null, 2));
    
    if (parseResult.actions.length > 0) {
      const content = parseResult.actions[0].parameters.content;
      console.log('\n=== CONTENT TO APPEND ===');
      console.log(`Length: ${content.length}`);
      console.log(`JSON: ${JSON.stringify(content)}`);
      console.log(`First char code: ${content.charCodeAt(0)}`);
    }
    
    // Also check the expected content block
    const expectedContent = codeBlocks[3]?.text;
    console.log('\n=== EXPECTED CONTENT ===');
    console.log(`Length: ${expectedContent?.length}`);
    console.log(`JSON: ${JSON.stringify(expectedContent)}`);
  });
});
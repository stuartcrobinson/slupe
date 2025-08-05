import { describe, it } from 'vitest';
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

describe('Direct append test', () => {
  it('manually test append_to_file behavior', () => {
    const testPath = '/tmp/test-append-trace/log.txt';
    const dir = dirname(testPath);
    
    // Ensure directory exists
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    // Write initial content
    const initial = '=== LOG START ===\n[2024-01-01 09:00] System initialized\n[2024-01-01 09:15] Configuration loaded';
    writeFileSync(testPath, initial, 'utf8');
    console.log('Initial content length:', initial.length);
    console.log('Initial content JSON:', JSON.stringify(initial));
    
    // Append content (exactly as NESL parser provides)
    const toAppend = '\n[2024-01-01 10:00] User session started\n[2024-01-01 10:30] Transaction completed\n=== LOG END ===';
    appendFileSync(testPath, toAppend, 'utf8');
    console.log('Append content length:', toAppend.length);
    console.log('Append content JSON:', JSON.stringify(toAppend));
    
    // Read final content
    const final = readFileSync(testPath, 'utf8');
    console.log('Final content length:', final.length);
    console.log('Final content JSON:', JSON.stringify(final));
    
    // Expected content
    const expected = '=== LOG START ===\n[2024-01-01 09:00] System initialized\n[2024-01-01 09:15] Configuration loaded\n\n[2024-01-01 10:00] User session started\n[2024-01-01 10:30] Transaction completed\n=== LOG END ===';
    console.log('Expected length:', expected.length);
    console.log('Expected JSON:', JSON.stringify(expected));
    
    console.log('Match:', final === expected);
  });
});
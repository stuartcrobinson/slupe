import { describe, it, expect } from 'vitest';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';

describe('minimal fs test', () => {
  it('can write and read files', () => {
    const path = '/tmp/minimal-test.txt';
    const content = 'test content';
    
    // Write
    writeFileSync(path, content);
    
    // Read
    const read = readFileSync(path, 'utf8');
    expect(read).toBe(content);
    
    // Cleanup
    unlinkSync(path);
    expect(existsSync(path)).toBe(false);
  });
  
  it('can run multiple times', () => {
    for (let i = 0; i < 10; i++) {
      const path = `/tmp/minimal-${i}.txt`;
      writeFileSync(path, `content ${i}`);
      unlinkSync(path);
    }
    expect(true).toBe(true);
  });
});
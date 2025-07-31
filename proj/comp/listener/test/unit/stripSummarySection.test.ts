import { describe, it, expect } from 'vitest';
import { stripSummarySection, hasExistingSlupeResults } from '../../src/content-processor.js';

describe('stripSummarySection', () => {

  it('returns full content when no summary', () => {
    const content = '# My Document\n\nSome content here.';
    expect(stripSummarySection(content)).toBe(content);
  });

  it('strips summary at start of file', () => {
    const content = `=== SLUPE RESULTS ===
abc ✅ file_write /tmp/test.txt
=== END ===

# My Document

Some content here.`;

    const expected = `# My Document

Some content here.`;

    expect(stripSummarySection(content)).toBe(expected);
  });

  it('handles file ending with summary', () => {
    const content = `=== SLUPE RESULTS ===
abc ✅ file_write /tmp/test.txt
=== END ===`;

    expect(stripSummarySection(content)).toBe('');
  });

  it('handles no blank line after summary', () => {
    const content = `=== SLUPE RESULTS ===
abc ✅ file_write /tmp/test.txt
=== END ===
# Document`;

    expect(stripSummarySection(content)).toBe('# Document');
  });

  it('preserves END marker in regular content', () => {
    const content = `# Document

This is about === END === markers in content.

More text here.`;

    expect(stripSummarySection(content)).toBe(content);
  });

  it('handles whitespace before summary marker', () => {
    const content = `   
    
=== SLUPE RESULTS ===
abc ✅ file_write /tmp/test.txt
=== END ===

# Document`;

    expect(stripSummarySection(content)).toBe('# Document');
  });
});

describe('hasExistingSlupeResults', () => {
  it('returns true when file starts with SLUPE RESULTS', () => {
    const content = '=== SLUPE RESULTS ===\nsome results\n=== END ===';
    expect(hasExistingSlupeResults(content)).toBe(true);
  });

  it('returns true with leading whitespace', () => {
    const content = '   \n\t=== SLUPE RESULTS ===\nsome results\n=== END ===';
    expect(hasExistingSlupeResults(content)).toBe(true);
  });

  it('returns true with partial marker', () => {
    const content = '=== SLUPE RESULTS\nsome text';
    expect(hasExistingSlupeResults(content)).toBe(true);
  });

  it('returns false when marker is not at start', () => {
    const content = 'Some text\n=== SLUPE RESULTS ===';
    expect(hasExistingSlupeResults(content)).toBe(false);
  });

  it('returns false with no marker', () => {
    const content = '# My Document\n\nSome content';
    expect(hasExistingSlupeResults(content)).toBe(false);
  });
});
import { describe, it, expect } from 'vitest';
import { stripSummarySection } from '../../src/content-processor.js';

describe('stripSummarySection', () => {

  it('returns full content when no summary', () => {
    const content = '# My Document\n\nSome content here.';
    expect(stripSummarySection(content)).toBe(content);
  });

  it('strips summary at start of file', () => {
    const content = `📋 Copied to clipboard

=== SLUPE RESULTS ===
abc ✅ file_write /tmp/test.txt
=== END ===

# My Document

Some content here.`;

    const expected = `# My Document

Some content here.`;

    expect(stripSummarySection(content)).toBe(expected);
  });

  it('handles file ending with summary', () => {
    const content = `📋 Copied to clipboard

=== SLUPE RESULTS ===
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
});
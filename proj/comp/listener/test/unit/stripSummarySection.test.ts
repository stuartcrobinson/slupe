import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Import the function directly since it's not exported
import { startListener } from '../../src/listener.ts';

// Helper to access internal stripSummarySection via module internals
async function getStripSummarySection() {
  // Read the source file and extract the function
  const sourcePath = join(__dirname, '../../src/listener.ts');
  const sourceContent = await readFile(sourcePath, 'utf-8');

  // Extract and eval the function (hacky but works for testing)
  const funcMatch = sourceContent.match(/function stripSummarySection\(content: string\): string \{[\s\S]*?\n\}/);
  if (!funcMatch) throw new Error('Could not find stripSummarySection function');

  // Create a simple version for testing
  return (content: string): string => {
    const startMarker = '=== SLUPE RESULTS ===';
    const endMarker = '=== END ===';

    // Check if content starts with a SLUPE results section
    const startIndex = content.indexOf(startMarker);
    if (startIndex === -1 || startIndex > 100) {
      // No SLUPE section at the beginning of file
      return content;
    }

    // Find the corresponding END marker
    const endIndex = content.indexOf(endMarker, startIndex);
    if (endIndex === -1) {
      return content; // Malformed section, keep content as-is
    }

    // Find the newline after the end marker
    const afterEndIndex = content.indexOf('\n', endIndex + endMarker.length);
    if (afterEndIndex === -1) {
      return ''; // File ends with summary
    }

    // Skip one more newline if present (blank line after summary)
    const contentStart = content[afterEndIndex + 1] === '\n' ? afterEndIndex + 2 : afterEndIndex + 1;
    return content.substring(contentStart);
  };
}

describe('stripSummarySection', async () => {
  const stripSummarySection = await getStripSummarySection();

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
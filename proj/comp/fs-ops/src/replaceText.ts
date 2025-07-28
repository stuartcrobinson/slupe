/**
 * Replace occurrences of text in content with optional count limit
 * @param content - Original content
 * @param oldText - Text to find and replace
 * @param newText - Replacement text
 * @param count - Maximum replacements (default: replace all)
 * @returns Object with result string and number of replacements made
 */
export function replaceText(
  content: string, 
  oldText: string, 
  newText: string, 
  count?: number
): { result: string; replacements: number } {
  if (oldText === '') {
    throw new Error('old_text cannot be empty');
  }

  let result = content;
  let replacements = 0;
  let startIndex = 0;

  while (true) {
    const index = result.indexOf(oldText, startIndex);
    if (index === -1) break;
    
    if (count !== undefined && replacements >= count) break;
    
    result = result.slice(0, index) + newText + result.slice(index + oldText.length);
    startIndex = index + newText.length;
    replacements++;
  }

  return { result, replacements };
}
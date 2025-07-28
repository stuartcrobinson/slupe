

export function filterByAllowedTools(
  markdown: string, 
  allowedTools: string[]
): string {
  const allowed = new Set(allowedTools);
  const lines = markdown.split('\n');
  const output: string[] = [];
  
  let inActionSection = false;
  let currentTool: string | null = null;
  let skipCurrentTool = false;
  
  for (const line of lines) {
    // Detect "## Actions" section
    if (line === '## Actions') {
      inActionSection = true;
      output.push(line);
      continue;
    }
    
    // Detect other sections (exit Actions)
    if (inActionSection && line.startsWith('## ') && line !== '## Actions') {
      inActionSection = false;
      skipCurrentTool = false; // Reset skip flag when leaving Actions section
    }
    
    // Process tool headers in Actions section
    if (inActionSection && line.startsWith('### `')) {
      const match = line.match(/^### `([^`]+)`/);
      currentTool = match?.[1] || null;
      skipCurrentTool = currentTool ? !allowed.has(currentTool) : false;
      
      if (skipCurrentTool) continue; // Skip the header line itself
    }
    
    // Skip lines for disallowed tools only within Actions section
    if (!skipCurrentTool || !inActionSection) {
      output.push(line);
    }
  }
  
  return output.join('\n');
}
import { marked } from 'marked';

const md = `# Test
\`\`\`js
code here
\`\`\`
`;

const tokens = marked.lexer(md);
console.log('Token types:', tokens.map(t => ({
  type: t.type,
  hasText: 'text' in t,
  props: Object.keys(t)
})));
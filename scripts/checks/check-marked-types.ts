import { marked } from 'marked';
import type * as MarkedTypes from 'marked';

// Try to see what's available
console.log('marked keys:', Object.keys(marked));
console.log('marked.Tokens exists?', 'Tokens' in marked);

// The tokens are likely under a different export
const tokens = marked.lexer('# test\n```js\ncode\n```');
console.log('First token type:', tokens[0]?.type);
console.log('First token constructor:', tokens[0]?.constructor?.name);
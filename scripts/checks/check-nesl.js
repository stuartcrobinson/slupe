import { parseNesl } from 'nesl';
import * as nesl from 'nesl';

console.log('nesl-js exports:', Object.keys(nesl));
console.log('\nparseNesl type:', typeof parseNesl);

const result = parseNesl(`#!nesl [@three-char-SHA-256: abc]
action = "test"
#!end_abc`);

console.log('\nResult:', JSON.stringify(result, null, 2));
console.log('\nResult type:', typeof result);
console.log('Result constructor:', result?.constructor?.name);
console.log('Blocks type:', Array.isArray(result?.blocks) ? 'array' : typeof result?.blocks);
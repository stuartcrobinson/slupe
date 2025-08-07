import type { Parser, ParsedStructure } from './types.js';
import { TypeScriptParser } from './code/languages/typescript.js';
import { PythonParser } from './code/languages/python.js';
import { RemarkParser } from './markdown/remark-parser.js';
import { LineParser } from './plaintext/line-parser.js';

export type { Parser, ParsedStructure };

export function getParser(filepath: string): Parser {
  const ext = filepath.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'mjs':
      return new TypeScriptParser();
    case 'py':
      return new PythonParser();
    case 'md':
      return new RemarkParser();
    default:
      return new LineParser();
  }
}
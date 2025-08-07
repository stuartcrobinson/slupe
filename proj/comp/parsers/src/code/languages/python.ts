import type { Parser, ParsedStructure } from '../../types.js';

export class PythonParser implements Parser {
  parse(content: string): ParsedStructure[] {
    // Tree-sitter Python parsing
    throw new Error('Not implemented');
  }
}
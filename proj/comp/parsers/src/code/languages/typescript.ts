import type { Parser, ParsedStructure } from '../../types.js';

export class TypeScriptParser implements Parser {
  parse(_content: string): ParsedStructure[] {
    // Tree-sitter TypeScript parsing
    throw new Error('Not implemented');
  }
}
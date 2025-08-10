import type { Parser, ParsedStructure } from '../types.js';

export class LineParser implements Parser {
  parse(_content: string): ParsedStructure[] {
    // Line-based fallback parsing
    throw new Error('Not implemented');
  }
}
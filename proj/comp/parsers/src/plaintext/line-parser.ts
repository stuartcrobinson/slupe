import type { Parser, ParsedStructure } from '../types.js';

export class LineParser implements Parser {
  parse(content: string): ParsedStructure[] {
    // Line-based fallback parsing
    throw new Error('Not implemented');
  }
}
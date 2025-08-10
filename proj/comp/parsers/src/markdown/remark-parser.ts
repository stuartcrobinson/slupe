import type { Parser, ParsedStructure } from '../types.js';

export class RemarkParser implements Parser {
  parse(_content: string): ParsedStructure[] {
    // Remark markdown parsing
    throw new Error('Not implemented');
  }
}
import type { ParsedStructure } from '../types.js';

export class CodeParser {
  constructor(private readonly _treeParser: any) {}
  
  extractStructures(_ast: any): ParsedStructure[] {
    // Common AST to ParsedStructure conversion
    throw new Error('Not implemented');
  }
}
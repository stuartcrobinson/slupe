import type { ParsedStructure } from '../types.js';

export class CodeParser {
  constructor(private treeParser: any) {}
  
  extractStructures(ast: any): ParsedStructure[] {
    // Common AST to ParsedStructure conversion
    throw new Error('Not implemented');
  }
}
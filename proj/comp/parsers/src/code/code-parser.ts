import type { ParsedStructure } from '../types.js';

export class CodeParser {
  constructor(private readonly treeParser: any) {}
  
  extractStructures(_ast: any): ParsedStructure[] {
    void this.treeParser;
    throw new Error('Not implemented');
  }
}
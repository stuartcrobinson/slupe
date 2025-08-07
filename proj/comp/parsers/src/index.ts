export interface ParsedStructure {
  name: string;
  type: string;
  startLine: number;
  endLine: number;
  text: string;
  children: ParsedStructure[];
}

export interface Parser {
  parse(content: string): ParsedStructure[];
}

export class ParserRegistry {
  private parsers: Map<string, Parser> = new Map();
  
  register(extension: string, parser: Parser): void {
    this.parsers.set(extension, parser);
  }
  
  getParser(filepath: string): Parser | null {
    // Extension mapping logic
    // Implementation pending
    throw new Error('Not implemented');
  }
}
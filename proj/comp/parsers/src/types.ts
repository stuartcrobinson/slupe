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
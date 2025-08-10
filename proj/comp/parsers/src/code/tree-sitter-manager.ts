// Singleton manager for tree-sitter parser instances
// Lazy initialization per language

export class TreeSitterManager {
  private static instance: TreeSitterManager;
  private _parsers: Map<string, any> = new Map();
  
  private constructor() {}
  
  static getInstance(): TreeSitterManager {
    if (!TreeSitterManager.instance) {
      TreeSitterManager.instance = new TreeSitterManager();
    }
    return TreeSitterManager.instance;
  }
  
  getParser(_language: string): any {
    // Lazy init logic
    throw new Error('Not implemented');
  }
}
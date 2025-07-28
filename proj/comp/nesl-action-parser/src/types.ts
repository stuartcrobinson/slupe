export interface ParseResult {
  actions: SlupeAction[];
  errors: ParseError[];
  summary: {
    totalBlocks: number;
    successCount: number;
    errorCount: number;
  };
  debug?: {
    rawInput?: any;
    rawParseResult?: any;
  };
}

export interface SlupeAction {
  action: string;
  parameters: Record<string, any>;
  metadata: {
    blockId: string;
    startLine: number;
    endLine: number;
  };
}

export interface ParseError {
  blockId: string;
  action?: string;
  errorType: 'syntax' | 'validation' | 'type';
  message: string;
  blockStartLine?: number;
  neslContent?: string;
}

export interface ValidationResult {
  valid: boolean;
  actionType?: string;
  errors?: string[];
}

export class TransformError extends Error {
  constructor(
    message: string,
    public parameterName: string,
    public expectedType: string,
    public actualValue: string
  ) {
    super(message);
    this.name = 'TransformError';
  }
}

export interface ActionDefinition {
  type: 'read' | 'write' | 'meta' | 'git' | 'dynamic';
  description: string;
  parameters: Record<string, ParameterDef>;
  returns?: Record<string, any>;
}

export interface ParameterDef {
  type: string;
  required: boolean;
  format?: string;
  values?: string[];
  default?: any;
}
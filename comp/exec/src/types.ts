export interface ExecResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  exit_code?: number;
  error?: string;
}

export class ExecError extends Error {
  code: string;
  details?: any;
  
  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'ExecError';
    this.code = code;
    this.details = details;
  }
}
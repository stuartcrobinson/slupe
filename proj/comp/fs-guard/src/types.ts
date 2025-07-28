export interface GuardCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface PathPermission {
  type: 'read' | 'write';
  path: string;
  paramName: string;
}
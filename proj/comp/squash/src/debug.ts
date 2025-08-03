const DEBUG = process.env.DEBUG_SQUASH === 'true';

export function debug(label: string, data?: any): void {
  if (DEBUG) {
    console.log(`[SQUASH:${label}]`, data ? JSON.stringify(data, null, 2) : '');
  }
}
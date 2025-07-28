export class ListenerError extends Error {
  constructor(
    public code: 'FILE_NOT_FOUND' | 'ACCESS_DENIED' | 'ALREADY_WATCHING',
    public path: string,
    message?: string
  ) {
    super(message || `listener: ${code} '${path}'`);
    this.name = 'ListenerError';
  }
}
import { readFile, writeFile, stat, mkdir } from 'fs/promises';
import { dirname } from 'path';
import type { FsGuard } from '../../fs-guard/src/index.js';

export interface FsIoConfig {
  maxFileSize?: number;
  encoding?: BufferEncoding;
  createParentDirs?: boolean;
}

export interface FsFsIoResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ReadResult {
  content: string;
  size: number;
}

export interface WriteResult {
  bytesWritten: number;
}

export class FsIo {
  private config: Required<FsIoConfig>;
  
  constructor(private guard: FsGuard, config: FsIoConfig = {}) {
    this.config = {
      maxFileSize: config.maxFileSize ?? 10 * 1024 * 1024,
      encoding: config.encoding ?? 'utf8',
      createParentDirs: config.createParentDirs ?? true
    };
  }
  
  async read(path: string): Promise<FsIoResult<ReadResult>> {
    const guardCheck = await this.guard.checkPath(path, 'read');
    
    if (!guardCheck.allowed) {
      return {
        success: false,
        error: guardCheck.reason || 'Read access denied'
      };
    }
    
    try {
      const stats = await stat(path);
      
      if (stats.size > this.config.maxFileSize) {
        return {
          success: false,
          error: `File too large: ${stats.size} bytes (max: ${this.config.maxFileSize})`
        };
      }
      
      const content = await readFile(path, this.config.encoding);
      
      return {
        success: true,
        data: {
          content,
          size: stats.size
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: formatFsError(error, path, 'read')
      };
    }
  }
  
  async write(path: string, content: string): Promise<FsIoResult<WriteResult>> {
    const guardCheck = await this.guard.checkPath(path, 'write');
    
    if (!guardCheck.allowed) {
      return {
        success: false,
        error: guardCheck.reason || 'Write access denied'
      };
    }
    
    const contentSize = Buffer.byteLength(content, this.config.encoding);
    
    if (contentSize > this.config.maxFileSize) {
      return {
        success: false,
        error: `Content too large: ${contentSize} bytes (max: ${this.config.maxFileSize})`
      };
    }
    
    try {
      if (this.config.createParentDirs) {
        const dir = dirname(path);
        await mkdir(dir, { recursive: true });
      }
      
      await writeFile(path, content, this.config.encoding);
      
      return {
        success: true,
        data: {
          bytesWritten: contentSize
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: formatFsError(error, path, 'write')
      };
    }
  }
  
  async exists(path: string): Promise<boolean> {
    try {
      await stat(path);
      return true;
    } catch {
      return false;
    }
  }
  
  async append(path: string, content: string): Promise<FsIoResult<WriteResult>> {
    const guardCheck = await this.guard.checkPath(path, 'write');
    
    if (!guardCheck.allowed) {
      return {
        success: false,
        error: guardCheck.reason || 'Write access denied'
      };
    }
    
    const contentSize = Buffer.byteLength(content, this.config.encoding);
    
    if (contentSize > this.config.maxFileSize) {
      return {
        success: false,
        error: `Content too large: ${contentSize} bytes (max: ${this.config.maxFileSize})`
      };
    }
    
    try {
      if (this.config.createParentDirs) {
        const dir = dirname(path);
        await mkdir(dir, { recursive: true });
      }
      
      await writeFile(path, content, { 
        encoding: this.config.encoding,
        flag: 'a'
      });
      
      return {
        success: true,
        data: {
          bytesWritten: contentSize
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: formatFsError(error, path, 'append')
      };
    }
  }
  
  async delete(path: string): Promise<FsIoResult<void>> {
    const guardCheck = await this.guard.checkPath(path, 'write');
    
    if (!guardCheck.allowed) {
      return {
        success: false,
        error: guardCheck.reason || 'Write access denied'
      };
    }
    
    try {
      const { unlink } = await import('fs/promises');
      await unlink(path);
      
      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: formatFsError(error, path, 'delete')
      };
    }
  }
}

export { FsIo, type FsIoConfig, type FsIoResult, type ReadResult, type WriteResult };

function formatFsError(error: any, path: string, operation: string): string {
  const code = error.code || 'UNKNOWN';
  
  switch (code) {
    case 'ENOENT':
      return `File not found: ${path}`;
    case 'EACCES':
      return `Permission denied: ${path}`;
    case 'EISDIR':
      return `Path is a directory: ${path}`;
    case 'ENOTDIR':
      return `Parent is not a directory: ${path}`;
    case 'EEXIST':
      return `File already exists: ${path}`;
    case 'EMFILE':
      return 'Too many open files';
    case 'ENOSPC':
      return 'No space left on device';
    default:
      return `${operation} failed: ${error.message || code}`;
  }
}
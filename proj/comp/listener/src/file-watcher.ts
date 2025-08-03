import { watch, FSWatcher } from 'fs';
import { access, constants } from 'fs/promises';
import { ListenerError } from './errors.js';

export interface WatchHandle {
  stop: () => void;
}

export class FileWatcher {
  private activeWatches = new Map<string, { handle: WatchHandle; watcher: FSWatcher }>();

  async watch(
    filePath: string,
    onChange: () => void,
    debounceMs: number = 200
  ): Promise<WatchHandle> {
    if (this.activeWatches.has(filePath)) {
      throw new ListenerError('ALREADY_WATCHING', filePath);
    }

    try {
      await access(filePath, constants.F_OK);
    } catch (error) {
      throw new ListenerError('FILE_NOT_FOUND', filePath);
    }

    const debouncedOnChange = this.debounce(onChange, debounceMs);

    const watcher = watch(filePath, (eventType, _filename) => {
      if (eventType === 'change') {
        debouncedOnChange();
      }
    });

    const handle: WatchHandle = {
      stop: () => {
        watcher.close();
        debouncedOnChange.cancel();
        this.activeWatches.delete(filePath);
      }
    };

    this.activeWatches.set(filePath, { handle, watcher });
    return handle;
  }

  stopAll(): void {
    for (const [_, { handle }] of this.activeWatches) {
      handle.stop();
    }
    this.activeWatches.clear();
  }

  private debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): T & { cancel: () => void } {
    let timeout: NodeJS.Timeout | null = null;

    const debounced = (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        func(...args);
      }, wait);
    };

    debounced.cancel = () => {
      if (timeout) clearTimeout(timeout);
    };

    return debounced as T & { cancel: () => void };
  }
}
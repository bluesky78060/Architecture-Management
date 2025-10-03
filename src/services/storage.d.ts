export interface StorageService {
  getItem<T>(key: string, defaultValue: T): T;
  setItem<T>(key: string, data: T): void;
  chooseBrowserDirectory(): Promise<boolean>;
  getBrowserDirectoryInfo(): Promise<{ name: string } | null>;
}

export const storage: StorageService;


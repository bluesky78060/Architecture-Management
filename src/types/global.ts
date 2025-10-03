// Global interface declarations for Electron and Browser APIs

// File System Access API types
declare global {
  interface Window {
    cms?: {
      storageGetSync: (key: string) => unknown;
      storageSet: (key: string, data: unknown) => void;
      writeXlsx?: (data: Uint8Array, filename: string) => Promise<void>;
      // Electron helpers (optional)
      getBaseDir?: () => Promise<string>;
      chooseBaseDir?: () => Promise<string>;
    };
    showDirectoryPicker?: (options?: { id?: string }) => Promise<FileSystemDirectoryHandle>;
    XlsxPopulate?: unknown;
  }

  interface FileSystemDirectoryHandle {
    name: string;
    getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
    queryPermission(options?: { mode?: string }): Promise<PermissionState>;
    requestPermission(options?: { mode?: string }): Promise<PermissionState>;
  }

  interface FileSystemFileHandle {
    getFile(): Promise<File>;
    createWritable(): Promise<FileSystemWritableFileStream>;
  }

  interface FileSystemWritableFileStream {
    write(data: Blob | string): Promise<void>;
    close(): Promise<void>;
  }
}

export {};

// TypeScript declarations for AppContext module
import type { AppContextValue } from './AppContext.impl';

export declare const AppProvider: React.FC<{ children: React.ReactNode }>;
export declare const useApp: () => AppContextValue;
export type { AppContextValue } from './AppContext.impl';
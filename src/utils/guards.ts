export const hasValue = <T>(v: T | null | undefined): v is T => v !== null && v !== undefined;

export const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

export const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export const isPositiveNumber = (v: unknown): v is number => isFiniteNumber(v) && v > 0;


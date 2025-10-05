// Simple number format/parse utilities as a React hook
// Provides comma formatting and safe integer parsing used across forms.

export function useNumberFormat() {
  /** Format a number-like value with thousands separators. */
  const format = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '';
    const onlyDigits = String(value).replace(/[^\d-]/g, '');
    if (onlyDigits === '' || onlyDigits === '-') return '';
    const num = Number(onlyDigits);
    if (Number.isNaN(num)) return '';
    return num.toLocaleString();
  };

  /** Parse a user input string into an integer (commas and non-digits ignored). */
  const parse = (input: string): number => {
    const onlyDigits = String(input ?? '').replace(/[^\d-]/g, '');
    if (onlyDigits === '' || onlyDigits === '-') return 0;
    const n = parseInt(onlyDigits, 10);
    return Number.isNaN(n) ? 0 : n;
  };

  return { format, parse };
}

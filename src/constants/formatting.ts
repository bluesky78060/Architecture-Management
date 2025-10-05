/**
 * Formatting constants for phone numbers and business registration
 */
import { MS_IN_SECOND, SECONDS_IN_MINUTE } from './units';

// Phone number formatting constants
export const PHONE_FORMAT = {
  SEOUL_AREA_CODE_LENGTH: 2,
  STANDARD_AREA_CODE_LENGTH: 3,
  MIN_DIGITS_FOR_AREA_CODE: 3,
  MIN_DIGITS_FOR_FIRST_HYPHEN: 7,
  MAX_PHONE_DIGITS: 11,
  SEOUL_DIGITS_THRESHOLD: 9,
  LAST_FOUR_DIGITS: 4,
  SEOUL_MIDDLE_START: 2,
  SEOUL_MIDDLE_END: 6,
  SEOUL_TOTAL_MAX: 10,
  STANDARD_MIDDLE_START: 3,
  STANDARD_MIDDLE_END: 7,
} as const;

// Business registration number formatting constants
export const BUSINESS_NUMBER_FORMAT = {
  MAX_DIGITS: 10,
  FIRST_PART_LENGTH: 3,
  SECOND_PART_LENGTH: 5,
} as const;

// File size constants
export const FILE_SIZE = {
  MAX_SIZE_MB: 2,
  BYTES_PER_MB: 1024,
  BYTES_PER_KB: 1024,
} as const;

// Pagination constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  DEFAULT_PAGE: 0,
  ITEMS_PER_PAGE: 5,
  RECENT_ITEMS_LIMIT: 6,
} as const;

// Timeout constants (in milliseconds)
export const TIMEOUT = {
  // eslint-disable-next-line no-magic-numbers
  AUTO_SAVE_DELAY: 3 * MS_IN_SECOND,
  // eslint-disable-next-line no-magic-numbers
  SESSION_TIMEOUT: 60 * SECONDS_IN_MINUTE * MS_IN_SECOND, // 1 hour
} as const;

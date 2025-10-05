# ESLint TypeScript Error Fixes Summary

## Overview
This document summarizes the ESLint errors found in the TypeScript files and the systematic approach to fix them.

## Completed Fixes

### 1. src/services/database.ts ✅
- Fixed all strict-boolean-expressions errors by adding explicit comparisons
- Changed `if (search)` → `if (search !== undefined && search !== '')`
- Changed `if (clientId)` → `if (clientId !== undefined && clientId !== null)`
- Changed `if (dateFrom || dateTo)` → `if (dateFrom !== undefined || dateTo !== undefined)`
- All query/filter conditions now have explicit null/undefined/empty checks

### 2. src/contexts/UserContext.tsx ✅
- Fixed all strict-boolean-expressions errors
- Changed `if (users)` → `if (users === null || users === undefined)`
- Changed `if (savedUser)` → `if (savedUser !== null && savedUser !== '')`
- Changed `if (user)` → `if (user !== undefined)`
- Changed `if (currentUser && ...)` → `if (currentUser !== null && ...)`
- Added magic number constant `TIMEOUT_MS = 60 * 60 * 1000` for session timeout

### 3. src/constants/formatting.ts ✅ (New File)
Created centralized constants file with:
- `PHONE_FORMAT` - Phone number formatting constants
- `BUSINESS_NUMBER_FORMAT` - Business registration number constants
- `FILE_SIZE` - File size validation constants
- `PAGINATION` - Pagination defaults
- `TIMEOUT` - Timeout constants

### 4. src/components/Clients.tsx (Partial) ✅
- Fixed formatPhoneKR function to use constants from formatting.ts
- Added imports for PHONE_FORMAT and BUSINESS_NUMBER_FORMAT
- Remaining errors to fix: ~100+ errors

## Remaining Errors by File

### src/components/Clients.tsx (~100 errors)
**Pattern 1: Strict Boolean Expressions**
```typescript
// WRONG
if (client.phone && ...)
if (workplace.description)
if (newClient.business?.businessName)

// CORRECT
if (client.phone !== undefined && client.phone !== '')
if (workplace.description !== undefined && workplace.description !== '')
if (newClient.business?.businessName !== undefined && newClient.business.businessName !== '')
```

**Pattern 2: Magic Numbers - formatBizNo function**
```typescript
// WRONG
const d = String(val || '').replace(/\D/g, '').slice(0, 10);
if (d.length <= 3) return d;
if (d.length <= 5) return `${d.slice(0,3)}-${d.slice(3)}`;
return `${d.slice(0,3)}-${d.slice(3,5)}-${d.slice(5)}`;

// CORRECT
const d = String(val !== '' ? val : '').replace(/\D/g, '').slice(0, BUSINESS_NUMBER_FORMAT.MAX_DIGITS);
if (d.length <= BUSINESS_NUMBER_FORMAT.FIRST_PART_LENGTH) return d;
if (d.length <= BUSINESS_NUMBER_FORMAT.SECOND_PART_LENGTH) {
  return `${d.slice(0, BUSINESS_NUMBER_FORMAT.FIRST_PART_LENGTH)}-${d.slice(BUSINESS_NUMBER_FORMAT.FIRST_PART_LENGTH)}`;
}
return `${d.slice(0, BUSINESS_NUMBER_FORMAT.FIRST_PART_LENGTH)}-${d.slice(BUSINESS_NUMBER_FORMAT.FIRST_PART_LENGTH, BUSINESS_NUMBER_FORMAT.SECOND_PART_LENGTH)}-${d.slice(BUSINESS_NUMBER_FORMAT.SECOND_PART_LENGTH)}`;
```

**Pattern 3: Array/Object checks**
```typescript
// WRONG
if (clients.workplaces && clients.workplaces.length > 0)
if (selectedClient.projects)
if (invoices || [])

// CORRECT
if (clients.workplaces !== null && clients.workplaces !== undefined && clients.workplaces.length > 0)
if (selectedClient.projects !== null && selectedClient.projects !== undefined)
(invoices ?? [])
```

### src/components/CompanyInfo.tsx (~30 errors)
Similar patterns:
- File existence checks: `if (file)` → `if (file !== null && file !== undefined)`
- String checks: `if (stampUrl)` → `if (stampUrl !== undefined && stampUrl !== '')`
- Magic numbers in file size: Use `FILE_SIZE.MAX_SIZE_MB`, `FILE_SIZE.BYTES_PER_MB`

### src/components/Dashboard.tsx (~20 errors)
- Array filtering with explicit checks
- Magic number `5` → `PAGINATION.ITEMS_PER_PAGE`
- Nullable object checks for clients, workItems, invoices

### src/components/Estimates.tsx (~50 errors)
- Similar patterns to Invoices
- EstimateItem quantity/unitPrice checks
- Magic number `6` → constant for ID generation
- Magic number `3000` → `TIMEOUT.AUTO_SAVE_DELAY`

### src/components/Invoices.tsx (~50 errors)
- InvoiceItem checks
- Status comparisons
- Date filtering

### src/components/WorkItems.tsx (~40 errors)
- WorkItem property checks
- Status filtering
- Client/workplace relationships

### src/App.tsx (~5 errors)
- Route configuration checks
- Context provider checks

## Systematic Fix Approach

### Step 1: Update All Components to Use Constants
Add to each component that needs it:
```typescript
import { PHONE_FORMAT, BUSINESS_NUMBER_FORMAT, FILE_SIZE, PAGINATION, TIMEOUT } from '../constants/formatting';
```

### Step 2: Fix All Strict Boolean Expression Errors

**For strings:**
```typescript
// Check for empty string
value !== ''
value !== undefined && value !== ''
```

**For numbers (nullable):**
```typescript
// Check for null/undefined/zero
value !== null && value !== undefined && value !== 0
```

**For objects/arrays:**
```typescript
// Check for null/undefined
obj !== null && obj !== undefined
arr !== null && arr !== undefined && arr.length > 0
```

**For optional chaining results:**
```typescript
// Use nullish coalescing
obj?.property ?? defaultValue
arr?.length ?? 0
```

### Step 3: Replace All Magic Numbers

**Common replacements:**
- `2`, `3`, `5`, `6`, `7`, `9`, `10`, `11` in phone formatting → `PHONE_FORMAT.*`
- `10` in business number → `BUSINESS_NUMBER_FORMAT.MAX_DIGITS`
- `2` for file size → `FILE_SIZE.MAX_SIZE_MB`
- `1024` → `FILE_SIZE.BYTES_PER_MB` or `FILE_SIZE.BYTES_PER_KB`
- `20` for pagination → `PAGINATION.DEFAULT_PAGE_SIZE`
- `5` for items per page → `PAGINATION.ITEMS_PER_PAGE`
- `6` for recent items → `PAGINATION.RECENT_ITEMS_LIMIT`
- `3000` for timeouts → `TIMEOUT.AUTO_SAVE_DELAY`

### Step 4: Test Changes
After fixing each file:
```bash
npx eslint "src/**/*.{ts,tsx}" --max-warnings=0
```

## Quick Reference: Common Patterns

### Pattern: Conditional String Check
```typescript
// BEFORE
if (str) { ... }
if (!str) { ... }

// AFTER
if (str !== '') { ... }
if (str === '') { ... }
```

### Pattern: Conditional Nullable Object Check
```typescript
// BEFORE
if (obj) { ... }
if (!obj) { ... }

// AFTER
if (obj !== null && obj !== undefined) { ... }
if (obj === null || obj === undefined) { ... }
```

### Pattern: Conditional Number Check
```typescript
// BEFORE
if (num) { ... }

// AFTER
if (num !== 0) { ... }          // If 0 should be falsy
if (num !== null && num !== undefined) { ... }  // If 0 should be truthy
```

### Pattern: Array Length Check
```typescript
// BEFORE
if (arr && arr.length > 0) { ... }

// AFTER
if (arr !== null && arr !== undefined && arr.length > 0) { ... }
// OR using optional chaining:
if ((arr?.length ?? 0) > 0) { ... }
```

### Pattern: Nullish Coalescing
```typescript
// BEFORE
const value = obj || defaultValue;
const items = arr || [];

// AFTER
const value = obj ?? defaultValue;
const items = arr ?? [];
```

## Total Errors by Category

1. **strict-boolean-expressions**: ~250 errors
   - String checks: ~80 errors
   - Nullable object checks: ~100 errors
   - Number checks: ~40 errors
   - Array checks: ~30 errors

2. **no-magic-numbers**: ~80 errors
   - Phone formatting: ~25 errors
   - Business number formatting: ~6 errors
   - File size checks: ~5 errors
   - Pagination: ~10 errors
   - Array indices/timeouts: ~34 errors

## Status Summary

✅ **Completed Files (2)**:
- src/services/database.ts
- src/contexts/UserContext.tsx

📝 **In Progress (1)**:
- src/components/Clients.tsx

⏳ **Pending (7)**:
- src/components/CompanyInfo.tsx
- src/components/Dashboard.tsx
- src/components/Estimates.tsx
- src/components/Invoices.tsx
- src/components/WorkItems.tsx
- src/App.tsx
- Other utility files

## Recommendations

1. **Batch Process**: Fix one file completely before moving to the next
2. **Test Incrementally**: Run ESLint after each file to ensure fixes are correct
3. **Use Find/Replace**: Many patterns are repetitive and can be batch-replaced with editor find/replace
4. **Prioritize by Impact**: Focus on critical files first (database, contexts, main components)

## Next Steps

1. Complete Clients.tsx (highest error count)
2. Fix CompanyInfo.tsx (file operations)
3. Fix Dashboard.tsx (statistics)
4. Fix Estimates.tsx and Invoices.tsx (forms)
5. Fix WorkItems.tsx (data grid)
6. Fix App.tsx (routing)
7. Run full ESLint check
8. Test application functionality

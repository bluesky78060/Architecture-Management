# Session Summary: 2025-10-16 Bug Fixes & Schema Alignment

## Critical Issues Resolved

### 1. Invoice Items Schema Misalignment
**Problem**: invoice_items table missing critical columns causing PostgreSQL errors
**Solution**: Added missing fields to save logic
- `labor_persons`, `labor_unit_rate`, `labor_persons_general`, `labor_unit_rate_general`
- `date`, `notes`
- `workplace_id` in invoices table

**Files Modified**:
- `src/components/WorkItems.tsx` - Added all missing fields to invoice_items insert
- `src/contexts/AppContext.impl.tsx` - Added all missing fields to invoice sync
- `src/components/Invoices.tsx` - Added workplace_id to invoice creation
- `src/types/domain.ts` - Added workplaceId to Invoice interface

### 2. Invalid ClientId Prevention
**Problem**: Invoices created without valid clientId causing NOT NULL constraint violations
**Solution**: Pre-validation and auto-cleanup
- Added clientId validation in `handleCreateInvoice` and `handleCreateBulkInvoice`
- Auto-delete invalid invoices with early return pattern
- Clear error messages for missing clientId

**Error Codes Resolved**:
- PostgreSQL 23502: NOT NULL constraint violation (clientId)
- PostgreSQL 23514: CHECK constraint violation (status)
- PostgreSQL 22007: Invalid date syntax (empty string)
- PGRST204: Schema cache column not found

### 3. Status Conversion Missing
**Problem**: Korean status values sent to database expecting English
**Solution**: Added toDbStatus conversion function
- Maps: '발송대기'/'발송됨' → 'pending'
- Maps: '미결제' → 'overdue'
- Maps: '결제완료' → 'paid'

### 4. Empty String to NULL Conversion
**Problem**: Empty strings causing PostgreSQL DATE type errors
**Solution**: Explicit null conversion for date and notes fields
- Pattern: `(item.date !== null && item.date !== undefined && item.date !== '') ? item.date : null`

## UI Improvements

### Invoice Detail Display
- Removed "일반:", "숙련:" labels from labor info display
- Adjusted column widths in print view:
  - Date column: w-24 → w-28 (wider)
  - Content column: w-[26rem] → w-[25rem] (narrower)

## Git Commits (Today)
1. `04dcc34` - fix: use explicit null/undefined check in invoice creation
2. `81e2e9f` - fix: validate clientId before saving invoice to Supabase
3. `9f0ab6e` - feat: auto-delete invoices with invalid clientId
4. `4dc85ce` - fix: prevent invalid invoice reprocessing with early return
5. `ce8fbb7` - fix: add clientId validation and missing clientId in bulk invoice creation
6. `3d5648d` - fix: add invoice status conversion in AppContext save logic
7. `6b2a347` - fix: align invoice_items schema with database structure
8. `ddfdaa9` - refactor: remove labor type labels from invoice detail display
9. `05542e3` - fix: restore labor fields in invoice_items save logic
10. `7aff5bb` - refactor: adjust column widths and remove labor type labels in print view
11. `6209042` - fix: add date and notes fields to invoice_items save logic
12. `ff5e79a` - fix: prevent empty string in date field causing PostgreSQL error
13. `197ca38` - fix: add workplace_id field to invoice save and load logic

## Required Supabase Schema Updates
User needs to run these SQL commands:

```sql
-- Add labor columns to invoice_items
ALTER TABLE invoice_items
ADD COLUMN IF NOT EXISTS labor_persons INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS labor_unit_rate INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS labor_persons_general INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS labor_unit_rate_general INTEGER DEFAULT 0;

-- Add date and notes columns
ALTER TABLE invoice_items
ADD COLUMN IF NOT EXISTS date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;
```

## Key Patterns Established

### Data Validation Before Save
```typescript
// Always validate required fields before Supabase insert
if (invoice.clientId === null || invoice.clientId === undefined || invoice.clientId === 0) {
  alert('유효한 건축주 정보가 없습니다.');
  return;
}
```

### Empty String Handling for PostgreSQL
```typescript
// Convert empty strings to null for typed columns
date: (item.date !== null && item.date !== undefined && item.date !== '') ? item.date : null
```

### Status Translation Pattern
```typescript
// Always convert Korean UI values to English DB values
const toDbStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    '발송대기': 'pending',
    '발송됨': 'pending',
    '미결제': 'overdue',
    '결제완료': 'paid',
  };
  return statusMap[status] ?? 'pending';
};
```

## Next Session Priorities
1. Verify labor info displays correctly after Supabase schema update
2. Test invoice creation from work items with complete data flow
3. Validate workplace data persistence in invoice management

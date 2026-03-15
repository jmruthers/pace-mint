# M07 – Actuals Import & Source Management

## Overview

- **Purpose and scope:** Import financial transaction data from CSV (or other sources). Record import source; validate rows; flag invalid rows; store valid rows as transactions. User selects currency for the import file from the event's defined currencies; **default is AUD**.
- **Requires:** M01, M02.
- **Standards:** 04 API & Tech Stack, 08 Testing & Documentation.

**pace-core / standards:** Use pace-core components (Standard 05). Styling per Standard 07.

**Aligns with:** ARC § 5 Actuals ingestion, allocation & reconciliation.

**Validation rules (invalid row):** A row is **invalid** if any of the following fail: required columns present (as defined for the import schema), amount is numeric, date format valid, currency code in event's defined currencies. List these in UI and in validation result so users see why a row was flagged.

## Acceptance criteria

- [ ] CSV file upload supported.
- [ ] **User can set the currency for the import file** from the event's defined currencies; **default AUD**.
- [ ] Import source recorded (file name, timestamp, user, currency chosen).
- [ ] **Invalid rows flagged** with reason (missing required column, non-numeric amount, invalid date format, currency not in event list).
- [ ] Valid rows stored as transactions.

## API / Contract

**Types:** (in `src/types/mint.ts`)

- `MintTransaction`, `ImportSource`, `ImportValidationResult`, `ValidationRule` (e.g. requiredColumns, amountNumeric, dateFormat, currencyInEventList)

**Hooks:**

- `src/hooks/useTransactionImport.ts` — `useTransactionImport(eventId: string): { upload, validate, result: { validRows, invalidRows, errors } }`

**Components:**

- `src/components/mint/CsvImportUploader.tsx` — File upload; currency selector (event currencies, default AUD); trigger validation.
- `src/components/mint/ImportValidationTable.tsx` — Show valid/invalid rows; invalid rows show reason (validation rule that failed).

No implementation detail; only contract.

## Verification

- **Route:** `/transaction-import` (or event-scoped).
- User should:
  1. Select currency for import (default AUD).
  2. Upload CSV.
  3. See validation results (valid rows vs invalid with reason).
  4. Complete import for valid rows.

## Testing requirements

- **Unit:** CSV parsing; validation rules (required columns, numeric amount, date format, currency in event list); error handling.
- **Integration:** End-to-end upload → validate → import; malformed CSV rejected.
- Coverage per Standard 08.

## Do not

- Do not copy implementation from the old codebase; implement from this spec.
- Do not add undocumented public props or exports.
- Do not accept malformed CSV.
- Do not allow currency not in event's defined list for the import file.

## References

- CSV RFC 4180. ARC § 5.

---

## Prompt to use with Cursor

Implement the feature described in this document. Follow the standards and guardrails provided. Add or update tests and verification as specified in "Testing requirements" and "Verification". Run validate and fix any issues until it passes.

---

**Checklist before running Cursor:** intro doc + guardrails doc + Cursor rules + ESLint config + this requirements doc.

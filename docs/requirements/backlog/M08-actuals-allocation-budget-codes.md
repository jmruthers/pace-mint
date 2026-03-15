# M08 – Actuals Allocation to Budget Codes

## Overview

- **Purpose and scope:** Allocate imported financial transactions to budget codes (planning lines). Transaction can be allocated to one code or split across multiple codes. **Allocation sums must equal the transaction amount in the transaction's currency.**
- **Requires:** M05, M07.
- **Standards:** 02 Architecture, 08 Testing & Documentation.

**pace-core / standards:** Use pace-core components (Standard 05). Styling per Standard 07.

**Aligns with:** ARC § 5 Actuals ingestion, allocation & reconciliation.

**Currency:** Transaction has a currency (set at import, default AUD). Allocation totals are validated in that currency; sums must equal transaction amount.

## Acceptance criteria

- [ ] Transaction can be allocated to one budget code.
- [ ] Transaction can be split across multiple budget codes.
- [ ] **Allocation sums must equal transaction amount (in the transaction's currency).**
- [ ] Unallocated transactions tracked.

## API / Contract

**Types:** (in `src/types/mint.ts`)

- `TransactionAllocation`, `AllocationSplit`

**Hooks:**

- `src/hooks/useTransactionAllocation.ts` — `useTransactionAllocation(transactionId: string): { data, allocate, split, save }`; validation that split totals equal transaction amount in transaction currency.

**Components:**

- `src/components/mint/TransactionAllocationPanel.tsx` — Allocate single or split to budget codes; show running total vs transaction amount; enforce sum = transaction amount.

No implementation detail; only contract.

## Verification

- **Route:** `/transaction-allocation` (or from transaction list).
- User should:
  1. Allocate a transaction to one code.
  2. Split a transaction across multiple codes and confirm total matches transaction amount.
  3. Save allocation.

## Testing requirements

- **Unit:** Split validation (sum = transaction amount in transaction currency); allocation persistence.
- **Integration:** Mismatched totals rejected; unallocated list updated after allocation.
- Coverage per Standard 08.

## Do not

- Do not copy implementation from the old codebase; implement from this spec.
- Do not add undocumented public props or exports.
- Do not allow allocation totals that differ from the transaction amount (in transaction currency).

## References

- ARC § 5. Accounting allocation practices.

---

## Prompt to use with Cursor

Implement the feature described in this document. Follow the standards and guardrails provided. Add or update tests and verification as specified in "Testing requirements" and "Verification". Run validate and fix any issues until it passes.

---

**Checklist before running Cursor:** intro doc + guardrails doc + Cursor rules + ESLint config + this requirements doc.

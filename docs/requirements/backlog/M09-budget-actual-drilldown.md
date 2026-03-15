# M09 – Budget vs Actual Drilldown

## Overview

- **Purpose and scope:** Provide drilldown from budget lines to actual transactions: clicking actual value opens transaction list; show date, source, description, amount; filter by date and source. Read-only; no editing in drilldown.
- **Requires:** M08.
- **Standards:** 02 Architecture, 07 Styling, 08 Testing & Documentation.

**pace-core / standards:** Use pace-core components (Standard 05): DataTable for transaction list, Card/Modal for drilldown. Styling per Standard 07.

**Aligns with:** ARC § 5, § 7 Reporting.

## Acceptance criteria

- [ ] Clicking actual value opens transaction list.
- [ ] Transactions show date, source, description, amount.
- [ ] Filtering available by date and source.
- [ ] Drilldown is read-only (no editing transactions from this view).

## API / Contract

**Types:** (in `src/types/mint.ts`)

- `BudgetActualTransaction`

**Hooks:**

- `src/hooks/useBudgetActualDrilldown.ts` — `useBudgetActualDrilldown(planLineId: string, filters?: { dateFrom?, dateTo?, source? }): { data, isLoading, error }`

**Components:**

- `src/components/mint/ActualTransactionsModal.tsx` — Modal or panel listing transactions for a budget line; filters; DataTable from pace-core.

No implementation detail; only contract.

## Verification

- **Route:** From budget view (e.g. click actual on a line).
- User should:
  1. Click actual value on a budget line.
  2. View transaction list (date, source, description, amount).
  3. Apply filters (date, source).

## Testing requirements

- **Unit:** Drilldown data shape; filter application.
- **Integration:** Drilldown opens with correct line; filter correctness; no edit actions in drilldown.
- Coverage per Standard 08.

## Do not

- Do not copy implementation from the old codebase; implement from this spec.
- Do not add undocumented public props or exports.
- Do not allow editing transactions in drilldown view.

## References

- ARC § 5, § 7. Financial reconciliation workflows.

---

## Prompt to use with Cursor

Implement the feature described in this document. Follow the standards and guardrails provided. Add or update tests and verification as specified in "Testing requirements" and "Verification". Run validate and fix any issues until it passes.

---

**Checklist before running Cursor:** intro doc + guardrails doc + Cursor rules + ESLint config + this requirements doc.

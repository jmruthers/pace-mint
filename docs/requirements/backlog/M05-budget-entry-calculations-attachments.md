# M05 – Budget Entry, Calculations & Attachments

## Overview

- **Purpose and scope:** Allow planners to enter detailed budget line data on leaf nodes: amount, variable, currency, timing, description, attachments. Parent nodes read-only. Calculation: amount × variable × exchange rate.
- **Requires:** M03, M04.
- **Standards:** 02 Architecture, 04 API & Tech Stack, 08 Testing & Documentation.

**pace-core / standards:** Use pace-core components (Standard 05). Styling per Standard 07.

**Aligns with:** ARC § 4 Planning engine.

**Resolved rules:**

- For lines marked as **variable-driven**, the user **must** select a variable from the variable dropdown (variable cannot be absent).
- Event has **default exchange rate AUD = 1** (from M03).
- **Confidence levels** for a budget line are: **guesstimate**, **estimate**, **quote** (define in types and UI).

## Acceptance criteria

- [ ] Leaf nodes allow editing; parent nodes read-only.
- [ ] Budget calculation uses amount × variable × exchange rate; variable-driven lines require a selected variable.
- [ ] Description limited to 100 characters.
- [ ] Timing supports exact date or month/year.
- [ ] **Confidence level** per line: guesstimate, estimate, quote.
- [ ] Attachments supported for budget lines.

## API / Contract

**Types:** (in `src/types/mint.ts`)

- `BudgetLine`, `BudgetAttachment`, `BudgetConfidence` (or enum: 'guesstimate' | 'estimate' | 'quote')

**Hooks:**

- `src/hooks/useBudgetEntry.ts` — `useBudgetEntry(lineId: string): { data, isLoading, error, updateLine, addAttachment }`

**Components:**

- `src/components/mint/BudgetLineEditor.tsx` — Edit amount, variable, currency, timing, description, confidence; validation for variable when line is variable-driven.
- `src/components/mint/AttachmentUploader.tsx` — Attach documents to budget lines (pace-core or app-specific file upload).

No implementation detail; only contract.

## Verification

- **Route:** `/budget-entry` (or per-line edit in tree).
- User should:
  1. Add budget amount; choose variable (required when variable-driven); choose currency.
  2. Set confidence (guesstimate / estimate / quote).
  3. Attach a document to a budget line.

## Testing requirements

- **Unit:** Calculation validation (amount × variable × exchange rate); variable required when variable-driven; description length; confidence values.
- **Integration:** Attachment upload; parent rows not editable.
- Coverage per Standard 08.

## Do not

- Do not copy implementation from the old codebase; implement from this spec.
- Do not add undocumented public props or exports.
- Do not allow editing parent rows for amount/variable/currency.
- Do not exceed 100 characters for description.
- Do not allow variable-driven line without a selected variable.

## References

- ARC § 4. Financial modelling practices.

---

## Prompt to use with Cursor

Implement the feature described in this document. Follow the standards and guardrails provided. Add or update tests and verification as specified in "Testing requirements" and "Verification". Run validate and fix any issues until it passes.

---

**Checklist before running Cursor:** intro doc + guardrails doc + Cursor rules + ESLint config + this requirements doc.

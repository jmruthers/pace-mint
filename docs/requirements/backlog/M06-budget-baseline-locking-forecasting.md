# M06 – Budget Baseline Locking & Forecasting

## Overview

- **Purpose and scope:** Lock approved budget (amount and variable immutable after lock); allow forecast updates; record forecast changes in audit log. Child nodes can be created but must sum to parent.
- **Requires:** M05.
- **Standards:** 02 Architecture, 03 Security & RBAC, 08 Testing & Documentation.

**pace-core / standards:** Use pace-core components (Standard 05). RBAC via pace-core (Standard 03). Styling per Standard 07.

**Aligns with:** ARC § 4 Planning engine.

## Acceptance criteria

- [ ] Event admin can lock budget.
- [ ] Amount and variable cannot change after lock.
- [ ] Forecast field remains editable after lock.
- [ ] Forecast changes recorded in audit log.
- [ ] Child nodes can be created after lock but must sum to parent.

## API / Contract

**Types:** (in `src/types/mint.ts`)

- `BudgetForecast`, `BudgetLockStatus`

**Hooks:**

- `src/hooks/useBudgetLock.ts` — `useBudgetLock(eventIdOrVersionId: string): { isLocked, lock, unlock (if allowed) }`
- `src/hooks/useForecastUpdates.ts` — `useForecastUpdates(lineId: string): { forecast, updateForecast, history }`

**Components:**

- `src/components/mint/BudgetLockControl.tsx` — Lock/unlock budget; show lock status.
- `src/components/mint/ForecastEditor.tsx` — Edit forecast value; view forecast history.

No implementation detail; only contract.

## Verification

- **Route:** `/budget-lock` or within budget flow.
- User should:
  1. Lock budget.
  2. Edit forecast (forecast field only).
  3. View forecast history.

## Testing requirements

- **Unit:** Lock enforcement (amount/variable immutable when locked); forecast editing; audit log entry for forecast changes.
- **Integration:** Unauthorized unlock blocked; child sum validation when adding after lock.
- Coverage per Standard 08.

## Do not

- Do not copy implementation from the old codebase; implement from this spec.
- Do not add undocumented public props or exports.
- Do not allow editing locked budget amounts or variable.

## References

- ARC § 4. Budget control frameworks.

---

## Prompt to use with Cursor

Implement the feature described in this document. Follow the standards and guardrails provided. Add or update tests and verification as specified in "Testing requirements" and "Verification". Run validate and fix any issues until it passes.

---

**Checklist before running Cursor:** intro doc + guardrails doc + Cursor rules + ESLint config + this requirements doc.

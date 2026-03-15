# M10 – Financial Dashboard

## Overview

- **Purpose and scope:** High-level financial overview: top-level budget summary, chart by confidence level (guesstimate, estimate, quote — from M05), unallocated actuals widget. Charts interactive. **Unallocated actuals widget:** read-only; **redirects user to the one central allocation page** (no inline allocate on dashboard).
- **Requires:** M06, M08.
- **Standards:** 07 Styling, 08 Testing & Documentation.

**pace-core / standards:** Use pace-core components (Standard 05): Card for widgets, DataTable if needed. Styling per Standard 07. Confidence levels from M05 (guesstimate, estimate, quote).

**Aligns with:** ARC § 7 Reporting, audit & controls.

## Acceptance criteria

- [ ] Dashboard displays top-level budget summary.
- [ ] Chart displays budget by **confidence level** (guesstimate, estimate, quote — per M05).
- [ ] Widget displays unallocated actuals; **click/action redirects to the central allocation page** (e.g. `/transaction-allocation` or equivalent).
- [ ] Charts interactive (e.g. hover for details; navigate to drilldowns).

## API / Contract

**Types:** (in `src/types/mint.ts`)

- `DashboardMetrics`, `ConfidenceBreakdown`

**Hooks:**

- `src/hooks/useFinanceDashboard.ts` — `useFinanceDashboard(eventId: string): { summary, byConfidence, unallocatedCount, isLoading, error }`

**Components:**

- `src/components/mint/BudgetSummaryChart.tsx` — Top-level budget summary (e.g. bar or card).
- `src/components/mint/ConfidenceBreakdownChart.tsx` — Chart by confidence level (guesstimate, estimate, quote).
- `src/components/mint/UnallocatedActualsWidget.tsx` — Shows unallocated count; link/button **redirects to allocation page** (no inline allocate).

No implementation detail; only contract.

## Verification

- **Route:** `/finance-dashboard` or `/dashboard`.
- User should:
  1. View charts (budget summary, confidence breakdown).
  2. Hover for details where supported.
  3. Use unallocated widget to navigate to the central allocation page.
  4. Navigate to drilldowns (e.g. budget vs actual) from dashboard.

## Testing requirements

- **Unit:** Chart rendering; metric accuracy (summary, confidence breakdown, unallocated count).
- **Integration:** Unallocated widget redirects to allocation route; no edit on dashboard.
- Coverage per Standard 08.

## Do not

- Do not copy implementation from the old codebase; implement from this spec.
- Do not add undocumented public props or exports.
- Do not include editing capabilities on dashboard.
- Do not provide inline "allocate" on the unallocated widget; redirect only.

## References

- ARC § 7. M05 for confidence levels. Financial analytics dashboards.

---

## Prompt to use with Cursor

Implement the feature described in this document. Follow the standards and guardrails provided. Add or update tests and verification as specified in "Testing requirements" and "Verification". Run validate and fix any issues until it passes.

---

**Checklist before running Cursor:** intro doc + guardrails doc + Cursor rules + ESLint config + this requirements doc.

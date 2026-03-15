**Implemented:** 2026-03-15. Types: `src/types/api.ts`, `src/types/finance.ts`. Services: `src/services/mint/contexts.ts` (in-memory); when Supabase is configured, create/list/get financial context and context currencies persist to **mint_financial_context** and **mint_context_currency** via `src/services/mint/context-supabase.ts` and `src/services/mint/currencies-supabase.ts`. Hooks: `src/hooks/useFinancialContext.ts`, `src/hooks/useDimensions.ts`, `src/hooks/useFinancialContextsList.ts`, `src/hooks/useDefineDimension.ts`, `src/hooks/usePersistFinancialContext.ts`. Components: `src/components/mint/FinancialContextForm.tsx`, `src/components/mint/DimensionConfigPanel.tsx`. Page: `src/pages/FinancialContextPage.tsx`. Route: `/financial-context`. `npm run validate` passes.

---

# M02 – Financial Context & Dimensions

## Overview

- **Purpose and scope:** Implement the generic ownership and slicing model for all finance in MINT: financial context (event, org program, membership, etc.), context types, and dimensions attachable to planning, transactions, and ledger records.
- **Requires:** M01.
- **Standards:** 01 Project Structure, 02 Architecture, 03 Security & RBAC, 04 API & Tech Stack, 05 pace-core Compliance, 08 Testing & Documentation.

**pace-core / standards:** Use pace-core components (Standard 05). RBAC via pace-core (Standard 03); permissions from pace-admin (DB). Styling per Standard 07. No inline styles.

**Aligns with:** [ARC-MINT-architecture.md](../ARC-MINT-architecture.md) § 2 Financial context & dimensions.

## Acceptance criteria

- [x] MINT supports a generic `financial_context` concept (context_type, context_id, organisation ownership, optional parent, lifecycle status, base currency).
- [x] Reusable **dimensions** can be attached to planning, transactions, and ledger records (e.g. event, program, unit, member, fund, project, source app).
- [x] Same transaction can carry multiple dimensions.
- [x] Multi-currency rules at context level; one functional currency per context.
- [x] RBAC evaluable at context level via pace-core permissions.

## API / Contract

**Types:** (in `src/types/mint.ts` or `src/types/finance.ts`)

- `FinancialContext`, `FinancialContextType`, `FinancialDimensionDefinition`, `FinancialDimensionValue`, `ContextCurrencySetting`, `ContextVariableDefinition`

**Hooks:**

- `src/hooks/useFinancialContext.ts` — `useFinancialContext(contextId: string): { data, isLoading, error, refetch }`
- `src/hooks/useDimensions.ts` — `useDimensions(contextId?: string): { data, isLoading, error, refetch }`

**Components:**

- `src/components/mint/FinancialContextForm.tsx` — Create/edit financial context (type, org, currency, etc.).
- `src/components/mint/DimensionConfigPanel.tsx` — Define and assign dimensions to a context.

**Services:** (optional; if not inline in hooks)

- `src/services/mint/contexts.ts` — `createFinancialContext(input)`, `updateFinancialContext(input)`, `setContextCurrencies(input)`, `setContextVariables(input)`, `defineDimension(input)` returning ApiResult types.

No implementation detail; only contract.

## UI / Page behaviour

There is a **single page** for financial context and dimensions. Rebuilding must produce this behaviour.

- **Route:** `/financial-context` only. One nav entry (e.g. "Financial context"); no separate route for event finance (see M03).
- **Page content (order):**
  1. **Intro** — Short explanation of what a financial context is and a "How to create a financial context" step list (create → choose type and IDs → set lifecycle → create; then select context to add currencies, variables, dimensions). If an event is selected in the header, the steps mention that organisation and context ID can be pre-filled.
  2. **Create or edit** — When "Create financial context" is clicked, show a form (FinancialContextForm): context type, context ID, organisation ID (required; when event is selected in header, pre-fill from event and show as read-only), parent context ID (optional), lifecycle status, base currency. Buttons: Create (or Update when editing), Cancel. When editing an existing context, the same form with values filled.
  3. **Contexts list** — List all financial contexts. Each row: context type, context_id, base currency; actions: Select, Edit. When no contexts exist, show copy that tells the user to create one above.
  4. **When a context is selected** — Show two sections:
     - **Currencies and variables** — Behaviour depends on selected context type (see M03 for event-type). For **event** contexts: show VariableConfigPanel and CurrencyConfigPanel (event-scoped; full CRUD, set default currency, exchange rates). For **non-event** contexts: show inline UI to add one functional currency and add variables (key, label) by context id. In both cases, show which context is selected (type and context_id). Optionally when the selection is driven by the header event, show "Configuring financial context for selected event."
     - **Dimensions** — DimensionConfigPanel for the selected context (define and assign dimensions).
- **Event-aware selection:** When the user has an event selected in the header (pace-core event selector) and that event has a financial context, the page must auto-select that context so the user sees its currencies, variables, and dimensions without clicking Select. When the event has no context yet, show a clear message (e.g. "No financial context for this event yet. Create one below") and the create button; after create, auto-select the new context. Event→context resolution: resolve event id to financial context id where context_type = 'event' and context_id = event id (in-memory or Supabase mint_financial_context).
- **Permissions:** Page guarded by PagePermissionGuard (resource e.g. `financial-context`). No separate page or route for "event finance config"; any legacy URL for it must redirect to `/financial-context`.

### Layout (expected structure)

Layout must align with Standard 07 (styling) and Standard 03 (RBAC). Rebuilding must preserve these basics.

- **Contexts list**
  - One **card per context**. Use a grid (e.g. one column on small screens, two on larger) with consistent gap between cards.
  - Each card shows context type, context_id, and base currency; actions (Select, Edit) grouped clearly. Selected context is visually distinct (e.g. ring/border and primary Select button).
  - No typography spacing classes on the list container (e.g. avoid `p-0` / `m-0` unless justified for layout structure per Standard 07).

- **Configure section (when a context is selected)**
  - One **card per config area**, each with a clear **heading** (e.g. Variables, Currencies, Dimensions).
  - **Separation between cards** — use consistent vertical spacing (e.g. `gap-6` or equivalent) so the three areas (Variables, Currencies, Dimensions) are clearly distinct.
  - **DataTables:** Variables, Currencies, and Dimensions each use pace-core **DataTable** where applicable (creation, and edit/delete where the API supports it). Dimensions are create-only. Each DataTable lives inside its own card with the heading above it.

- **Create flow**
  - "Create financial context" is a single control (e.g. button in a `<details>` summary); the full form is shown in an expandable section so the default view is list + selected context config, not a long always-visible form.

- **Standards**
  - Page wrapped with **PagePermissionGuard** (Standard 03). Use **RESOURCE_NAMES** for the page resource. No wrapper components around the guard.
  - Use pace-core components (Card, DataTable, Button, etc.); no style overrides on pace-core components unless necessary and documented. Semantic HTML; no inline typography classes per Standard 07.

## Verification

- **Route:** `/financial-context` (single route; see UI / Page behaviour above).
- User should:
  1. Create a financial context of type `event` and one of type `membership_program` (or placeholder types).
  2. Select a context and add currencies and variables (for event type, use the panels; for other types, use the inline add flow).
  3. Define dimensions for the selected context and see them attachable.

## Testing requirements

- **Unit:** Context validation; dimension assignment; type guards for FinancialContext, dimensions.
- **Integration:** Context-scoped RBAC; context nested/linked without circular refs; dimension assignments valid across modules.
- Coverage per Standard 08.

## Do not

- Do not copy implementation from the old codebase; implement from this spec.
- Do not add undocumented public props or exports.
- Do not encode "event" as the only finance owner.
- Do not create separate dimension schemes per submodule.
- Do not duplicate currency and variable logic in multiple places.

## References

- [ARC-MINT-architecture.md](../ARC-MINT-architecture.md) § 2. Existing `mint_budget_variables`, `mint_budgets` to be absorbed into generic context model over time.
- [M03 – Event financial configuration](M03-event-financial-configuration.md) — Event-type contexts use VariableConfigPanel and CurrencyConfigPanel on this same page; M03 defines the event variables/currencies contract and UI behaviour.

---

## Prompt to use with Cursor

Implement the feature described in this document. Follow the standards and guardrails provided. Add or update tests and verification as specified in "Testing requirements" and "Verification". Run validate and fix any issues until it passes.

---

**Checklist before running Cursor:** intro doc + guardrails doc + Cursor rules + ESLint config + this requirements doc.

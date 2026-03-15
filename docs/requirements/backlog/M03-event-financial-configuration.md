# M03 – Event Financial Configuration

## Overview

- **Purpose and scope:** Configure financial parameters for an event: variables and currencies. Variables and currencies are scoped to the event (financial context).
- **Requires:** M01, M02.
- **Standards:** 02 Architecture, 03 Security & RBAC, 04 API & Tech Stack, 08 Testing & Documentation.

**pace-core / standards:** Use pace-core components (Standard 05). RBAC via pace-core (Standard 03). Styling per Standard 07.

**Layout:** Event variables and currencies appear inside the Financial context page layout described in [M02 – Financial context & dimensions](M02-financial-context-and-dimensions.md) (card per config area, DataTables on cards with headings and separation; context list as card per context).

**Aligns with:** ARC § 2 Financial context & dimensions.

## Acceptance criteria

- [ ] Event admin can create variables; unlimited variables supported.
- [ ] Event admin can configure currencies; currency codes follow ISO standard (e.g. ISO 4217).
- [ ] Exactly one currency marked as default per event.
- [ ] Exchange rates defined relative to default currency. **Event must have a default exchange rate of AUD = 1.**
- [ ] Variables and currencies scoped to event (context).

## API / Contract

**Types:** (in `src/types/mint.ts`)

- `MintCurrency`, `MintVariable`

**Hooks:**

- `src/hooks/useEventVariables.ts` — `useEventVariables(eventId: string | null): { data, isLoading, error, refetch, createVariable, updateVariable, deleteVariable }`. Mutations return `Promise<{ ok: boolean; error?: string }>`.
- `src/hooks/useEventCurrencies.ts` — `useEventCurrencies(eventId: string): { data, isLoading, error, refetch, setDefault, setExchangeRate }`

**Components:**

- `src/components/mint/CurrencyConfigPanel.tsx` — Configure currencies for event; set default; set exchange rates.
- `src/components/mint/VariableConfigPanel.tsx` — CRUD for event variables.

No implementation detail; only contract.

## Verification

- **Consuming apps:** Event variables and currencies are configured on the **Financial context page** at `/financial-context` (see [M02 – Financial context & dimensions](M02-financial-context-and-dimensions.md) for full page structure). When the user has **selected a financial context** with **context_type is `event`**, the "Currencies and variables" section renders VariableConfigPanel and CurrencyConfigPanel (event-scoped). When the selected context is **not** event type, the same page shows a simpler inline currencies/variables UI. Event selection in header: when the user has an event selected and that event has a financial context, the page auto-selects it; when the event has no context, show "No financial context for this event yet" and the create flow; after create, auto-select the new context. Legacy URL `/event-finance-config` redirects to `/financial-context`.
- **Concrete steps to verify:** On `/financial-context` with an event-type context selected or auto-selected: (1) Create a variable (VariableConfigPanel). (2) Add a currency (CurrencyConfigPanel). (3) Set default currency. (4) Set exchange rate (AUD = 1 as default).

## Testing requirements

- **Unit:** Variable CRUD; currency CRUD; default currency validation; exchange rate calculations.
- **Integration:** Default currency single-selection; invalid ISO currency codes rejected.
- Coverage per Standard 08.

## Do not

- Do not copy implementation from the old codebase; implement from this spec.
- Do not add undocumented public props or exports.
- Do not allow multiple default currencies per event.
- Do not allow invalid ISO currency codes.

## References

- ISO 4217 currency codes. ARC § 2.
- [pace-core-schema-requirements.md](../pace-core-schema-requirements.md) — existing mint_* schema usage and required additions for pace-core.

---

## Prompt to use with Cursor

Implement the feature described in this document. Follow the standards and guardrails provided. Add or update tests and verification (demo app for pace-core, or in-app for consuming apps) as specified in "Testing requirements" and "Verification". Run validate and fix any issues until it passes.

---

**Checklist before running Cursor:** intro doc + guardrails doc + Cursor rules + ESLint config + this requirements doc.

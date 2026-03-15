# Project brief: pace-mint

This document describes the **high-level goals and objectives for pace-mint**. It is the main reference for what the app is and what it aims to achieve. For setup (install pace-core, run `npm run setup`, env and MCP), see your repo’s setup guide (e.g. NEW-PROJECT-SETUP.md).

---

## What is pace-mint?

pace-mint is the **finance app for the pace-suite**: the place where organisations and events manage money in a structured, auditable way. It sits alongside other PACE apps and consumes pace-core for layout, auth, RBAC, and components.

**The app delivers:**

- **Financial context and dimensions** – A generic model for who “owns” a piece of finance (e.g. an event, a program, an org). Dimensions (event, program, unit, fund, etc.) can be attached to planning, transactions, and reporting so the same concepts work across budgeting, actuals, and ledger-style reporting.
- **Event financial configuration** – Setting up how finance works for an event: currencies, variables, and configuration so budgets and actuals are consistent and scoped correctly.
- **Budgeting** – Budget structures and line items, with calculations and attachments. Support for confidence levels (e.g. guesstimate, estimate, quote) and baseline locking so teams can plan, revise, and compare against a locked baseline. Forecasting builds on the same planning primitives.
- **Actuals** – Importing real transactions (e.g. CSV), recording the source, validating rows, and storing them. Allocating those transactions to budget codes in one central place so budget vs actual reporting is meaningful.
- **Budget vs actual and reporting** – Drilldown from plans to actuals, and a financial dashboard: top-level budget summary, breakdown by confidence, unallocated actuals (with a clear path to the allocation flow), and navigation into detail. Planning, operational transactions, and reporting stay clearly separated but connected.

pace-mint is built on **generic financial primitives** (contexts, dimensions, planning vs ledger) so it can support event budgeting first and later extend to org-level budgets, grants, restricted funds, and other finance workflows without reworking the core model. The codebase is clean and standards-compliant: it uses the existing Supabase schema and mint_* data; it does not create or migrate schema in this repo. RLS and database function design are handled separately.

---

## Goals and non-goals

**Goals:**

- Be the primary finance app for the pace-suite: budgeting, actuals, allocation, and financial reporting in one place, with a consistent model for context and dimensions.
- Keep the codebase clean and scalable, with full adherence to pace-core standards. Use pace-core for UI, auth, RBAC, and layout; do not introduce legacy or one-off patterns.
- Deliver a reliable, auditable finance experience: clear ownership (context), traceable imports and allocations, and reporting that ties back to plans and actuals.
- Stay compatible with the existing Supabase and mint_* schema; integrate via pace-core’s secure client and RBAC.

**Non-goals:**

- Recreating or preserving legacy quirks or undocumented behaviour from other codebases.
- Adding features or behaviour that are not part of the agreed scope for the finance app.
- Owning database schema or migrations. pace-mint uses an existing Supabase project and mint_* data; schema, RLS, and function design live elsewhere.

---

## Tech stack

- **Runtime:** Node (LTS); package manager: npm (or bun if specified).
- **Language:** TypeScript (strict).
- **UI:** React 19, React DOM 19. React Compiler recommended (see API & Tech Stack standard).
- **Build:** Vite 7.
- **Styling:** Tailwind CSS v4, CSS-first: `@import 'tailwindcss';`, `@theme` for design tokens; no Tailwind v3 directives or `tailwind.config.js` unless strictly required.
- **Testing:** Vitest, React Testing Library, userEvent. Tests colocated with source; timeouts configured (e.g. 10s per test).
- **Backend / auth:** Supabase (auth and database). The app connects to an existing Supabase project; schema and data are not created or migrated in this repo.
- **Consuming app:** Depends on `@jmruthers/pace-core`. Run `npm run setup` to install Cursor rules and ESLint from pace-core.

---

## Repo structure

pace-mint is a **standalone repo** with the app at **repo root** (pace-core Standard 01 consuming app structure):

- **`src/`** – Source code: `src/components/`, `src/hooks/`, `src/pages/`, `src/services/`, `src/types/`, `src/utils/`, `src/lib/supabase.ts`, `src/App.tsx`, `src/main.tsx`, `src/app.css`.
- **`public/`** – Static assets (favicon, fonts, logos per Standard 01).
- **`docs/`** – Project brief (this file), setup guide, and other project documentation. Standards and Cursor rules come from pace-core via `npm run setup`.
- No `packages/core` in this repo; the app consumes the published `@jmruthers/pace-core` package.
- No database migrations in this repo.

---

## Quality gates

- **Validate** – One command (e.g. `npm run validate`) runs type check, lint, build, tests, and the pace-core audit in order. Passing validate is the definition of “done” for the app and for any change.
- **Standards** – The renumbered pace-core standards (00–09) are canonical. Cursor rules and ESLint are installed via `npm run setup` from pace-core.
- **No silencing** – Fix underlying issues; do not disable or work around the audit or lint to get a green build.

---

## Out of scope

- **Schema and migrations** – This repo does not create or alter Supabase schema, RLS policies, or database functions. That work is a separate concern.
- **Shell-only scope** – When “shell” is used in a narrow sense, it means: app boot, layout (PaceAppLayout from pace-core), RBAC, and event context—without the full finance feature set. The full feature set is defined and tracked separately; this brief describes the app’s ongoing goals, not the delivery backlog.

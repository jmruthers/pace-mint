# M01d – Contracts, tests & verification

## Overview

- **Purpose and scope:** MINT-specific hooks, types, and utilities; unit and integration tests for the shell; and final verification so all M01 acceptance criteria are met. Layout and context are already implemented in M01c.
- **Requires:** [M01c – Layout, navigation & context](M01c-layout-nav-context.md) (layout and context in place).
- **Standards:** 01 Project Structure, 02 Architecture, 03 Security & RBAC, 04 API & Tech Stack, 05 pace-core Compliance, 06 Code Quality, 07 Styling, 08 Testing & Documentation, 09 Operations.

**pace-core / standards:** Use pace-core for RBAC and context. Consume RESOURCE_NAMES and ApiResult helpers from pace-core. Do not add local `api-result.ts`, `resource-names.ts`, or `supabase-utils.ts`. Testing per Standard 08.

## Supabase and RBAC setup

Supabase RPCs and providers are already wired in M01a–M01c. For tests, ensure mocks or test setup align with pace-core RBAC and auth contracts. See [M01-mint-shell-foundations.md](M01-mint-shell-foundations.md) or M01a/M01c for required RPCs and provider order.

## Acceptance criteria (M01d)

- [ ] **Components:** MintLayout contract documented/implemented (already built in M01c; ensure contract is satisfied and documented).
- [ ] **Hooks:** `src/hooks/useMintPermissions.ts` — `useMintPermissions(): { canView, canEdit, … }` (from pace-core RBAC; permissions from pace-admin/DB).
- [ ] **Hooks:** `src/hooks/useEventFinanceContext.ts` — `useEventFinanceContext(): { eventId, context, isLoading, error }`.
- [ ] **Types:** `src/types/mint.ts` — MintPermission, MintContext.
- [ ] **Utils:** `src/utils/mint.ts` — `getCurrentEventFinanceContext(): MintContext | null`.
- [ ] **Testing (Standard 08):** Unit tests: MintLayout renders correctly; useMintPermissions returns expected shape; useEventFinanceContext returns event context when set. Integration: authenticated user can access shell; unauthorized users blocked; ProtectedRoute redirects to login when unauthenticated, renders children when authenticated; AppLayout renders PaceAppLayout with correct navItems (labels, hrefs, optional conditional items for isSuperAdmin). Coverage per Standard 08. Optional: smoke test that app renders and validate passes.
- [ ] **Verification:** Full M01 verification checklist completed (see Verification section below).

## API / Contract (M01d scope)

**Hooks:**

- `src/hooks/useMintPermissions.ts` — `useMintPermissions(): { canView, canEdit, … }` (from pace-core RBAC; permissions from pace-admin/DB).
- `src/hooks/useEventFinanceContext.ts` — `useEventFinanceContext(): { eventId, context, isLoading, error }`.

**Types:** (in `src/types/mint.ts`)

- `MintPermission`, `MintContext`

**Utilities:**

- `src/utils/mint.ts` — `getCurrentEventFinanceContext(): MintContext | null`

No implementation detail; only contract.

## Testing requirements

- **Unit:** MintLayout renders correctly; useMintPermissions returns expected shape; useEventFinanceContext returns event context when set.
- **Integration:** Authenticated user can access shell; unauthorized users blocked. ProtectedRoute redirects to login when unauthenticated; renders children when authenticated. Optional: PaceLoginPage submit and redirect. AppLayout renders PaceAppLayout with correct navItems; nav items include expected labels and hrefs; optional conditional items for isSuperAdmin.
- Coverage per Standard 08. Optional: smoke test that app renders and validate passes.

## Verification

Complete the full M01 verification checklist:

- **Route:** `/` or `/mint-shell` (real app entry).
- Run `npm run validate` → all steps pass.
- Run `npm run dev` → app loads; visiting a protected path while unauthenticated redirects to `/login`; login route is visible.
- Unauthenticated user visits `/` or any protected path → redirected to `/login`.
- User signs in on PaceLoginPage → redirected to onSuccessRedirectPath (e.g. `/`). User can sign out and is redirected to login.
- On reload while authenticated, session restores (loading shown if needed) then protected content or redirect as appropriate.
- User should: 1) Navigate to MINT. 2) View shell layout (PaceAppLayout with MINT nav). 3) Use the header context dropdown to select organisation and event; confirm selection is reflected (e.g. event context loads and pages like Financial context use the selected event).
- Authenticated user with org-admin (or equivalent) sees Dashboard and Users in nav; can navigate to `/` and `/users` (placeholder or real content per other requirements).
- Super admin sees additional nav items Login History and Applications & Pages; can navigate to those paths.
- User without dashboard read permission does not see Dashboard (or sees access denied on visit per PagePermissionGuard).

## Do not

- Do not implement feature logic beyond shell and context.
- Do not bypass pace-core components (use PaceAppLayout, pace-core auth/RBAC).
- Do not add local `api-result.ts`, `resource-names.ts`, or `supabase-utils.ts`; consume from pace-core.
- Do not implement feature pages or business logic in this slice; shell only.
- Do not create or migrate database schema.
- Do not implement a global auth gate that redirects to login for the whole app tree (per pace-core compliance); use ProtectedRoute at route level only.
- Do not use useOrganisationsFallback; use useOrganisations() only (pace-core returns all orgs for super admin).
- Do not copy old implementation; implement from this spec.

## References

- PACE Standards documentation. [ARC-MINT-architecture.md](../ARC-MINT-architecture.md) (§ 1 Core financial architecture).
- [0-project-brief.md](../0-project-brief.md). pace-core reuse outcomes; pace-core compliance (auth routing, provider order); PaceAppLayout, useRBAC. Standards: 01 Project structure, 05 Styling, 06 Security & RBAC, 07 API & tech stack, 08 Testing & Documentation.
- pace-core R04 (RBAC module) and backend RPC contract for required Supabase RPCs (rbac_get_role_context, rbac_check_permission_simplified, etc.).
- [M01-mint-shell-foundations.md](M01-mint-shell-foundations.md) — Parent scope; implemented in M01a, M01b, M01c, M01d.

---

## Prompt to use with Cursor

Implement the contracts, tests, and verification described in this document (M01d). Assume M01c is done: layout, nav, and context dropdown are in place. Add or confirm: useMintPermissions (src/hooks/useMintPermissions.ts), useEventFinanceContext (src/hooks/useEventFinanceContext.ts), types MintPermission and MintContext (src/types/mint.ts), getCurrentEventFinanceContext (src/utils/mint.ts). Add or update unit tests for MintLayout, useMintPermissions, useEventFinanceContext. Add or update integration tests for authenticated access, ProtectedRoute redirect, and AppLayout/PaceAppLayout navItems. Ensure coverage per Standard 08. Run the full M01 verification checklist and fix any issues until it passes. Run `npm run validate` and fix any issues.

---

**Checklist before running Cursor:** M01c complete + intro doc + guardrails doc + Cursor rules + ESLint config + this requirements doc.

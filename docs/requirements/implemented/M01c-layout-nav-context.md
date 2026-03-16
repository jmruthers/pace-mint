# M01c – Layout, navigation & context

## Overview

- **Purpose and scope:** Shell layout and RBAC-driven navigation for MINT: MintLayout (or AppLayout) wrapping PaceAppLayout, nav items (Dashboard, Users; super-admin: Login History, Applications & Pages), nested routes, OrganisationServiceProvider and EventServiceProvider, and context dropdown in the header for organisation and event selection. No MINT-specific hooks/types/utils or their tests in this slice (M01d).
- **Requires:** [M01b – Auth & protected routing](M01b-auth-protected-routing.md) (auth and protected routes working).
- **Standards:** 01 Project Structure, 02 Architecture, 03 Security & RBAC, 04 API & Tech Stack, 05 pace-core Compliance, 06 Code Quality, 07 Styling, 09 Operations.

**pace-core / standards:** Use pace-core PaceAppLayout. Use useRBAC (isSuperAdmin), useOrganisations; nav item permissions use read:page.{pageName} to match PagePermissionGuard; use useOrganisations() only (no useOrganisationsFallback). Do not add local `api-result.ts`, `resource-names.ts`, or `supabase-utils.ts`.

## Supabase and RBAC setup

The Supabase project used by pace-mint and the app must satisfy the following so that pace-core RBAC, auth, and context (organisation/event) work. If RPCs or providers are missing, the app may show persistent loading, 404s, or empty context selectors.

### Required RPCs in the Supabase project

The project whose URL is in `VITE_SUPABASE_URL` **must** expose these RPCs (apply pace-core migrations or add equivalent migrations to the mint project):

| RPC name | Used by | Purpose |
|----------|---------|---------|
| **rbac_get_role_context** | getRoleContext, getPermissionLevel | Role and access level for current user in scope. |
| **rbac_check_permission_simplified** | isPermitted / isPermittedCached | Per-permission check (OrganisationServiceProvider, PagePermissionGuard). |
| rbac_get_access_level | getPermissionLevel | Access level for nav/UI (none, viewer, member, leader, admin, super_admin). |
| rbac_get_permission_map | getPermissionMap | Full permission map for user in scope. |

### Required bootstrap and providers (pace-mint)

1. **setupRBAC(supabaseClient, { appName: APP_NAME })** — Called before first render (e.g. in `main.tsx`) (M01a).
2. **UnifiedAuthProvider** — Wraps the app; pass `supabaseClient`, `appName` (M01a).
3. **OrganisationServiceProvider** — Wraps the tree that contains the layout and ContextSelector; pass `supabaseClient`, `user`, `session` from auth. Required so `useUnifiedAuth()` gets org context and `organisationLoading` can complete.
4. **EventServiceProvider** — When the shell shows an event selector, wrap the same tree (inside OrganisationServiceProvider) with `EventServiceProvider(supabaseClient)` so event context and `eventLoading` complete.

**Provider order (inner to outer):** EventServiceProvider → OrganisationServiceProvider → content; both inside UnifiedAuthProvider.

### Troubleshooting: persistent loading or 404s

- **Confirm RPCs exist** — No 404s in Network tab for `rbac_get_role_context`, `rbac_check_permission_simplified`, or other RBAC RPCs above; deploy missing RPCs if needed.
- **Confirm bootstrap** — setupRBAC called in main.tsx; UnifiedAuthProvider, OrganisationServiceProvider (and EventServiceProvider if events are shown) mounted with correct props; auth/session available so `user` is set.
- **"No organisations or events available"** — The context selector shows this when OrganisationServiceProvider/EventServiceProvider get no data from Supabase. Ensure the project at `VITE_SUPABASE_URL` has the RPCs and tables that pace-core uses for organisations and events (e.g. apply pace-core migrations or equivalent), and that the signed-in user has at least one organisation (and optionally events) in the database. Check the Network tab for failed or empty RPC responses.

## Acceptance criteria (M01c)

- [ ] **Context dropdown in header:** The shell provides a context selector in the header so the user can select which **organisation** and which **event** they want to work in. Selection is reflected in organisation/event context (e.g. useOrganisations, useEvents from pace-core) and is available to all pages (e.g. Financial context page uses "event selected in the header" per M02/M03).
- [ ] AppLayout (or MintLayout) wraps nested routes with PaceAppLayout (appName, navItems, showUserMenu, enforcePermissions as required). Renders Outlet for child routes.
- [ ] Nav items: Dashboard (path `/`, permissions read:page.dashboard), Users (path `/users`, permissions read:page.users). Super admin only: Login History (path `/login-history`), Applications & Pages (path `/applications-and-pages`). Permissions array per item; super-admin-only items can use empty permissions and rely on route guard.
- [ ] AppRoutes structure: ProtectedRoute → AppLayout (or MintLayout) → nested routes for `/`, `/dashboard`, `/users`, `/applications-and-pages`, `/login-history`, `*` (NotFound). Route components can be placeholders for routes not yet implemented. Routes such as `/organisation/:organisationName`, `/events`, `/superadmin/organisations` are out of scope (other apps).
- [ ] Navigation reflects role: users without read:page.dashboard do not see Dashboard; super admin sees Login History and Applications & Pages. enforcePermissions false so pages handle PagePermissionGuard individually if that matches app pattern.
- [ ] OrganisationServiceProvider and EventServiceProvider in provider tree with correct order and props (supabaseClient, user, session from auth for OrganisationServiceProvider).

## API / Contract (M01c scope)

**Components:**

- `src/components/mint/MintLayout.tsx` — App shell layout wrapping pace-core PaceAppLayout; provides MINT nav and event context.
- `src/components/shared/AppLayout.tsx` (or MintLayout fulfilling this contract): Uses useRBAC().isSuperAdmin; builds navItems array; returns PaceAppLayout with appName, navItems, showUserMenu, enforcePermissions (e.g. false). PaceAppLayout renders Outlet internally.

**Layout / navigation:**

- **Routes:** Under ProtectedRoute, one route element = AppLayout (or MintLayout); children = feature routes for this app only: `/`, `/dashboard`, `/users`, `/applications-and-pages`, `/login-history`, `*` (NotFound). APP_NAME from `src/lib/constants/app-name.ts` (or equivalent).
- **Context dropdown in header:** The layout (MintLayout or PaceAppLayout slot) MUST provide a context selector in the header so the user can select the current **organisation** and **event**. The selector drives organisation and event context (e.g. useOrganisations().selectedOrganisation, useEvents().selectedEvent or equivalent from pace-core). All pages that are event- or organisation-scoped (e.g. Financial context per M02) rely on this selection.

No implementation detail; only contract.

## Verification (M01c)

- User can: 1) Navigate to MINT. 2) View shell layout (PaceAppLayout with MINT nav). 3) Use the header context dropdown to select organisation and event; confirm selection is reflected (e.g. event context loads and pages like Financial context use the selected event).
- Authenticated user with org-admin (or equivalent) sees Dashboard and Users in nav; can navigate to `/` and `/users` (placeholder or real content per other requirements).
- Super admin sees additional nav items Login History and Applications & Pages; can navigate to those paths.
- User without dashboard read permission does not see Dashboard (or sees access denied on visit per PagePermissionGuard).

## Do not

- Do not implement feature page logic beyond shell and context.
- Do not add useMintPermissions, useEventFinanceContext, MintPermission/MintContext types, or getCurrentEventFinanceContext in this slice (M01d).
- Do not bypass pace-core components (use PaceAppLayout, pace-core auth/RBAC).
- Do not add local `api-result.ts`, `resource-names.ts`, or `supabase-utils.ts`; consume from pace-core.
- Do not use useOrganisationsFallback; use useOrganisations() only (pace-core returns all orgs for super admin).
- Do not copy old implementation; implement from this spec.

## References

- PACE Standards documentation. [ARC-MINT-architecture.md](../ARC-MINT-architecture.md) (§ 1 Core financial architecture).
- [0-project-brief.md](../0-project-brief.md). pace-core compliance (auth routing, provider order); PaceAppLayout, useRBAC. Standards: 01 Project structure, 05 Styling, 06 Security & RBAC, 07 API & tech stack.
- pace-core R04 (RBAC module) and backend RPC contract for required Supabase RPCs (rbac_get_role_context, rbac_check_permission_simplified, etc.).
- [M01-mint-shell-foundations.md](M01-mint-shell-foundations.md) — Parent scope; implemented in M01a, M01b, M01c, M01d.

---

## Prompt to use with Cursor

Implement the layout, navigation, and context described in this document (M01c). Assume M01b is done: auth and protected routing work. Add MintLayout (or AppLayout) wrapping PaceAppLayout with appName, navItems (Dashboard, Users; super-admin: Login History, Applications & Pages), showUserMenu, enforcePermissions false. Build navItems using useRBAC().isSuperAdmin and permissions read:page.dashboard, read:page.users, etc. Wire nested routes under layout: `/`, `/dashboard`, `/users`, `/applications-and-pages`, `/login-history`, `*` (NotFound); placeholder page components acceptable. Add OrganisationServiceProvider and EventServiceProvider to the provider tree (order: EventServiceProvider → OrganisationServiceProvider → content, inside UnifiedAuthProvider); pass supabaseClient, user, session as required. Add context dropdown in the header for organisation and event selection; use useOrganisations() and useEvents() (no useOrganisationsFallback). Run validate and fix any issues. Do not implement useMintPermissions, useEventFinanceContext, types, or getCurrentEventFinanceContext in this prompt; those are M01d.

---

**Checklist before running Cursor:** M01b complete + intro doc + guardrails doc + Cursor rules + ESLint config + this requirements doc.

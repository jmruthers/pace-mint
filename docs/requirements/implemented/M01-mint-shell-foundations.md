# M01 – MINT Shell & Foundations

## Overview

- **Purpose and scope:** Establish the MINT application shell compliant with the PACE standards framework and 4-layer architecture: application shell, navigation and layout, RBAC integration, pace-core integration, event context handling. Bootstrap: repo, build tooling, dependencies, provider hierarchy, and validate pipeline so the shell is runnable. Auth and protected routing: login route (PaceLoginPage), ProtectedRoute wrapping protected routes, global auth loading/error (AppContent), session restoration. App layout and navigation: layout component (PaceAppLayout) with RBAC-driven nav items (dashboard, users; super-admin: login history, applications-and-pages), nested routes under layout.
- **Requires:** None.
- **Standards:** 01 Project Structure, 02 Architecture, 03 Security & RBAC, 04 API & Tech Stack, 05 pace-core Compliance, 06 Code Quality, 07 Styling, 08 Testing & Documentation, 09 Operations.

**Implemented in:** [M01a – Bootstrap & app skeleton](M01a-bootstrap-app-skeleton.md) → [M01b – Auth & protected routing](M01b-auth-protected-routing.md) → [M01c – Layout, navigation & context](M01c-layout-nav-context.md) → [M01d – Contracts, tests & verification](M01d-contracts-tests-verification.md). Use the prompt section in each sub-doc in that order; do not implement the full M01 in one prompt.

**pace-core / standards:** Use pace-core components (Standard 05): PaceAppLayout, Button, PaceLoginPage, ProtectedRoute, etc. RBAC via pace-core (Standard 03); permissions and roles are defined in pace-admin and stored in DB. Styling per Standard 07 (design tokens main/sec/acc, semantic HTML). No inline styles. Consume RESOURCE_NAMES and ApiResult helpers from pace-core; use pace-core QueryRetryHandler and queryErrorHandler for QueryClient defaultOptions. For auth: use UnifiedAuthProvider, useUnifiedAuth for loading/error. Do not implement a global auth gate that wraps the whole tree and redirects on !isAuthenticated; redirect at route level only (ProtectedRoute). For layout/nav: useRBAC (isSuperAdmin), useOrganisations; nav item permissions use read:page.{pageName} to match PagePermissionGuard; use useOrganisations() only (no useOrganisationsFallback). Do not add local `api-result.ts`, `resource-names.ts`, or `supabase-utils.ts`.

## Acceptance criteria (full M01)

- [ ] M01a: Repo, bootstrap, route skeleton, validate passes.
- [ ] M01b: Login, ProtectedRoute, AppContent loading/error, session restore.
- [ ] M01c: MintLayout, PaceAppLayout, RBAC nav, org/event context dropdown, providers.
- [ ] M01d: useMintPermissions, useEventFinanceContext, types, getCurrentEventFinanceContext, tests, verification.

**Detailed checklist (track in sub-docs):**

- [ ] MINT app exists as a consuming app at **repo root** with Standard 01 project structure (src/components, src/hooks, src/pages, src/types, etc.).
- [ ] Application follows the 4-layer architecture defined in Standard 02.
- [ ] Authentication and RBAC enforced using pace-core auth (Standard 03).
- [ ] Event context available throughout application.
- [ ] **Context dropdown in header:** The shell provides a context selector in the header so the user can select which **organisation** and which **event** they want to work in. Selection is reflected in organisation/event context (e.g. useOrganisations, useEvents from pace-core) and is available to all pages (e.g. Financial context page uses "event selected in the header" per M02/M03).
- [ ] Navigation entry added to PACE platform navigation.
- [ ] Styling conforms to Standard 07.
- [ ] CI build and deployment pipeline configured (Standard 09).
- [ ] Smoke test validates application loads correctly.
- [ ] Repo has package.json with dependencies: React 19, Vite 7, TypeScript, Tailwind v4, `@jmruthers/pace-core`, TanStack Query, React Router, Supabase client. Scripts: dev, build, type-check, lint, test, setup, validate.
- [ ] `main.tsx` mounts app with provider order: QueryClientProvider → BrowserRouter → UnifiedAuthProvider (with supabaseClient, appName). setupRBAC(supabaseClient) and setRBACAppName(APP_NAME) called before render. QueryClient defaultOptions use pace-core QueryRetryHandler (retry) and queryErrorHandler (meta.onError).
- [ ] `src/lib/supabase.ts` creates and exports Supabase client (e.g. via pace-core createBaseClient); used only for provider/setup; runtime data access via useSecureSupabase from pace-core.
- [ ] `src/app.css` has `@import 'tailwindcss';`, `@source` for app, `@import '@jmruthers/pace-core/styles/core.css';`, and @theme with main/sec/acc palettes (50–950) as required by Styling standard.
- [ ] App skeleton: App.tsx renders AppRoutes; AppRoutes defines Routes with `/login` and protected routes wrapped by ProtectedRoute. Placeholder or minimal content for protected routes is acceptable until later requirements.
- [ ] Cursor rules and ESLint config installed and wired (e.g. via `npm run setup` from pace-core). `npm run validate` runs typecheck → lint → build → tests (and audit if present) and passes.
- [ ] Public route `/login` renders PaceLoginPage (appName, onSuccessRedirectPath e.g. `/`, requireAppAccess as required by app). Sign-in and sign-out work.
- [ ] All other routes wrapped by ProtectedRoute; unauthenticated users visiting any protected path are redirected to `/login` (replace, not push). Session restoration completes before redirect (show loading until restoration done or timed out).
- [ ] Global auth loading: when useUnifiedAuth().isLoading is true and not on login route, show loading UI (e.g. full-screen spinner with message). When on login route, do not block login form with full-screen loading.
- [ ] Global auth error: when useUnifiedAuth().authError is set and not on login route, show error UI (e.g. card with message and reload button). Do not block login route.
- [ ] AppProviders (or equivalent) wraps Routes and provides AppContent that handles loading/error; children render Routes. No wrapper that redirects entire tree on !isAuthenticated.
- [ ] AppLayout (or MintLayout) wraps nested routes with PaceAppLayout (appName, navItems, showUserMenu, enforcePermissions as required). Renders Outlet for child routes.
- [ ] Nav items: Dashboard (path `/`, permissions read:page.dashboard), Users (path `/users`, permissions read:page.users). Super admin only: Login History (path `/login-history`), Applications & Pages (path `/applications-and-pages`). Permissions array per item; super-admin-only items can use empty permissions and rely on route guard.
- [ ] AppRoutes structure: ProtectedRoute → AppLayout (or MintLayout) → nested routes for `/`, `/dashboard`, `/users`, `/applications-and-pages`, `/login-history`, `*` (NotFound). Route components can be placeholders for routes not yet implemented. Routes such as `/organisation/:organisationName`, `/events`, `/superadmin/organisations` are out of scope (other apps).
- [ ] Navigation reflects role: users without read:page.dashboard do not see Dashboard; super admin sees Login History and Applications & Pages. enforcePermissions false so pages handle PagePermissionGuard individually if that matches app pattern.
- [ ] Hooks: useMintPermissions(), useEventFinanceContext(); types MintPermission, MintContext; getCurrentEventFinanceContext(). Tests and verification per M01d.

## API / Contract (summary)

See [M01a](M01a-bootstrap-app-skeleton.md), [M01b](M01b-auth-protected-routing.md), [M01c](M01c-layout-nav-context.md), and [M01d](M01d-contracts-tests-verification.md) for contract details. Summary: MintLayout, AppLayout, PaceAppLayout; useMintPermissions, useEventFinanceContext; MintPermission, MintContext; getCurrentEventFinanceContext; bootstrap/entry, auth, layout/nav, providers, context dropdown.

## References

- PACE Standards documentation. [ARC-MINT-architecture.md](../ARC-MINT-architecture.md) (§ 1 Core financial architecture).
- [0-project-brief.md](../0-project-brief.md). pace-core reuse outcomes; pace-core compliance (auth routing, provider order); PaceAppLayout, useRBAC. Standards: 01 Project structure, 05 Styling, 06 Security & RBAC, 07 API & tech stack.
- pace-core R04 (RBAC module) and backend RPC contract for required Supabase RPCs (rbac_get_role_context, rbac_check_permission_simplified, etc.).

---

## How to implement M01

Do **not** implement the full M01 in one prompt. Use the prompt section in each sub-doc in order:

1. **[M01a – Bootstrap & app skeleton](M01a-bootstrap-app-skeleton.md)** — Repo, providers, route skeleton, validate.
2. **[M01b – Auth & protected routing](M01b-auth-protected-routing.md)** — Login, ProtectedRoute, AppContent.
3. **[M01c – Layout, navigation & context](M01c-layout-nav-context.md)** — MintLayout, PaceAppLayout, nav, context dropdown, providers.
4. **[M01d – Contracts, tests & verification](M01d-contracts-tests-verification.md)** — Hooks, types, utils, tests, verification checklist.

**Checklist before running Cursor:** intro doc + guardrails doc + Cursor rules + ESLint config + the specific M01x requirements doc for that step.

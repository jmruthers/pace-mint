# M01 – MINT Shell & Foundations

## Overview

- **Purpose and scope:** Establish the MINT application shell compliant with the PACE standards framework and 4-layer architecture: application shell, navigation and layout, RBAC integration, pace-core integration, event context handling. Bootstrap: repo, build tooling, dependencies, provider hierarchy, and validate pipeline so the shell is runnable. Auth and protected routing: login route (PaceLoginPage), ProtectedRoute wrapping protected routes, global auth loading/error (AppContent), session restoration. App layout and navigation: layout component (PaceAppLayout) with RBAC-driven nav items (dashboard, users; super-admin: login history, applications-and-pages), nested routes under layout.
- **Requires:** None.
- **Standards:** 01 Project Structure, 02 Architecture, 03 Security & RBAC, 04 API & Tech Stack, 05 pace-core Compliance, 06 Code Quality, 07 Styling, 08 Testing & Documentation, 09 Operations.

**pace-core / standards:** Use pace-core components (Standard 05): PaceAppLayout, Button, PaceLoginPage, ProtectedRoute, etc. RBAC via pace-core (Standard 03); permissions and roles are defined in pace-admin and stored in DB. Styling per Standard 07 (design tokens main/sec/acc, semantic HTML). No inline styles. Consume RESOURCE_NAMES and ApiResult helpers from pace-core; use pace-core QueryRetryHandler and queryErrorHandler for QueryClient defaultOptions. For auth: use UnifiedAuthProvider, useUnifiedAuth for loading/error. Do not implement a global auth gate that wraps the whole tree and redirects on !isAuthenticated; redirect at route level only (ProtectedRoute). For layout/nav: useRBAC (isSuperAdmin), useOrganisations; nav item permissions use read:page.{pageName} to match PagePermissionGuard; use useOrganisations() only (no useOrganisationsFallback). Do not add local `api-result.ts`, `resource-names.ts`, or `supabase-utils.ts`.

**Bootstrap scope:** Repo root; `src/main.tsx`, `src/App.tsx`, `src/AppRoutes.tsx`, `src/app.css`, `src/lib/supabase.ts`; provider order and pace-core QueryClient/error handling per Standard 04; no feature pages beyond placeholder routes if needed.

## Acceptance criteria

- [x] MINT app exists as a consuming app at **repo root** with Standard 01 project structure (src/components, src/hooks, src/pages, src/types, etc.).
- [x] Application follows the 4-layer architecture defined in Standard 02.
- [x] Authentication and RBAC enforced using pace-core auth (Standard 03).
- [x] Event context available throughout application.
- [x] Navigation entry added to PACE platform navigation.
- [x] Styling conforms to Standard 07.
- [x] CI build and deployment pipeline configured (Standard 09).
- [x] Smoke test validates application loads correctly.
- [ ] Repo has package.json with dependencies: React 19, Vite 7, TypeScript, Tailwind v4, `@jmruthers/pace-core`, TanStack Query, React Router, Supabase client. Scripts: dev, build, type-check, lint, test, setup, validate.
- [ ] `main.tsx` mounts app with provider order: QueryClientProvider → BrowserRouter → UnifiedAuthProvider (with supabaseClient, appName). setupRBAC(supabaseClient) and setRBACAppName(APP_NAME) called before render. QueryClient defaultOptions use pace-core QueryRetryHandler (retry) and queryErrorHandler (meta.onError).
- [ ] `src/lib/supabase.ts` creates and exports Supabase client (e.g. via pace-core createBaseClient); used only for provider/setup; runtime data access via useSecureSupabase from pace-core.
- [ ] `src/app.css` has `@import 'tailwindcss';`, `@source` for app, `@import '@jmruthers/pace-core/styles/core.css';`, and @theme with main/sec/acc palettes (50–950) as required by Styling standard.
- [ ] App skeleton: App.tsx renders AppRoutes; AppRoutes defines Routes with `/login` and protected routes wrapped by ProtectedRoute (see Auth criteria below). Placeholder or minimal content for protected routes is acceptable until later requirements.
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

## API / Contract

**Components:**

- `src/components/mint/MintLayout.tsx` — App shell layout wrapping pace-core PaceAppLayout; provides MINT nav and event context.
- `src/components/shared/AppLayout.tsx` (or MintLayout fulfilling this contract): Uses useRBAC().isSuperAdmin; builds navItems array; returns PaceAppLayout with appName, navItems, showUserMenu, enforcePermissions (e.g. false). PaceAppLayout renders Outlet internally.

**Hooks:**

- `src/hooks/useMintPermissions.ts` — `useMintPermissions(): { canView, canEdit, … }` (from pace-core RBAC; permissions from pace-admin/DB).
- `src/hooks/useEventFinanceContext.ts` — `useEventFinanceContext(): { eventId, context, isLoading, error }`.

**Types:** (in `src/types/mint.ts`)

- `MintPermission`, `MintContext`

**Utilities:**

- `src/utils/mint.ts` — `getCurrentEventFinanceContext(): MintContext | null`

**Bootstrap / entry:**

- **Entry:** `index.html` → `src/main.tsx`.
- **main.tsx:** createRoot; QueryClientProvider(client); BrowserRouter; UnifiedAuthProvider(supabaseClient, appName, …); App. setupRBAC(supabaseClient), setRBACAppName(APP_NAME) before render. QueryClient defaultOptions.queries.retry = QueryRetryHandler; defaultOptions.queries.meta.onError = queryErrorHandler (from pace-core).
- **App.tsx:** Renders AppRoutes (and Toaster if desired). When the app uses organisation context (e.g. useOrganisations), wrap that content with OrganisationServiceProvider inside UnifiedAuthProvider—see A04 for provider tree and props (supabaseClient, user, session from useUnifiedAuthContext).
- **AppRoutes.tsx:** Routes: `/login` → PaceLoginPage. All other routes nested under `<ProtectedRoute />`; then one route element = AppLayout (or MintLayout); children = feature routes: `/`, `/dashboard`, `/users`, `/applications-and-pages`, `/login-history`, `*` (NotFound). Each path maps to a page component (placeholder or implemented in later requirements). Do not add routes for organisation, events, or superadmin flows that belong to other apps.
- **src/lib/supabase.ts:** Exports supabaseClient (and optionally SUPABASE_URL, SUPABASE_ANON_KEY if used).
- **src/app.css:** Tailwind v4 + pace-core core.css + theme palettes per Styling standard.
- **Constants:** APP_NAME (e.g. for MINT) in `src/lib/constants/app-name.ts` or equivalent. RESOURCE_NAMES and ApiResult helpers imported from pace-core where needed; no local copies.

**Auth / protected routing:**

- **Routes:** `/login` → PaceLoginPage. All other routes nested under a single parent route whose element is `<ProtectedRoute />` (or `<ProtectedRoute loginPath="/login" />`).
- **Components:** AppProviders (optional name): wraps children with AppContent. AppContent: uses useUnifiedAuth(); if isLoading && !isLoginRoute → loading UI; if authError && !isLoginRoute → error UI; else render children (Routes). Location pathname used to detect login route.
- **main.tsx:** App wrapped by UnifiedAuthProvider; App renders AppProviders (if used) then AppRoutes, or AppRoutes directly with AppContent inside so that Routes see auth context.

**Layout / navigation:**

- **Routes:** Under ProtectedRoute, one route element = AppLayout (or MintLayout); children = feature routes for this app only: `/`, `/dashboard`, `/users`, `/applications-and-pages`, `/login-history`, `*` (NotFound). APP_NAME from `src/lib/constants/app-name.ts` (or equivalent).

No implementation detail; only contract.

## Verification

- **Route:** `/` or `/mint-shell` (real app entry).
- Run `npm run validate` → all steps pass.
- Run `npm run dev` → app loads; visiting a protected path while unauthenticated redirects to `/login`; login route is visible.
- Unauthenticated user visits `/` or any protected path → redirected to `/login`.
- User signs in on PaceLoginPage → redirected to onSuccessRedirectPath (e.g. `/`). User can sign out and is redirected to login.
- On reload while authenticated, session restores (loading shown if needed) then protected content or redirect as appropriate.
- User should:
  1. Navigate to MINT.
  2. View shell layout (PaceAppLayout with MINT nav).
  3. Confirm event context loads.
- Authenticated user with org-admin (or equivalent) sees Dashboard and Users in nav; can navigate to `/` and `/users` (placeholder or real content per other requirements).
- Super admin sees additional nav items Login History and Applications & Pages; can navigate to those paths.
- User without dashboard read permission does not see Dashboard (or sees access denied on visit per PagePermissionGuard).

## Testing requirements

- **Unit:** MintLayout renders correctly; useMintPermissions returns expected shape; useEventFinanceContext returns event context when set.
- **Integration:** Authenticated user can access shell; unauthorized users blocked. ProtectedRoute redirects to login when unauthenticated; renders children when authenticated. Optional: PaceLoginPage submit and redirect. AppLayout renders PaceAppLayout with correct navItems; nav items include expected labels and hrefs; optional conditional items for isSuperAdmin.
- Coverage per Standard 08. Optional: smoke test that app renders and validate passes.

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
- [0-project-brief.md](../0-project-brief.md). pace-core reuse outcomes; pace-core compliance (auth routing, provider order); PaceAppLayout, useRBAC. Standards: 01 Project structure, 05 Styling, 06 Security & RBAC, 07 API & tech stack.

---

## Prompt to use with Cursor

Implement the feature described in this document. Follow the standards and guardrails provided. Use pace-core for RESOURCE_NAMES, ApiResult helpers, and QueryClient retry/error handling. Do not add local api-result, resource-names, or supabase-utils. Use pace-core PaceLoginPage and ProtectedRoute for auth; handle loading and error in AppContent; do not add a global auth gate. Use PaceAppLayout and useRBAC for nav items; wire all route paths under AppLayout (or MintLayout); use useOrganisations() only. Add or update tests and verification as specified in "Testing requirements" and "Verification". Run validate and fix any issues until it passes.

---

**Checklist before running Cursor:** intro doc + guardrails doc + Cursor rules + ESLint config + this requirements doc.

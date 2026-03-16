# M01b – Auth & protected routing

## Overview

- **Purpose and scope:** Login and protected access for MINT: public `/login` route with PaceLoginPage, ProtectedRoute wrapping all other routes, session restoration, and global auth loading/error UX (AppContent). No layout, nav, or context dropdown in this slice.
- **Requires:** [M01a – Bootstrap & app skeleton](M01a-bootstrap-app-skeleton.md) (bootstrap and route skeleton in place).
- **Standards:** 01 Project Structure, 02 Architecture, 03 Security & RBAC, 04 API & Tech Stack, 05 pace-core Compliance, 06 Code Quality, 07 Styling, 09 Operations.

**pace-core / standards:** Use pace-core PaceLoginPage and ProtectedRoute. Use UnifiedAuthProvider, useUnifiedAuth for loading/error. Do not implement a global auth gate that wraps the whole tree and redirects on !isAuthenticated; redirect at route level only (ProtectedRoute). Do not add local `api-result.ts`, `resource-names.ts`, or `supabase-utils.ts`.

## Supabase and RBAC setup

The Supabase project used by pace-mint must expose the RPCs required by pace-core RBAC and auth. M01a already wires setupRBAC and UnifiedAuthProvider; M01b adds auth UI and protected routing. OrganisationServiceProvider and EventServiceProvider are added in M01c.

### Required RPCs in the Supabase project

The project whose URL is in `VITE_SUPABASE_URL` **must** expose these RPCs:

| RPC name | Used by | Purpose |
|----------|---------|---------|
| **rbac_get_role_context** | getRoleContext, getPermissionLevel | Role and access level for current user in scope. |
| **rbac_check_permission_simplified** | isPermitted / isPermittedCached | Per-permission check (OrganisationServiceProvider, PagePermissionGuard). |
| rbac_get_access_level | getPermissionLevel | Access level for nav/UI. |
| rbac_get_permission_map | getPermissionMap | Full permission map for user in scope. |

### Troubleshooting: persistent loading or 404s

- **Confirm RPCs exist** — No 404s in Network tab for RBAC RPCs; deploy missing RPCs if needed.
- **Confirm bootstrap** — setupRBAC called in main.tsx; UnifiedAuthProvider mounted with correct props; auth/session available so `user` is set when authenticated.

## Acceptance criteria (M01b)

- [ ] Public route `/login` renders PaceLoginPage (appName, onSuccessRedirectPath e.g. `/`, requireAppAccess as required by app). Sign-in and sign-out work.
- [ ] All other routes wrapped by ProtectedRoute; unauthenticated users visiting any protected path are redirected to `/login` (replace, not push). Session restoration completes before redirect (show loading until restoration done or timed out).
- [ ] Global auth loading: when useUnifiedAuth().isLoading is true and not on login route, show loading UI (e.g. full-screen spinner with message). When on login route, do not block login form with full-screen loading.
- [ ] Global auth error: when useUnifiedAuth().authError is set and not on login route, show error UI (e.g. card with message and reload button). Do not block login route.
- [ ] AppProviders (or equivalent) wraps Routes and provides AppContent that handles loading/error; children render Routes. No wrapper that redirects entire tree on !isAuthenticated.

## API / Contract (M01b scope)

**Auth / protected routing:**

- **Routes:** `/login` → PaceLoginPage. All other routes nested under a single parent route whose element is `<ProtectedRoute />` (or `<ProtectedRoute loginPath="/login" />`).
- **Components:** AppProviders (optional name): wraps children with AppContent. AppContent: uses useUnifiedAuth(); if isLoading && !isLoginRoute → loading UI; if authError && !isLoginRoute → error UI; else render children (Routes). Location pathname used to detect login route.
- **main.tsx:** App wrapped by UnifiedAuthProvider (from M01a); App renders AppProviders (if used) then AppRoutes, or AppRoutes directly with AppContent inside so that Routes see auth context.

No implementation detail; only contract.

## Verification (M01b)

- Unauthenticated user visits `/` or any protected path → redirected to `/login`.
- User signs in on PaceLoginPage → redirected to onSuccessRedirectPath (e.g. `/`). User can sign out and is redirected to login.
- On reload while authenticated, session restores (loading shown if needed) then protected content or redirect as appropriate.
- When on login route, login form is not blocked by full-screen loading; when not on login and loading, full-screen loading is shown; when authError and not on login, error UI is shown.

## Do not

- Do not implement a global auth gate that redirects to login for the whole app tree (per pace-core compliance); use ProtectedRoute at route level only.
- Do not add layout (PaceAppLayout), nav items, or context dropdown in this slice (M01c).
- Do not add local `api-result.ts`, `resource-names.ts`, or `supabase-utils.ts`; consume from pace-core.
- Do not copy old implementation; implement from this spec.

## References

- PACE Standards documentation. [ARC-MINT-architecture.md](../ARC-MINT-architecture.md) (§ 1 Core financial architecture).
- [0-project-brief.md](../0-project-brief.md). pace-core compliance (auth routing, provider order).
- [M01-mint-shell-foundations.md](M01-mint-shell-foundations.md) — Parent scope; implemented in M01a, M01b, M01c, M01d.

---

## Prompt to use with Cursor

Implement auth and protected routing described in this document (M01b). Assume M01a is done: bootstrap, providers, and route skeleton exist. Add PaceLoginPage on `/login` with appName, onSuccessRedirectPath (e.g. `/`), and requireAppAccess as required. Wrap all other routes with ProtectedRoute; unauthenticated users redirect to `/login` (replace). Implement AppContent (inside AppProviders or equivalent): when useUnifiedAuth().isLoading && !isLoginRoute show loading UI; when authError && !isLoginRoute show error UI; else render children. Do not add a global auth gate. Ensure session restoration runs before redirect and loading is shown until restore done or timed out. Run validate and fix any issues. Do not implement layout, nav, or context dropdown in this prompt; those are M01c.

---

**Checklist before running Cursor:** M01a complete + intro doc + guardrails doc + Cursor rules + ESLint config + this requirements doc.

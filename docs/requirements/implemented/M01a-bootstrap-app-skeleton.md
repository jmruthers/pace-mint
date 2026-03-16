# M01a – Bootstrap & app skeleton

## Overview

- **Purpose and scope:** Repo and build foundation for MINT: project structure, dependencies, provider hierarchy, entry and route skeleton, and validate pipeline so the app mounts and `npm run validate` passes. No login UI, protected routing, layout, or context in this slice.
- **Requires:** None.
- **Standards:** 01 Project Structure, 02 Architecture, 04 API & Tech Stack, 05 pace-core Compliance, 06 Code Quality, 07 Styling, 09 Operations.

**pace-core / standards:** Use pace-core for Supabase client creation and QueryClient setup. Consume RESOURCE_NAMES and ApiResult helpers from pace-core; use pace-core QueryRetryHandler and queryErrorHandler for QueryClient defaultOptions. Do not add local `api-result.ts`, `resource-names.ts`, or `supabase-utils.ts`. Styling per Standard 07 (design tokens main/sec/acc, semantic HTML). No inline styles.

## Supabase and RBAC setup

The Supabase project used by pace-mint must expose the RPCs required by pace-core RBAC and auth. For M01a, bootstrap only needs to call setupRBAC and mount UnifiedAuthProvider; OrganisationServiceProvider and EventServiceProvider are added in M01c.

### Required RPCs in the Supabase project

The project whose URL is in `VITE_SUPABASE_URL` **must** expose these RPCs (apply pace-core migrations or add equivalent migrations to the mint project):

| RPC name | Used by | Purpose |
|----------|---------|---------|
| **rbac_get_role_context** | getRoleContext, getPermissionLevel | Role and access level for current user in scope. |
| **rbac_check_permission_simplified** | isPermitted / isPermittedCached | Per-permission check (OrganisationServiceProvider, PagePermissionGuard). |
| rbac_get_access_level | getPermissionLevel | Access level for nav/UI (none, viewer, member, leader, admin, super_admin). |
| rbac_get_permission_map | getPermissionMap | Full permission map for user in scope. |

### Required bootstrap (M01a scope)

1. **setupRBAC(supabaseClient, { appName: APP_NAME })** — Called before first render (e.g. in `main.tsx`).
2. **UnifiedAuthProvider** — Wraps the app; pass `supabaseClient`, `appName`.

OrganisationServiceProvider and EventServiceProvider are introduced in M01c when layout and context dropdown are implemented.

### Troubleshooting: persistent loading or 404s

- **Confirm RPCs exist** — No 404s in Network tab for `rbac_get_role_context`, `rbac_check_permission_simplified`, or other RBAC RPCs above; deploy missing RPCs if needed.
- **Confirm bootstrap** — setupRBAC called in main.tsx; UnifiedAuthProvider mounted with correct props.

## Acceptance criteria (M01a)

- [ ] Repo has package.json with dependencies: React 19, Vite 7, TypeScript, Tailwind v4, `@jmruthers/pace-core`, TanStack Query, React Router, Supabase client. Scripts: dev, build, type-check, lint, test, setup, validate.
- [ ] MINT app exists at **repo root** with Standard 01 project structure (src/components, src/hooks, src/pages, src/types, src/lib, etc.).
- [ ] Application follows the 4-layer architecture defined in Standard 02.
- [ ] `main.tsx` mounts app with provider order: QueryClientProvider → BrowserRouter → UnifiedAuthProvider (with supabaseClient, appName). setupRBAC(supabaseClient) and setRBACAppName(APP_NAME) called before render. QueryClient defaultOptions use pace-core QueryRetryHandler (retry) and queryErrorHandler (meta.onError).
- [ ] `src/lib/supabase.ts` creates and exports Supabase client (e.g. via pace-core createBaseClient); used only for provider/setup; runtime data access via useSecureSupabase from pace-core.
- [ ] `src/app.css` has `@import 'tailwindcss';`, `@source` for app, `@import '@jmruthers/pace-core/styles/core.css';`, and @theme with main/sec/acc palettes (50–950) as required by Styling standard.
- [ ] App skeleton: App.tsx renders AppRoutes; AppRoutes defines Routes with `/login` and a protected branch (e.g. one route under ProtectedRoute for `/` only, or minimal placeholder). Placeholder or minimal content for protected routes is acceptable.
- [ ] APP_NAME in `src/lib/constants/app-name.ts` (or equivalent). RESOURCE_NAMES and ApiResult helpers imported from pace-core where needed; no local copies.
- [ ] Cursor rules and ESLint config installed and wired (e.g. via `npm run setup` from pace-core). `npm run validate` runs typecheck → lint → build → tests (and audit if present) and passes.

## API / Contract (M01a scope)

**Bootstrap / entry:**

- **Entry:** `index.html` → `src/main.tsx`.
- **main.tsx:** createRoot; QueryClientProvider(client); BrowserRouter; UnifiedAuthProvider(supabaseClient, appName, …); App. setupRBAC(supabaseClient), setRBACAppName(APP_NAME) before render. QueryClient defaultOptions.queries.retry = QueryRetryHandler; defaultOptions.queries.meta.onError = queryErrorHandler (from pace-core).
- **App.tsx:** Renders AppRoutes (and Toaster if desired). OrganisationServiceProvider is not required until M01c.
- **AppRoutes.tsx:** Routes: `/login` (can render a placeholder for M01a; PaceLoginPage in M01b). Protected branch with one or more routes under ProtectedRoute; placeholder page components acceptable.
- **src/lib/supabase.ts:** Exports supabaseClient (and optionally SUPABASE_URL, SUPABASE_ANON_KEY if used).
- **src/app.css:** Tailwind v4 + pace-core core.css + theme palettes per Styling standard.
- **Constants:** APP_NAME in `src/lib/constants/app-name.ts` or equivalent.

No implementation detail; only contract.

## Verification (M01a)

- Run `npm run validate` → all steps pass.
- Run `npm run dev` → app loads (visiting `/` may show placeholder or redirect; auth UI and layout are in M01b/M01c).

## Do not

- Do not implement PaceLoginPage UI, ProtectedRoute behaviour, or AppContent loading/error in this slice (M01b).
- Do not add layout, nav items, or context dropdown in this slice (M01c).
- Do not add local `api-result.ts`, `resource-names.ts`, or `supabase-utils.ts`; consume from pace-core.
- Do not create or migrate database schema.
- Do not copy old implementation; implement from this spec.

## References

- PACE Standards documentation. [ARC-MINT-architecture.md](../ARC-MINT-architecture.md) (§ 1 Core financial architecture).
- [0-project-brief.md](../0-project-brief.md). pace-core reuse outcomes; Standards: 01 Project structure, 05 Styling, 07 API & tech stack.
- [M01-mint-shell-foundations.md](M01-mint-shell-foundations.md) — Parent scope; implemented in M01a, M01b, M01c, M01d.

---

## Prompt to use with Cursor

Implement the bootstrap and app skeleton described in this document (M01a). Follow the standards and guardrails provided. Use pace-core for RESOURCE_NAMES, ApiResult helpers, and QueryClient retry/error handling. Do not add local api-result, resource-names, or supabase-utils. Wire main.tsx with QueryClientProvider → BrowserRouter → UnifiedAuthProvider; call setupRBAC and setRBACAppName before render. Add App.tsx → AppRoutes with `/login` and a minimal protected branch (placeholder content is fine). Ensure `npm run validate` passes. Do not implement login page UI, ProtectedRoute behaviour, layout, or context in this prompt; those are M01b and M01c.

---

**Checklist before running Cursor:** intro doc + guardrails doc + Cursor rules + ESLint config + this requirements doc.

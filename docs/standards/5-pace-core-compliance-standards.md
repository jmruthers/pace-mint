# pace-core Compliance Standards

**🤖 Cursor Rule**: See [05-pace-core-compliance.mdc](../cursor-rules/05-pace-core-compliance.mdc) for AI-optimized directives that automatically enforce these standards.

This guide explains how to enforce pace-core usage patterns in consuming apps to ensure consistent design, reduce duplication, and maintain high code quality.

## Overview

pace-core provides a comprehensive enforcement system that includes:

1. **ESLint Rules** - Real-time linting during development (organized by standards: 01, 04, 05, 06, 07, 08)
2. **Audit Tool** - Comprehensive system-level analysis organized by standards (01-09)
3. **ESLint Config Preset** - Easy setup for consuming apps
4. **Cursor Rules Integration** - AI-assisted enforcement via Cursor IDE

### ESLint vs Audit Scripts

**ESLint Rules** (Real-time, AST-based):
- ✅ Run automatically in your IDE
- ✅ Provide immediate feedback during development
- ✅ Check single files using AST analysis
- ✅ Can be auto-fixed in many cases
- ✅ Integrated with your development workflow

**Audit Scripts** (Comprehensive, file-system based):
- ✅ Scan entire codebase
- ✅ Check file structure and configuration
- ✅ Cross-file analysis (e.g., provider nesting)
- ✅ Generate detailed reports
- ✅ Check setup files (main.tsx, app.css, etc.)

**What's in ESLint vs Audit Scripts**:

| Check | ESLint | Audit Script |
|-------|--------|--------------|
| Restricted imports | ✅ | ✅ (reference) |
| Native HTML elements | ✅ | ✅ (reference) |
| Custom hooks/utils | ✅ | ✅ (reference) |
| Inline styles | ✅ | ✅ (reference) |
| Plain form tags | ✅ | ✅ (reference) |
| Direct Supabase client | ✅ | ✅ (file location) |
| RBAC permission loading | ✅ | ✅ (reference) |
| Direct RBAC RPC/table | ✅ | ✅ (reference) |
| Hardcoded role checks | ✅ | ✅ (reference) |
| RESOURCE_NAMES constants | ✅ | ✅ (reference) |
| RBAC wrapper components | ✅ | ✅ (reference) |
| RBAC wrapper functions | ✅ | ✅ (reference) |
| RBAC setup (main.tsx) | ❌ | ✅ |
| Provider nesting | ❌ | ✅ |
| Core styles import chain | ❌ | ✅ |
| PagePermissionGuard coverage | ❌ | ✅ |
| Edge Functions RBAC | ❌ | ✅ |

## Quick Start

### Step 1: Install pace-core

```bash
npm install @jmruthers/pace-core
```

### Step 2: Setup ESLint

**MUST** use the automated setup to install ESLint config: run `npm run setup` from the project root. Use `npm run setup -- --force` only when re-applying over existing config.

The setup script will:
- Configure ESLint to use pace-core rules
- Create `eslint.config.js` if it doesn't exist
- Add pace-core config to existing ESLint config
- Create backups before modifying files

**Manual override (only when automated setup cannot be used):** Add the pace-core config by spreading `@jmruthers/pace-core/eslint-config` in the project's single ESLint config file (`eslint.config.js` or equivalent):

```javascript
// eslint.config.js (ES modules)
import paceCoreConfig from '@jmruthers/pace-core/eslint-config';

export default [
  ...paceCoreConfig,
  // your other config
];
```

For CommonJS (`.eslintrc.js` or `eslint.config.cjs`), use `require('@jmruthers/pace-core/eslint-config')` and spread it in the exported array. For TypeScript ESLint wrapper, pass `...paceCoreConfig` as arguments to `tseslint.config()`.

### Step 3: Setup Cursor Rules

**MUST** run `npm run setup` to install Cursor rules into `.cursor/rules/`. Use `npm run setup -- --force` only when re-applying over existing config.

The setup script will install Cursor rules to `.cursor/rules/`, create backups before updating, and keep pace-core rules in sync when they change.

**Manual override (only when automated setup cannot be used):** Copy all `*.mdc` from `node_modules/@jmruthers/pace-core/cursor-rules/` to `.cursor/rules/`:

```bash
mkdir -p .cursor/rules
cp node_modules/@jmruthers/pace-core/cursor-rules/*.mdc .cursor/rules/
```

Or manually create `.cursor/rules/05-pace-core-compliance.mdc` and reference the pace-core rules:

```markdown
---
description: Enforce pace-core usage patterns
globs: ["src/**/*.{ts,tsx,js,jsx}"]
alwaysApply: false
---

# pace-core Compliance

**📚 Full Documentation**: See [pace-core compliance docs](node_modules/@jmruthers/pace-core/docs/standards/5-pace-core-compliance-standards.md)

**🔧 ESLint Setup**: Ensure ESLint is configured with `@jmruthers/pace-core/eslint-config`

This rule enforces pace-core usage patterns. ESLint provides real-time feedback, while this Cursor rule provides AI-assisted guidance.

## Key Requirements

- Use pace-core components instead of native HTML or custom implementations
- Use pace-core hooks instead of custom hooks
- Use pace-core utilities instead of custom utilities
- Use `useSecureSupabase()` instead of direct Supabase client creation
- Follow RBAC patterns from pace-core
- Use RESOURCE_NAMES constants instead of string literals

See the full documentation for complete rules and examples.
```

**Benefits of Cursor Rules Integration**:
- AI assistant (like me!) will automatically suggest pace-core alternatives
- Context-aware suggestions during code writing
- Works alongside ESLint for comprehensive enforcement
- Provides explanations and examples in real-time

## ESLint Rules

pace-core provides ESLint rules organized by standards (01, 04, 05, 06, 07, 08). Rules are organized to match the 10-file standards structure:

- **Standard 5 (pace-core Compliance)**: 6 rules
- **Standard 6 (Code Quality)**: 3 rules
- **Standard 7 (Styling)**: 1 rule
- **Standard 3 (Security & RBAC)**: 8 rules
- **Standard 4 (API & Tech Stack)**: 3 rules
- **Standard 8 (Testing)**: 1 rule

**Total: 22 rules** organized across 6 standards files.

### Rule Organization

Rules are organized in `packages/core/eslint-rules/rules/`:
- `01-pace-core-compliance.cjs` - pace-core usage patterns
- `04-code-quality.cjs` - Naming conventions, component/type naming
- `05-styling.cjs` - Inline styles
- `06-security-rbac.cjs` - Security and RBAC patterns
- `07-api-tech-stack.cjs` - RPC naming, React 19+, import.meta.env
- `08-testing.cjs` - Test file naming

Rule IDs are under the plugin prefix `pace-core-compliance/` (e.g. `pace-core-compliance/prefer-pace-core-components`). Use this prefix when configuring overrides or looking up rules in IDE/CI output.

### Detailed Rule Descriptions

#### Import Rules

#### no-restricted-imports

**Severity**: Error

Blocks direct imports of libraries that pace-core wraps and standardizes.

**Restricted Libraries**:
- `@radix-ui/*` - All Radix UI packages (use pace-core components instead)
- `react-day-picker` - Use `Calendar` from pace-core
- `@tanstack/react-table` - Use `DataTable` from pace-core
- `react-hook-form` - Use `Form` and `useZodForm` from pace-core
- `zod` - Use validation utilities from pace-core

**Example Violation**:
```typescript
// ❌ Bad
import { Dialog } from '@radix-ui/react-dialog';

// ✅ Good
import { Dialog } from '@jmruthers/pace-core';
```

### Compliance Rules

#### prefer-pace-core-components

**Severity**: Warning

Suggests using pace-core components instead of native HTML elements.

**Detected Patterns**:
- `<button>` → Use `Button` from pace-core
- `<input>` → Use `Input` from pace-core
- `<textarea>` → Use `Textarea` from pace-core
- `<label>` → Use `Label` from pace-core

**Example**:
```tsx
// ⚠️ Warning
<button onClick={handleClick}>Click me</button>

// ✅ Recommended
import { Button } from '@jmruthers/pace-core';
<Button onClick={handleClick}>Click me</Button>
```

#### prefer-pace-core-hooks

**Severity**: Warning

Detects custom hooks that duplicate pace-core functionality.

**Common Patterns Detected**:
- `useToast`, `useNotification` → Use `useToast` from pace-core
- `useDebounce`, `useDebounced` → Use `useDebounce` from pace-core
- `useAuth`, `useAuthentication` → Use `useUnifiedAuth` from pace-core
- `useForm`, `useZodForm` → Use `useZodForm` from pace-core

**Example**:
```typescript
// ⚠️ Warning
function useToast() {
  // custom implementation
}

// ✅ Recommended
import { useToast } from '@jmruthers/pace-core';
```

#### prefer-pace-core-utils

**Severity**: Warning

Detects utility functions that duplicate pace-core functionality.

**Common Patterns Detected**:
- `formatDate`, `dateFormat` → Use `formatDate` from pace-core
- `formatCurrency`, `formatMoney` → Use `formatCurrency` from pace-core
- `cn`, `classNames`, `clsx` → Use `cn` from pace-core
- `validate`, `validateInput` → Use `validateUserInput` from pace-core

**Example**:
```typescript
// ⚠️ Warning
function formatDate(date: Date): string {
  // custom implementation
}

// ✅ Recommended
import { formatDate } from '@jmruthers/pace-core';
```

#### no-local-component-duplication

**Severity**: Error

Prevents creating local components with names matching pace-core components.

**Example Violation**:
```
// ❌ Error: components/Button.tsx
export function Button() { ... }

// pace-core already provides Button component
```

**Fix**: Remove the local component and import from pace-core:
```typescript
import { Button } from '@jmruthers/pace-core';
```

#### no-inline-styles

**Severity**: Error

Disallows inline styles. Use pace-core components or Tailwind classes instead.

**Example Violation**:
```tsx
// ❌ Error
<div style={{ color: 'red', padding: '10px' }}>Content</div>

// ✅ Good
<div className="text-acc-500 p-4">Content</div>
// Or use pace-core components with built-in styling
```

### Component Rules

#### prefer-pace-core-form

**Severity**: Error

Disallows plain `<form>` tags and direct `react-hook-form` imports. Use pace-core `Form` component instead.

**Detected Patterns**:
- Plain `<form>` tags
- Direct imports from `react-hook-form` (except `useFormContext` when using pace-core `Form`)

**Example Violation**:
```tsx
// ❌ Error
import { useForm, FormProvider } from 'react-hook-form';
<form onSubmit={handleSubmit}>...</form>

// ✅ Good
import { Form, useZodForm } from '@jmruthers/pace-core';
<Form form={form} onSubmit={handleSubmit}>...</Form>
```

**Exception**: `useFormContext` is allowed when `Form` is imported from pace-core:
```tsx
// ✅ Allowed
import { Form } from '@jmruthers/pace-core';
import { useFormContext } from 'react-hook-form'; // OK when using pace-core Form
```

### RBAC Rules

#### no-direct-supabase-client

**Severity**: Error

Disallows direct `createClient()` calls from `@supabase/supabase-js`. Use `useSecureSupabase()` from pace-core instead.

**Why**: Direct client creation bypasses organisation context and RLS policies, leading to security vulnerabilities.

**Example Violation**:
```typescript
// ❌ Error
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, key);

// ✅ Good
import { useSecureSupabase } from '@jmruthers/pace-core/rbac';
const secureSupabase = useSecureSupabase();
```

**Exception**: Creating the base client for `UnifiedAuthProvider` in `main.tsx` or `App.tsx` is allowed.

#### rbac-permission-loading

**Severity**: Error

Requires `isLoading` extraction from `useResourcePermissions` and checking it before permission calls in mutations.

**Why**: Permission checks may fail if scope resolution is still in progress.

**Example Violation**:
```typescript
// ❌ Error
const { canCreate, canUpdate } = useResourcePermissions(RESOURCE_NAMES.EVENTS);
// Missing isLoading extraction

// In mutation:
if (canCreate(event)) { ... } // May fail if permissions still loading

// ✅ Good
const { canCreate, canUpdate, isLoading: permissionsLoading } = useResourcePermissions(RESOURCE_NAMES.EVENTS);

// In mutation:
if (permissionsLoading) {
  throw new Error('Permission check in progress. Please wait...');
}
if (!canCreate(event)) {
  throw new Error('Insufficient permissions');
}
```

#### no-direct-rbac-rpc

**Severity**: Error

Disallows direct RPC calls to RBAC functions (e.g., `rbac_check_permission_simplified`). Use pace-core RBAC hooks instead.

**Example Violation**:
```typescript
// ❌ Error
const { data } = await supabase.rpc('rbac_check_permission_simplified', {...});

// ✅ Good
import { isPermitted } from '@jmruthers/pace-core/rbac';
const hasPermission = await isPermitted({...});
```

#### no-direct-rbac-table

**Severity**: Error

Disallows direct queries to RBAC tables. Use `useSecureSupabase()` hook or pace-core RBAC API functions instead.

**RBAC Tables**:
- `rbac_organisation_roles`
- `rbac_event_app_roles`
- `rbac_global_roles`
- `rbac_apps`
- `rbac_app_pages`
- `rbac_page_permissions`
- `rbac_user_profiles`

**Example Violation**:
```typescript
// ❌ Error
const { data } = await supabase.from('rbac_organisation_roles').select('*');

// ✅ Good
import { useSecureSupabase } from '@jmruthers/pace-core/rbac';
const secureSupabase = useSecureSupabase();
const { data } = await secureSupabase.from('rbac_organisation_roles').select('*');
```

#### no-hardcoded-role-checks

**Severity**: Error

Disallows hardcoded role checks. Use `useAccessLevel` hook or `getRoleContext` API from pace-core instead.

**Example Violation**:
```typescript
// ❌ Error
if (user.role === 'admin') { ... }
if (currentRole === 'org_admin') { ... }

// ✅ Good
import { useAccessLevel } from '@jmruthers/pace-core/rbac';
const { accessLevel } = useAccessLevel();
if (accessLevel === 'admin') { ... }
```

#### rbac-use-resource-names-constants

**Severity**: Error

Requires `RESOURCE_NAMES` constants instead of string literals in `useResourcePermissions` calls.

**Example Violation**:
```typescript
// ❌ Error
const permissions = useResourcePermissions('organisations');

// ✅ Good
import { RESOURCE_NAMES } from '@/config/resource-names';
const permissions = useResourcePermissions(RESOURCE_NAMES.ORGANISATIONS);
```

#### no-rbac-wrapper-components

**Severity**: Error

Disallows wrapper components around `PagePermissionGuard`. Use `PagePermissionGuard` directly.

**Example Violation**:
```tsx
// ❌ Error
function ProtectedPage({ pageName, children }) {
  return <PagePermissionGuard pageName={pageName}>{children}</PagePermissionGuard>;
}

// ✅ Good
<PagePermissionGuard pageName="events" operation="read">
  <YourPageContent />
</PagePermissionGuard>
```

#### no-rbac-wrapper-functions

**Severity**: Error

Disallows wrapper functions around pace-core permission hooks. Use hooks directly in components.

**Example Violation**:
```typescript
// ❌ Error
function canEditEvent(eventId: string) {
  const { canUpdate } = useResourcePermissions(RESOURCE_NAMES.EVENTS);
  return canUpdate(eventId) && someOtherCondition;
}

// ✅ Good
function YourComponent() {
  const { canUpdate } = useResourcePermissions(RESOURCE_NAMES.EVENTS);
  // Use canUpdate directly in component logic
}
```

## Compliance validation

Compliance is validated by **ESLint** (during development) and the **pace-core Audit** step (when you run `npm run validate`).

**Run validation:** From the consuming app root (or repository root for pace-core development), run `npm run validate`. The pace-core audit report is written to `audit/<timestamp>-pace-core-audit.md`. For pace-core development, run `npm run validate` from the repository root; the audit runs against the current directory.

**What the Standard 5 audit checks:**

- Provider nesting order in `main.tsx` (QueryClientProvider → BrowserRouter → UnifiedAuthProvider → OrganisationProvider)
- Core styles import chain (app.css: tailwindcss, pace-core core.css, @source directives)
- RBAC setup (`setupRBAC()` called before rendering)
- Vite aliases (no aliases that bypass pace-core exports)
- Secure Supabase client location (`createClient()` only in main.tsx or lib/supabase.ts)
- Cursor rules present (`.cursor/rules/` with pace-core rules)
- ESLint config includes pace-core config

## Best Practices

### 1. Always Import from pace-core

```typescript
// ✅ Good
import { Button, Card, Dialog } from '@jmruthers/pace-core';
import { useToast, useDebounce } from '@jmruthers/pace-core';
import { formatDate, formatCurrency } from '@jmruthers/pace-core';
```

### 2. Use pace-core Components for UI

Avoid native HTML elements when pace-core provides a component:

```tsx
// ❌ Avoid
<button className="btn">Click</button>

// ✅ Use pace-core
<Button>Click</Button>
```

### 3. Leverage pace-core Hooks

Don't recreate hooks that pace-core already provides:

```typescript
// ❌ Avoid
const [debouncedValue, setDebouncedValue] = useState(value);
useEffect(() => {
  const timer = setTimeout(() => setDebouncedValue(value), 500);
  return () => clearTimeout(timer);
}, [value]);

// ✅ Use pace-core
import { useDebounce } from '@jmruthers/pace-core';
const debouncedValue = useDebounce(value, 500);
```

### 4. Use pace-core Utilities

Leverage formatting, validation, and other utilities from pace-core:

```typescript
// ❌ Avoid
const formatted = new Intl.DateTimeFormat('en-US').format(date);

// ✅ Use pace-core
import { formatDate } from '@jmruthers/pace-core';
const formatted = formatDate(date);
```

### 5. Check Before Creating New Components

Before creating a new component, check if pace-core already provides it:

1. Review the [pace-core documentation](https://github.com/your-org/pace-core)
2. Check `core-usage-manifest.json` for available components
3. Search pace-core exports

## MUST: Provider Nesting Order

**⚠️ CRITICAL: Provider nesting order matters!** Incorrect nesting causes React context errors.

**MUST** nest providers in this exact order (outermost to innermost):

1. `QueryClientProvider` (outermost)
2. `BrowserRouter`
3. `UnifiedAuthProvider`
4. `OrganisationProvider`
5. `App` (innermost)

```tsx
// ✅ CORRECT: main.tsx
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UnifiedAuthProvider, OrganisationProvider } from '@jmruthers/pace-core';
import { createClient } from '@supabase/supabase-js';

const queryClient = new QueryClient();
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <UnifiedAuthProvider supabaseClient={supabase} appName="YourApp">
        <OrganisationProvider>
          <App />
        </OrganisationProvider>
      </UnifiedAuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);
```

**Common mistakes to avoid:**
- ❌ `BrowserRouter` inside `UnifiedAuthProvider` (causes Router context errors)
- ❌ `UnifiedAuthProvider` wrapping `BrowserRouter` (causes context errors)
- ❌ Missing `BrowserRouter` (causes `useNavigate` errors)

## MUST: Auth routing

**MUST** protect routes with pace-core **ProtectedRoute**. Use a single public `/login` route and wrap all other routes in `<Route element={<ProtectedRoute />}>` (or `requireEvent={false}` variant for apps that do not require an event).

**MUST NOT** implement a global auth gate that wraps the entire route tree and redirects unauthenticated users to `/login` when `!isAuthenticated`. That pattern races with post-login context updates and can cause "login succeeds but redirect doesn't happen" or the login form to reset.

**SHOULD NOT** use React Router `BrowserRouter` `future` flags (e.g. `v7_startTransition`, `v7_relativeSplatPath`) unless login and logout have been verified with that configuration; use plain `<BrowserRouter>` by default.

See [Authentication implementation guide](../../implementation-guides/authentication.md#critical-auth-routing-pattern) for the full auth routing pattern and checklist.

## MUST: Vite Configuration

**⚠️ CRITICAL: Vite configuration prevents React context mismatches!**

**MUST** configure Vite to exclude `@jmruthers/pace-core` and `react-router-dom` from pre-bundling:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // CRITICAL: Dedupe React dependencies
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
    ],
    // CRITICAL: Exclude pace-core to prevent React context mismatches
    exclude: ['@jmruthers/pace-core', 'react-router-dom'],
  },
});
```

**Why this matters:**
- Pre-bundling `@jmruthers/pace-core` creates separate React instances
- This causes "useUnifiedAuth must be used within a UnifiedAuthProvider" errors
- Excluding it ensures pace-core uses the same React instance as your app
- `react-router-dom` must also be excluded and deduped to prevent Router context errors

**If you encounter context errors:**
1. Verify `@jmruthers/pace-core` is in `optimizeDeps.exclude`
2. Verify `react-router-dom` is in both `resolve.dedupe` and `optimizeDeps.exclude`
3. Clear Vite cache: `rm -rf node_modules/.vite`
4. Restart dev server

## MUST: Use Secure Supabase Client

**All database operations MUST use `useSecureSupabase()` (or the contract-approved pace-core secure client wrapper).**
Consuming apps **MUST NOT** use the base Supabase client directly for queries.

### Hard Requirements

- **MUST NOT** import or call `createClient()` from `@supabase/supabase-js` in consuming app code **except** for creating the base client passed to `UnifiedAuthProvider`.
- **MUST NOT** export, pass, or store an insecure Supabase client instance for general use.
- **MUST** perform all `.from(...)`, `.rpc(...)`, `.auth.*`, and storage operations via the secure client returned by `useSecureSupabase()` (or the approved pace-core equivalent).
- **MUST** create the base Supabase client ONCE and pass it to `UnifiedAuthProvider` as `supabaseClient` prop.
- **MUST** call `useSecureSupabase()` without parameters - it automatically uses the base client from `useUnifiedAuth()` provider layer.
- **MUST NOT** pass a base client directly to `useSecureSupabase()` - the hook gets it from the provider automatically.

### Why this is critical

Using `createClient()` directly for queries can bypass organisation context enforcement and RLS policies, leading to:
- Cross-organisation data access
- Security vulnerabilities
- Data leakage between organisations

### Correct Pattern

```tsx
// ✅ CORRECT: Create base client ONCE for UnifiedAuthProvider
// main.tsx or App.tsx
import { createClient } from '@supabase/supabase-js';
import { UnifiedAuthProvider } from '@jmruthers/pace-core';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

function App() {
  return (
    <UnifiedAuthProvider 
      supabaseClient={supabase}  // Pass base client to provider
      appName="YourApp"
      // ... other props
    >
      <YourApp />
    </UnifiedAuthProvider>
  );
}

// ✅ CORRECT: Use secure client in components (no parameters needed)
// YourComponent.tsx
import { useSecureSupabase } from '@jmruthers/pace-core/rbac';

function YourComponent() {
  const secureSupabase = useSecureSupabase(); // Gets client from provider automatically
  
  if (!secureSupabase) {
    return <div>Loading...</div>;
  }
  
  // Use secureSupabase for all queries
  const { data } = await secureSupabase.from('users').select('*');
}
```

### Incorrect Patterns

```tsx
// ❌ FORBIDDEN: Creating client in component or service
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, key); // Don't do this for queries

// ❌ FORBIDDEN: Passing base client to useSecureSupabase
import { useSecureSupabase } from '@jmruthers/pace-core/rbac';
import { supabase } from './supabase'; // Don't export base client
const secureSupabase = useSecureSupabase(supabase); // Don't pass it

// ❌ FORBIDDEN: Using base client directly for queries
const { data } = await supabase.from('users').select('*'); // Bypasses RLS
```

### Hook Signature

The `useSecureSupabase()` hook signature is:

```typescript
function useSecureSupabase(
  baseClient?: SupabaseClient<Database> | null
): SupabaseClient<Database> | null
```

**Important**: The `baseClient` parameter is **optional**. The hook automatically gets the base client from `useUnifiedAuth()` provider layer. You should **NOT** pass a base client parameter - call `useSecureSupabase()` without arguments.

### Acceptable Exceptions

**The ONLY acceptable uses of `createClient()` in consuming app code are:**

1. **Creating the base client for `UnifiedAuthProvider`** - This MUST be in one of these files:
   - `src/main.tsx` (or `main.jsx`)
   - `src/App.tsx` (or `App.jsx`)
   - `src/lib/supabase.ts` (or `supabase.js`) - ONLY if this file is ONLY used to create the base client for the provider

**The file containing the base client creation MUST:**
- Be clearly named (e.g., `supabase.ts`, `main.tsx`)
- Only create the client once
- Pass it directly to `UnifiedAuthProvider` (not export it for general use)
- Include a comment explaining it's the base client for the provider:
  ```tsx
  // Base Supabase client for UnifiedAuthProvider only
  // DO NOT use this client directly - use useSecureSupabase() instead
  const supabase = createClient(...);
  ```

2. **PublicPageProvider (pace-core)** - `PublicPageProvider` may create a client for unauthenticated public pages only; that client must not be used for authenticated or organisation-scoped data.

**NO OTHER EXCEPTIONS ARE PERMITTED** - All other uses of `createClient()` are security violations and MUST be fixed.

### Detection / Audit Tool

The pace-core Audit step (run via `npm run validate`) performs comprehensive system-level analysis organized by standards:

- **Standard 1 (Project Structure)**: Directory structure, config files, import paths, test colocation, Supabase structure
- **Standard 2 (Architecture)**: Component boundaries, ApiResult usage
- **Standard 3 (Security & RBAC)**: RLS policies, PagePermissionGuard coverage, Edge Functions RBAC
- **Standard 4 (API & Tech Stack)**: RPC naming in SQL, tech stack versions, Vite config
- **Standard 5 (pace-core Compliance)**: Provider nesting, core styles import, RBAC setup, Vite aliases, secure Supabase client location, **auth routing (no global auth gate)**, Cursor rules, ESLint config
- **Standard 6 (Code Quality)**: TypeScript config, test coverage config
- **Standard 7 (Styling)**: app.css structure, Tailwind v4 config
- **Standard 8 (Testing & Documentation)**: Test timeout config, testing tools, test structure
- **Standard 9 (Operations)**: Error handling patterns, CI/CD config, error boundaries

**Reference**: See [packages/core/audit-tool/](../../packages/core/audit-tool/) for audit tool implementation.

### How each layer enforces this standard

- **Standards (this doc):** Source of truth; defines MUST/SHOULD and exceptions.
- **Cursor rule:** `05-pace-core-compliance.mdc` — AI guidance when editing `src/**/*.{ts,tsx,js,jsx}`; points to this doc and ESLint.
- **ESLint:** Rules in `01-pace-core-compliance.cjs` (plugin prefix `pace-core-compliance/`): prefer-pace-core-components, prefer-pace-core-hooks, prefer-pace-core-utils, no-local-component-duplication, no-inline-styles, prefer-pace-core-form; plus no-restricted-imports and RBAC rules from Standard 3. Run via lint step in CI and locally.
- **Audit tool:** Standard 5 audit runs as part of `npm run validate`; checks provider nesting, core styles import, RBAC setup, Vite aliases, secure Supabase client location, **auth routing pattern (flags files that redirect to `/login` when `!isAuthenticated`, which indicates a global auth gate)**, Cursor rules presence, ESLint config. Report: `audit/<timestamp>-pace-core-audit.md`. ESLint does not currently enforce auth routing; use the audit and the [Authentication implementation guide](../../implementation-guides/authentication.md#critical-auth-routing-pattern) to avoid the global auth gate pattern.

### Audit issue types and where to read

| Audit issue type | See section in this doc |
|------------------|--------------------------|
| providerNesting | MUST: Provider Nesting Order |
| coreStyles | (Styling standard) / app.css |
| rbacSetup | MUST: Setup RBAC Before Use (Cursor rule); Detection / Audit Tool |
| viteAlias | MUST: Vite Configuration |
| supabaseClient | MUST: Use Secure Supabase Client |
| authRouting | MUST: Auth routing (no global auth gate); [Authentication guide](../../implementation-guides/authentication.md#critical-auth-routing-pattern) |
| cursorRules | Step 3: Setup Cursor Rules |
| eslintConfig | Step 2: Setup ESLint |

### Detection / Audit (Legacy)

- `rg "createClient\(" src` must return **exactly ONE match** in the file that creates the base client for `UnifiedAuthProvider`.
- That file MUST be one of: `main.tsx`, `App.tsx`, or `lib/supabase.ts` (or `.jsx`/`.js` equivalents).
- No `.from(` / `.rpc(` calls may be performed on an insecure client reference.
- All `useSecureSupabase()` calls should be without parameters.

## Compliance Exceptions

**In general, pace-core compliance rules do NOT allow exceptions.** The rules are designed to ensure security, consistency, and maintainability across the PACE suite.

### When Exceptions Are NOT Allowed

- **Security rules** (e.g., `createClient()` usage) - NO exceptions except the one documented above
- **RBAC rules** - NO exceptions
- **Component usage** - NO exceptions (use pace-core components)
- **Hook usage** - NO exceptions (use pace-core hooks)

### Documenting Legitimate Edge Cases

If you encounter a situation where a rule seems to conflict with a legitimate requirement:

1. **First**: Verify that pace-core doesn't provide a solution
2. **Second**: Check if the requirement should be added to pace-core
3. **Third**: If truly unavoidable, document the case clearly:
   - Add a comment explaining why the exception is necessary
   - Include a reference to this standard
   - Consider opening an issue to add the missing functionality to pace-core

**Example of proper documentation:**
```tsx
// @pace-core-compliance-exception: Legacy integration requires direct Supabase client
// Reason: Third-party service requires unauthenticated client for initial handshake
// Migration plan: Migrate to useSecureSupabase() when legacy system is updated (Q2 2025)
// Tracking issue: https://github.com/your-org/pace-core/issues/123
// Expected removal date: Q2 2025
const legacyClient = createClient(...);
```

**Note**: Even with documentation, exceptions should be:
- Temporary (with a plan to remove them)
- Rare (only when absolutely necessary)
- Reviewed and approved by the team
- Tracked for eventual removal

### Audit Handling of Exceptions

During audits, documented exceptions will be:
- **Verified** - Confirmed that the exception is legitimate and properly documented
- **Categorized** - Marked as "Acceptable Exception" if valid, or flagged for remediation if not
- **Tracked** - Included in the audit report with a recommendation to remove when possible

**Invalid exceptions** (undocumented, unnecessary, or security-related) will be flagged as violations requiring remediation.

Documented exceptions are not yet detected automatically by the audit tool; they are tracked manually or via review. Future versions may report them as informational.

## Troubleshooting

### ESLint Setup Issues

**Error: "Could not find 'no-restricted-imports' in plugin 'pace-core-compliance'"**
- **Cause**: This rule was removed from the plugin (it's now handled by standard ESLint `no-restricted-imports`)
- **Fix**: Update to the latest version of `@jmruthers/pace-core` and run `npm run setup -- --force`

**Error: "TypeError: Unexpected array" when using `tseslint.config()`**
- **Cause**: Incorrect spreading of `paceCoreConfig` in `tseslint.config()` wrapper
- **Fix**: Run `npm run setup -- --force` to fix the config structure, or manually ensure `paceCoreConfig` is spread correctly:
  ```javascript
  import paceCoreConfig from '@jmruthers/pace-core/eslint-config';
  
  export default tseslint.config(
    ...paceCoreConfig,  // Spread here, not nested
    // your other config
  );
  ```

**ESLint rules not loading**
- **Cause**: Path resolution issues or rules not copied to `dist/`
- **Fix**: 
  1. Ensure `@jmruthers/pace-core` is built: `npm run build` in pace-core
  2. Check that `node_modules/@jmruthers/pace-core/dist/eslint-rules/` exists
  3. Run `npm run setup -- --force` to regenerate config

### ESLint Rules Not Working

1. **Verify plugin is loaded**: Check that the config is imported correctly
2. **Check rule names**: Rules must be prefixed with `pace-core-compliance/`
3. **Verify manifest exists**: Rules load from `core-usage-manifest.json` in the pace-core package
4. **CommonJS/ES Module issues**: If you're using ES modules and rules aren't loading, ensure you're using the config preset which handles this automatically
5. **Verify rules are available**: Check that the rules file exists
6. **Check rule count**: Verify all rules are loaded

### False Positives

If you encounter false positives:

1. **Component name conflicts**: If you have a legitimate reason to create a local component with a pace-core name, consider:
   - Renaming your component
   - Using a namespace/prefix
   - Documenting why pace-core doesn't meet your needs

2. **Hook/Util patterns**: The pattern matching may flag similar names. Review the suggestion and decide if migration makes sense.

## Verification

After setting up the ESLint config, verify it's working:

1. **Check ESLint can load the config**:
   ```bash
   npx eslint --print-config src/App.tsx
   ```
   Look for `pace-core-compliance` in the plugins section.

2. **Test with a violation**: Create a test file that imports a restricted library:
   ```typescript
   // test-violation.ts
   import { Dialog } from '@radix-ui/react-dialog'; // Should trigger error
   ```
   Run ESLint and verify it reports the violation.

3. **Run full validation**: Run `npm run validate` and review `audit/<timestamp>-pace-core-audit.md` for Standard 5 issues.

## Related Documentation

- [Standards Overview](./0-standards-overview.md) - Standards system overview
- [Project Structure](./1-project-structure-standards.md) - Project structure and organization
- [Security & RBAC](./3-security-rbac-standards.md) - RBAC and security standards
- [API & Tech Stack](./4-api-tech-stack-standards.md) - API and tech stack standards

---

**Last Updated:** 2025-01-28  
**Version:** 2.0.0  
**Applies to:** All consuming apps using `@jmruthers/pace-core`

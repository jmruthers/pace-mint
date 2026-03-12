# API & Tech Stack Standards

**🤖 Cursor Rule**: See [04-api-tech-stack.mdc](../cursor-rules/04-api-tech-stack.mdc) for AI-optimized directives that automatically enforce tech stack compliance.

**🔧 ESLint Rules**: See [07-api-tech-stack.cjs](../../packages/core/eslint-rules/rules/07-api-tech-stack.cjs) for mechanically checkable API and tech stack rules.

## Purpose

This standard defines the required technology stack, API design patterns, and RPC conventions to ensure consistency, type safety, and maintainability across pace-core and consuming apps.

---

## How each layer enforces this standard

- **Standards (this doc):** Source of truth; defines required tech stack (React 19+, TypeScript, Vite, Tailwind v4, Supabase, TanStack Query, etc.), API/RPC naming (`data_*` / `app_*`), ApiResult shape, RPC rules, Vite/TypeScript config, and deprecation policy.
- **Cursor rule:** `04-api-tech-stack.mdc` — AI guidance when editing `src/**`, config files, and `supabase/migrations/**/*.sql`; points to this doc.
- **ESLint:** Rules in `07-api-tech-stack.cjs` (plugin prefix `pace-core-compliance/`): see ESLint Rules section below. Run via lint step in CI and locally.
- **Audit tool:** Standard 4 audit runs as part of `npm run validate`; checks RPC naming in SQL migrations, tech stack versions (package.json), and Vite configuration (optimizeDeps.exclude, resolve.dedupe). Report: `audit/<timestamp>-pace-core-audit.md`. For pace-core development, run `npm run validate` from the repository root.

---

## Audit issue types and where to read

| Audit issue type | See section in this doc |
|------------------|--------------------------|
| rpcNaming | API & RPC Naming Conventions; RPC Naming Pattern; Naming Rules |
| techStack | Required Tech Stack; Version Requirements |
| viteConfig | Tech Stack Configuration (Vite Configuration) |

---

## Required Tech Stack

### Core Technologies

**MUST** use these technologies at **minimum** the versions below. Later versions within the same major (or as noted) are supported.

- **React 19+** - Functional components only, no class components
- **TypeScript 5+** - With `strict` mode enabled
- **Vite 5+** (recommend Vite 7+) - For tooling; use `import.meta.env` for environment variables
- **Tailwind v4** - CSS-first with `app.css` scaffold (see [Styling Standards](./7-styling-standards.md))
- **Supabase** - Via secure clients/hooks (`useSecureSupabase`); never bypass RLS
- **TanStack Query 5+** - For server state management
- **React Hook Form 7+** - For forms; prefer `useZodForm` from pace-core when using Zod
- **Zod 4+** - Schema validation (forms, API boundaries)
- **React Compiler** - Use `babel-plugin-react-compiler` for automatic memoization; see [React Compiler](#react-compiler) below.

### Minimum version requirements

Use at least these versions; later versions are supported unless a major upgrade introduces a breaking change that pace-core has not yet adopted.

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.0.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "babel-plugin-react-compiler": "^1.0.0"
  }
}
```

### React Compiler

**SHOULD** enable the React Compiler in the shell and in consuming apps so that automatic memoization applies (see [Code Quality Standard](./6-code-quality-standards.md) – memoization section). This is the only supported optimization approach; when enabled, you must not add manual `useMemo`/`useCallback`/`React.memo` for general cases—write straightforward code and let the compiler optimize.

1. **Install** (if not already present):
   ```bash
   npm install -D babel-plugin-react-compiler
   ```

2. **Configure Vite** – pass the compiler into the React plugin:
   ```typescript
   // vite.config.ts
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';

   export default defineConfig({
     plugins: [
       react({
         babel: {
           plugins: ['babel-plugin-react-compiler'],
         },
       }),
       // ... other plugins (e.g. tailwindcss)
     ],
   });
   ```

3. **Tests** – MAY add the same Babel plugin to the Vitest config so tests run with the compiler and component code is compiled consistently.

The pace-core repo uses this setup in its root `vite.config.ts` and `vitest.config.ts`; the shell and consuming apps should mirror it.

### Environment Variables

**MUST** use `import.meta.env` (Vite) for environment variables:

```typescript
// ✅ CORRECT - Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// ❌ WRONG - Node.js process.env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
```

---

## API & RPC Naming Conventions

### RPC Naming Pattern

**MUST** follow this naming pattern: `<family>_<domain>_<verb>`

- **Family**: `data` (read operations), `app` (write operations)
- **Domain**: Feature/domain name (e.g., `events`, `users`, `cake_dish`)
- **Verb**: Operation name (e.g., `list`, `get`, `create`, `update`, `delete`)

**Examples:**
```typescript
// Read operations (data_*)
data_events_list
data_events_get
data_users_list
data_cake_dish_list

// Write operations (app_*)
app_events_create
app_events_update
app_events_delete
app_cake_dish_create

// Bulk operations (use _bulk_ prefix)
app_events_bulk_create
app_cake_dish_bulk_update
```

### Naming Rules

1. **Use snake_case** for all RPC names
2. **Read operations** start with `data_`
3. **Write operations** start with `app_`
4. **Bulk operations** use `_bulk_` prefix (e.g., `app_events_bulk_create`)
5. **Domain names** should match table names where applicable
6. **Verb names** should be clear and consistent (`list`, `get`, `create`, `update`, `delete`)

---

## API Result Shape

### Standard Result Type

**MUST** use this result type for all APIs:

```typescript
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

type ApiError = {
  code: string;        // Machine-readable error code
  message: string;     // User-friendly message
  details?: object;    // Optional additional context (non-sensitive)
};
```

### Example Usage

```typescript
// ✅ CORRECT - Using ApiResult type
async function fetchEvent(id: string): Promise<ApiResult<Event>> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      return {
        ok: false,
        error: {
          code: 'EVENT_NOT_FOUND',
          message: 'Event not found',
          details: { eventId: id },
        },
      };
    }
    
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
}

// Usage
const result = await fetchEvent(eventId);
if (result.ok) {
  // TypeScript knows result.data exists
  console.log(result.data.name);
} else {
  // TypeScript knows result.error exists
  toast.error(result.error.message);
}
```

### RPC Result Shape

**RPCs MUST** return data in a format that can be wrapped in `ApiResult`:

```sql
-- ✅ CORRECT - RPC returns data directly
CREATE OR REPLACE FUNCTION data_events_list(
  p_organisation_id UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  date TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.name, e.date
  FROM events e
  WHERE e.organisation_id = p_organisation_id;
END;
$$;
```

**Client-side wrapper:**
```typescript
async function listEvents(organisationId: string): Promise<ApiResult<Event[]>> {
  const { data, error } = await supabase.rpc('data_events_list', {
    p_organisation_id: organisationId,
  });
  
  if (error) {
    return {
      ok: false,
      error: {
        code: 'LIST_FAILED',
        message: 'Failed to list events',
        details: { error: error.message },
      },
    };
  }
  
  return { ok: true, data: data ?? [] };
}
```

---

## RPC Rules

### Read RPCs Never Mutate

**Read operations MUST NOT have side effects.**

```sql
-- ❌ WRONG - Read operation with side effect
CREATE OR REPLACE FUNCTION data_events_get(p_event_id UUID)
RETURNS TABLE (...)
AS $$
BEGIN
  -- Side effect: updates last_accessed
  UPDATE events SET last_accessed = NOW() WHERE id = p_event_id;
  RETURN QUERY SELECT * FROM events WHERE id = p_event_id;
END;
$$;

-- ✅ CORRECT - Pure read operation
CREATE OR REPLACE FUNCTION data_events_get(p_event_id UUID)
RETURNS TABLE (...)
LANGUAGE plpgsql
STABLE  -- ✅ STABLE for read operations
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM events WHERE id = p_event_id;
END;
$$;
```

### Write RPCs Should Be Idempotent

**Write operations SHOULD be idempotent when possible.**

```sql
-- ✅ CORRECT - Idempotent upsert
CREATE OR REPLACE FUNCTION app_events_upsert(
  p_id UUID,
  p_name TEXT,
  p_date TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO events (id, name, date, organisation_id)
  VALUES (p_id, p_name, p_date, get_organisation_context())
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, date = EXCLUDED.date
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;
```

### Never Accept Dynamic SQL

**NEVER accept SQL strings as parameters. Use parameterized queries or RPCs.**

```sql
-- ❌ WRONG - Dynamic SQL injection risk
CREATE OR REPLACE FUNCTION execute_query(p_sql TEXT)
RETURNS TABLE (...)
AS $$
BEGIN
  RETURN QUERY EXECUTE p_sql;  -- DANGEROUS!
END;
$$;

-- ✅ CORRECT - Parameterized query
CREATE OR REPLACE FUNCTION data_events_list(
  p_organisation_id UUID,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (...)
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM events
  WHERE organisation_id = p_organisation_id
    AND (p_status IS NULL OR status = p_status)
  LIMIT p_limit;
END;
$$;
```

### Enforce RLS + Tenant Boundaries

**RPCs MUST enforce RLS and tenant boundaries. Never bypass security checks.**

```sql
-- ✅ CORRECT - RLS enforced via helper functions
CREATE OR REPLACE FUNCTION data_events_list(p_organisation_id UUID)
RETURNS TABLE (...)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER          -- ✅ Required: queries RLS-protected tables or needs elevated privileges
SET search_path TO public -- ✅ MANDATORY: prevents search path hijacking
AS $$
BEGIN
  -- Check organisation access
  IF NOT check_user_organisation_access(p_organisation_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- ✅ Schema-qualified reference
  RETURN QUERY
  SELECT * FROM public.events
  WHERE organisation_id = p_organisation_id;
END;
$$;

-- ✅ Document why SECURITY DEFINER is needed
COMMENT ON FUNCTION data_events_list(UUID) IS 
  'Lists events for an organisation. SECURITY DEFINER required because function queries RLS-protected tables via check_user_organisation_access(). STABLE for read operation performance. SET search_path TO public prevents search path hijacking.';
```

### SECURITY DEFINER Security Requirements for RPC Functions

**RPC functions that use SECURITY DEFINER MUST follow these security requirements:**

| Requirement | Why | Example |
|------------|-----|---------|
| `SET search_path TO public` | **MANDATORY** - Prevents search path hijacking attacks | `SET search_path TO public` |
| Schema-qualify references | **MANDATORY** - Ensures objects resolve to correct schemas | `public.events` not `events` |
| `STABLE` for read operations | **REQUIRED** - Helps with query optimization | `STABLE` |
| Document rationale | **REQUIRED** - COMMENT must explain why SECURITY DEFINER is needed | See COMMENT example above |
| Least-privilege ownership | **MANDATORY** - Functions MUST be owned by appropriate roles | Not superuser unless necessary |

**When SECURITY DEFINER is needed for RPC functions:**
- Function queries RLS-protected tables (e.g., `rbac_organisation_roles`, `rbac_global_roles`)
- Function needs to bypass RLS to avoid circular dependencies
- Function performs administrative operations requiring elevated privileges

**Security Checklist for RPC Functions with SECURITY DEFINER:**
- [ ] `SET search_path TO public` is present (MANDATORY)
- [ ] All table/function references are schema-qualified (e.g., `public.table_name`)
- [ ] Function is marked `STABLE` for read operations
- [ ] Function ownership uses least-privilege role (not superuser unless necessary)
- [ ] COMMENT documents why SECURITY DEFINER is needed

**Example with all security requirements:**

```sql
-- ✅ CORRECT: All security requirements met
CREATE OR REPLACE FUNCTION data_events_list(p_organisation_id UUID)
RETURNS TABLE (id UUID, name TEXT, date TIMESTAMPTZ)
LANGUAGE plpgsql
STABLE                    -- ✅ Performance optimization
SECURITY DEFINER          -- ✅ Required: queries RLS-protected tables
SET search_path TO public -- ✅ MANDATORY: prevents search path hijacking
AS $$
BEGIN
  -- ✅ Schema-qualified reference
  IF NOT public.check_user_organisation_access(p_organisation_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- ✅ Schema-qualified reference
  RETURN QUERY
  SELECT e.id, e.name, e.date
  FROM public.events e
  WHERE e.organisation_id = p_organisation_id;
END;
$$;

-- ✅ Document why SECURITY DEFINER is needed
COMMENT ON FUNCTION data_events_list(UUID) IS 
  'Lists events for an organisation. SECURITY DEFINER required because function queries public.rbac_organisation_roles (via check_user_organisation_access) which has RLS policies. Without SECURITY DEFINER, this would create circular RLS dependency. STABLE for read operation performance. SET search_path TO public prevents search path hijacking.';
```

**Security Anti-Patterns:**

```sql
-- ❌ BAD: Missing SET search_path (security risk)
CREATE OR REPLACE FUNCTION bad_rpc()
RETURNS TABLE (...)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER  -- Missing SET search_path TO public!
AS $$
BEGIN
  RETURN QUERY SELECT * FROM events;
END;
$$;

-- ❌ BAD: Unqualified reference (security risk)
CREATE OR REPLACE FUNCTION bad_rpc()
RETURNS TABLE (...)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  RETURN QUERY SELECT * FROM events;  -- Should be public.events
END;
$$;
```

**Real-World Example: Complex RPC with Multiple Security Checks**

```sql
-- Real-world example: Creating an event with attendees and permissions
CREATE OR REPLACE FUNCTION app_events_create_with_attendees(
  p_name TEXT,
  p_date TIMESTAMPTZ,
  p_organisation_id UUID,
  p_attendee_ids UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_event_id UUID;
  v_user_id UUID;
  v_has_permission BOOLEAN;
BEGIN
  -- 1. Get current user ID
  v_user_id := safe_get_user_id_for_rls();
  
  -- 2. Check organisation access
  IF NOT check_user_organisation_access(p_organisation_id) THEN
    RAISE EXCEPTION 'You do not have access to this organisation';
  END IF;
  
  -- 3. Check create permission using RBAC
  v_has_permission := check_rbac_permission_with_context(
    'create:page.events',
    'events',
    p_organisation_id,
    NULL,
    get_app_id('PACE')
  );
  
  IF NOT v_has_permission THEN
    RAISE EXCEPTION 'You do not have permission to create events';
  END IF;
  
  -- 4. Validate attendee IDs belong to the same organisation
  IF array_length(p_attendee_ids, 1) > 0 THEN
    IF EXISTS (
      SELECT 1 FROM users
      WHERE id = ANY(p_attendee_ids)
      AND organisation_id != p_organisation_id
    ) THEN
      RAISE EXCEPTION 'All attendees must belong to the same organisation';
    END IF;
  END IF;
  
  -- 5. Create event
  INSERT INTO events (name, date, organisation_id, created_by)
  VALUES (p_name, p_date, p_organisation_id, v_user_id)
  RETURNING id INTO v_event_id;
  
  -- 6. Create attendee records
  IF array_length(p_attendee_ids, 1) > 0 THEN
    INSERT INTO event_attendees (event_id, user_id, organisation_id)
    SELECT v_event_id, unnest(p_attendee_ids), p_organisation_id;
  END IF;
  
  RETURN v_event_id;
END;
$$;

-- Usage in TypeScript
async function createEventWithAttendees(
  name: string,
  date: Date,
  organisationId: string,
  attendeeIds: string[]
): Promise<ApiResult<{ eventId: string }>> {
  const { data, error } = await secureSupabase.rpc('app_events_create_with_attendees', {
    p_name: name,
    p_date: date.toISOString(),
    p_organisation_id: organisationId,
    p_attendee_ids: attendeeIds,
  });
  
  if (error) {
    // Map database errors to user-friendly messages
    if (error.message.includes('access to this organisation')) {
      return {
        ok: false,
        error: {
          code: 'ORGANISATION_ACCESS_DENIED',
          message: 'You do not have access to this organisation',
        },
      };
    }
    if (error.message.includes('permission to create events')) {
      return {
        ok: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to create events',
        },
      };
    }
    if (error.message.includes('same organisation')) {
      return {
        ok: false,
        error: {
          code: 'INVALID_ATTENDEES',
          message: 'All attendees must belong to the same organisation',
        },
      };
    }
    
    return {
      ok: false,
      error: {
        code: 'CREATE_FAILED',
        message: 'Unable to create event. Please try again.',
      },
    };
  }
  
  return { ok: true, data: { eventId: data } };
}
```

### User-Safe Error Messages

**Errors MUST be user-friendly and not expose internal details.**

```sql
-- ❌ WRONG - Exposes internal details
CREATE OR REPLACE FUNCTION app_events_create(...)
AS $$
BEGIN
  IF some_condition THEN
    RAISE EXCEPTION 'SQLSTATE[23000]: Integrity constraint violation: duplicate key';
  END IF;
END;
$$;

-- ✅ CORRECT - User-friendly error
CREATE OR REPLACE FUNCTION app_events_create(...)
AS $$
BEGIN
  IF some_condition THEN
    RAISE EXCEPTION 'An event with this name already exists';
  END IF;
END;
$$;
```

---

## Deprecation Policy

### Deprecation Process

**When deprecating APIs or RPCs:**

1. **Mark with `@deprecated`** JSDoc comment
2. **Add migration notes** in documentation
3. **Retirement window** = 2 stable releases
4. **Remove after retirement window** expires

### Example Deprecation

```typescript
/**
 * @deprecated Use `data_events_list` instead. This function will be removed in v2.0.0.
 * 
 * Migration:
 * ```typescript
 * // Old
 * const events = await getEvents(orgId);
 * 
 * // New
 * const result = await listEvents(orgId);
 * if (result.ok) {
 *   const events = result.data;
 * }
 * ```
 */
async function getEvents(organisationId: string): Promise<Event[]> {
  // Implementation
}
```

---

## Tech Stack Configuration

### TypeScript Configuration

**MUST** enable strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### Vite Configuration

**MUST** configure path aliases, React plugin, and dependency optimization:

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
    // CRITICAL: Dedupe React dependencies to prevent context mismatches
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
    ],
    // CRITICAL: Exclude pace-core and react-router-dom to prevent React context mismatches
    exclude: ['@jmruthers/pace-core', 'react-router-dom'],
  },
  envPrefix: 'VITE_', // Only expose VITE_* env vars
});
```

**Why this configuration is required:**
- Pre-bundling `@jmruthers/pace-core` creates separate React instances, causing "useUnifiedAuth must be used within a UnifiedAuthProvider" errors
- Excluding it ensures pace-core uses the same React instance as your app
- `react-router-dom` must also be excluded and deduped to prevent Router context errors

**If you encounter context errors:**
1. Verify `@jmruthers/pace-core` is in `optimizeDeps.exclude`
2. Verify `react-router-dom` is in both `resolve.dedupe` and `optimizeDeps.exclude`
3. Clear Vite cache: `rm -rf node_modules/.vite`
4. Restart dev server

### TanStack Query Configuration

**MUST** configure appropriate cache times:

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes
      gcTime: 10 * 60 * 1000,       // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## API Design Checklist

Before creating or updating an API/RPC, verify:

- [ ] RPC name follows naming convention (`data_*` or `app_*`)
- [ ] Uses `ApiResult<T>` type for return values
- [ ] Read RPCs are `STABLE` and have no side effects
- [ ] Write RPCs are idempotent when possible
- [ ] No dynamic SQL accepted as parameters
- [ ] RLS and tenant boundaries enforced
- [ ] Error messages are user-friendly
- [ ] TypeScript types are complete and accurate
- [ ] Deprecation process followed if removing/changing APIs

---

## ESLint Rules

Rule IDs use the plugin prefix **`pace-core-compliance/`**. The following rules enforce API and tech stack standards:

- **`pace-core-compliance/rpc-naming-pattern`** — Enforces `data_*` prefix for read operations and `app_*` prefix for write operations.
- **`pace-core-compliance/no-class-components`** — Disallows React class components (functional components only).
- **`pace-core-compliance/prefer-import-meta-env`** — Enforces `import.meta.env` (Vite) instead of `process.env` in client code.

These rules are part of the `pace-core-compliance` plugin and are enabled when extending `@jmruthers/pace-core/eslint-config`.

**Setup**: Run `npm run setup` to configure ESLint (and other pace-core tools) in your consuming app.

## Related Documentation

- [Standards Overview](./0-standards-overview.md) - Standards system overview
- [Architecture](./2-architecture-standards.md) - API design principles
- [Code Quality](./6-code-quality-standards.md) - TypeScript standards
- [Security & RBAC](./3-security-rbac-standards.md) - RLS and security requirements
- [Operations](./9-operations-standards.md) - Error handling patterns

---

**Last Updated:** 2025-01-28  
**Version:** 2.0.0  
**Applies to:** All pace-core and consuming apps

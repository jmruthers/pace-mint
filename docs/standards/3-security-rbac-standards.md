# Security & RBAC Standards

**🤖 Cursor Rule**: See [03-security-rbac.mdc](../cursor-rules/03-security-rbac.mdc) for AI-optimized directives that automatically enforce RBAC contract compliance (ESLint-enforced).

**🔧 ESLint Rules**: See [06-security-rbac.cjs](../../packages/core/eslint-rules/rules/06-security-rbac.cjs) for mechanically checkable security and RBAC rules.

## Purpose

Define standards for Row-Level Security (RLS) policies and Role-Based Access Control (RBAC) integration to ensure security, performance, and maintainability.

**Note:** General performance optimization patterns (React, caching, bundle size) are covered in [Operations Standards](./9-operations-standards.md). This document focuses on RLS-specific performance requirements.

---

## How each layer enforces this standard

- **Standards (this doc):** Source of truth; defines RLS policy patterns, helper function requirements (STABLE, SECURITY DEFINER, SET search_path), forbidden/required patterns, Edge Function RBAC (isPermitted/setupRBAC), and security baseline.
- **Cursor rule:** `06-security-rbac.mdc` — AI guidance when editing `src/**/*.{ts,tsx,js,jsx}` and `supabase/migrations/**/*.sql`; points to this doc and RBAC contract.
- **ESLint:** Rules in `06-security-rbac.cjs` (plugin prefix `pace-core-compliance/`): see ESLint Rules section below. Run via lint step in CI and locally.
- **Audit tool:** Standard 3 audit runs as part of `npm run validate`; checks RLS policies in SQL migrations (naming, inline auth, subqueries, helper attributes, SECURITY DEFINER/search_path/schema-qualify/COMMENT), PagePermissionGuard coverage, and Edge Functions RBAC (setupRBAC before isPermitted). Report: `audit/<timestamp>-pace-core-audit.md`. For pace-core development, run `npm run validate` from the repository root.

---

## Audit issue types and where to read

| Audit issue type | See section in this doc |
|------------------|--------------------------|
| rlsPolicy | RLS Policy Performance Requirements; Helper Function Requirements; Forbidden/Required Patterns; SECURITY DEFINER Requirements; Security Risks & Mitigations; Policy Naming Convention; RLS Policy Patterns |
| rbacPageGuard | Security Baseline (page protection) |
| organisationIdResolution | Organisation context resolution (consuming apps) |
| edgeFunctionRBAC | Edge Functions and Serverless Functions |

---

## Principles

- **Performance First**: All RLS policies must use optimized helper functions
- **Security by Default**: Deny access unless explicitly allowed
- **Consistent Patterns**: Use standardized helper functions across all policies
- **Performance Monitoring**: Regular validation of query performance

## RLS Policy Performance Requirements

### Helper Function Requirements

All helper functions used in RLS policies **MUST** have these attributes:

| Requirement | Why | Example |
|------------|-----|---------|
| `STABLE` | Prevents re-evaluation for each row | `STABLE` |
| `SECURITY DEFINER` | Bypass RLS to avoid circular dependencies when querying RLS-protected tables | `SECURITY DEFINER` |
| `SET search_path TO 'public'` | **MANDATORY** - Prevents search path hijacking attacks | `SET search_path TO public` |
| No inline `auth.uid()` | Causes InitPlan nodes, severe performance degradation | Use helper function instead |

### Helper Function Template

```sql
CREATE OR REPLACE FUNCTION function_name(parameters)
RETURNS return_type
LANGUAGE plpgsql
STABLE                    -- ✅ Required for performance
SECURITY DEFINER          -- ✅ Required if querying RLS-protected tables
SET search_path TO public -- ✅ MANDATORY - Prevents search path hijacking
AS $$
DECLARE
  -- Declarations
BEGIN
  -- Function body
  -- Always schema-qualify table/function references (e.g., public.table_name)
  RETURN result;
END;
$$;

-- ✅ Document why SECURITY DEFINER is needed
COMMENT ON FUNCTION function_name(parameters) IS 
  'Purpose description. SECURITY DEFINER required because this function queries rbac_organisation_roles which has RLS policies. STABLE for RLS policy performance.';
```

**Security Checklist:**
- [ ] `SET search_path TO public` is present (MANDATORY)
- [ ] All table/function references are schema-qualified (e.g., `public.table_name`)
- [ ] Function is marked `STABLE` or `IMMUTABLE` when possible
- [ ] Function ownership uses least-privilege role (not superuser unless necessary)
- [ ] COMMENT documents why SECURITY DEFINER is needed

> **Trigger functions** follow the same `SET search_path TO public` and `COMMENT ON FUNCTION` requirements as RLS helpers, but use `VOLATILE` instead of `STABLE` (required by PostgreSQL for trigger functions). See [API & Tech Stack Standards -- Trigger Function Standards](./4-api-tech-stack-standards.md#trigger-function-standards) for the full trigger-specific requirements.

### Forbidden Patterns

**❌ NEVER use these patterns in RLS policies:**

```sql
-- ❌ BAD: Inline auth.uid() call
CREATE POLICY "bad_policy" ON table_name
FOR SELECT USING (
  user_id = auth.uid()  -- Called for every row!
);

-- ❌ BAD: Subquery in policy
CREATE POLICY "bad_policy" ON table_name
FOR SELECT USING (
  organisation_id IN (
    SELECT organisation_id FROM rbac_organisation_roles 
    WHERE user_id = auth.uid()  -- Executes for every row!
  )
);

-- ❌ BAD: current_setting in policy
CREATE POLICY "bad_policy" ON table_name
FOR SELECT USING (
  organisation_id = current_setting('app.organisation_id')::UUID  -- Called for every row!
);
```

### Required Patterns

**✅ ALWAYS use these patterns:**

```sql
-- ✅ GOOD: Use helper function
CREATE POLICY "good_policy" ON table_name
FOR SELECT USING (
  check_user_organisation_access(organisation_id)  -- Single function call per row
);

-- ✅ GOOD: Use helper function for app ID
CREATE POLICY "good_policy" ON table_name
FOR SELECT USING (
  rbac_check_permission_simplified(
    auth.uid(),
    'read:page.table_name',
    organisation_id,
    event_id,
    get_app_id('APP_NAME'),  -- ✅ Helper function
    'table_name'
  )
);
```

## SECURITY DEFINER Requirements & Security

### When SECURITY DEFINER is Necessary

**SECURITY DEFINER is REQUIRED when:**
- Helper function queries tables with RLS policies (e.g., `rbac_organisation_roles`, `rbac_global_roles`)
- Function needs to bypass RLS to avoid circular dependencies
- Function performs administrative operations requiring elevated privileges

**Why it's needed:**
When an RLS policy calls a helper function that queries RLS-protected tables, without SECURITY DEFINER:
1. RLS policy calls helper function
2. Helper function queries RLS-protected table (e.g., `rbac_organisation_roles`)
3. That query triggers RLS again → infinite recursion or circular dependency

**Example:**
```sql
-- ✅ CORRECT: SECURITY DEFINER required because function queries rbac_organisation_roles
CREATE OR REPLACE FUNCTION check_user_organisation_access(p_organisation_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER          -- ✅ Required: queries rbac_organisation_roles (has RLS)
SET search_path TO public -- ✅ MANDATORY: prevents search path hijacking
AS $$
BEGIN
  -- This queries rbac_organisation_roles which has RLS policies
  -- Without SECURITY DEFINER, this would trigger RLS again → circular dependency
  RETURN EXISTS (
    SELECT 1 FROM public.rbac_organisation_roles  -- ✅ Schema-qualified
    WHERE user_id = auth.uid()
    AND organisation_id = p_organisation_id
  );
END;
$$;
```

**SECURITY DEFINER is NOT necessary when:**
- Function only performs pure computation (no table queries)
- Function only queries tables without RLS policies
- Function doesn't need to bypass RLS

**Example:**
```sql
-- ✅ CORRECT: No SECURITY DEFINER needed (pure computation, no RLS-protected queries)
CREATE OR REPLACE FUNCTION calculate_total(p_amount NUMERIC, p_tax_rate NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE  -- ✅ STABLE for performance, but no SECURITY DEFINER needed
AS $$
BEGIN
  RETURN p_amount * (1 + p_tax_rate);
END;
$$;
```

### Security Risks & Mitigations

**Security Risks:**
1. **Search path hijacking** - If `search_path` includes untrusted schemas, malicious objects could be called
2. **Privilege escalation** - Functions run with owner's privileges, not caller's
3. **Unqualified object references** - Could resolve to objects in wrong schemas
4. **Performance implications** - Can affect query optimization

**Required Mitigations (MANDATORY):**

| Mitigation | Requirement | Why |
|------------|-------------|-----|
| `SET search_path TO public` | **MANDATORY** | Prevents search path hijacking attacks |
| Schema-qualify references | **MANDATORY** | Ensures objects resolve to correct schemas |
| `STABLE` or `IMMUTABLE` | **REQUIRED** | Helps with query optimization and performance |
| Least-privilege ownership | **MANDATORY** | Functions MUST be owned by appropriate roles (not superuser unless necessary) |
| Document rationale | **REQUIRED** | COMMENT must explain why SECURITY DEFINER is needed |

**Example with all mitigations:**
```sql
-- ✅ CORRECT: All security mitigations in place
CREATE OR REPLACE FUNCTION check_user_organisation_access(p_organisation_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE                    -- ✅ Performance optimization
SECURITY DEFINER          -- ✅ Required: queries RLS-protected tables
SET search_path TO public -- ✅ MANDATORY: prevents search path hijacking
AS $$
BEGIN
  -- ✅ Schema-qualified references
  RETURN EXISTS (
    SELECT 1 FROM public.rbac_organisation_roles
    WHERE user_id = auth.uid()
    AND organisation_id = p_organisation_id
  );
END;
$$;

-- ✅ Document why SECURITY DEFINER is needed
COMMENT ON FUNCTION check_user_organisation_access(UUID) IS 
  'Checks if current user has access to organisation. SECURITY DEFINER required because function queries public.rbac_organisation_roles which has RLS policies. Without SECURITY DEFINER, this would create circular RLS dependency. STABLE for RLS policy performance. SET search_path TO public prevents search path hijacking.';
```

### Decision Tree: When to Use SECURITY DEFINER

```
1. Does this helper function query tables with RLS policies?
   ├─ YES → SECURITY DEFINER required (to avoid circular RLS)
   │         └─ Continue to step 3
   └─ NO → Continue to step 2

2. Does this function need elevated privileges for administrative operations?
   ├─ YES → SECURITY DEFINER may be appropriate (document why)
   │         └─ Continue to step 3
   └─ NO → SECURITY DEFINER not needed
            └─ Use STABLE or IMMUTABLE only

3. If using SECURITY DEFINER, verify all security requirements:
   ├─ SET search_path TO public (or specific schema list) ✅ MANDATORY
   ├─ Schema-qualify all table/function references ✅ MANDATORY
   ├─ Use STABLE/IMMUTABLE when possible ✅ REQUIRED
   ├─ Owned by appropriate role (not superuser unless needed) ✅ MANDATORY
   └─ Document why SECURITY DEFINER is needed in COMMENT ✅ REQUIRED
```

### Security Anti-Patterns

**❌ NEVER use these patterns:**

```sql
-- ❌ BAD: Missing SET search_path (security risk)
CREATE OR REPLACE FUNCTION bad_function()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER  -- Missing SET search_path TO public!
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM rbac_organisation_roles);  -- Unqualified reference
END;
$$;

-- ❌ BAD: Unqualified table reference (security risk)
CREATE OR REPLACE FUNCTION bad_function()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM rbac_organisation_roles);  -- Should be public.rbac_organisation_roles
END;
$$;

-- ❌ BAD: SECURITY DEFINER without justification
CREATE OR REPLACE FUNCTION pure_computation(x NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER  -- Not needed! Function doesn't query RLS-protected tables
AS $$
BEGIN
  RETURN x * 2;  -- Pure computation, no table queries
END;
$$;
```

**✅ CORRECT patterns:**

```sql
-- ✅ GOOD: All security requirements met
CREATE OR REPLACE FUNCTION check_user_organisation_access(p_organisation_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER          -- ✅ Required: queries RLS-protected tables
SET search_path TO public -- ✅ MANDATORY: prevents search path hijacking
AS $$
BEGIN
  -- ✅ Schema-qualified reference
  RETURN EXISTS (
    SELECT 1 FROM public.rbac_organisation_roles
    WHERE user_id = auth.uid()
    AND organisation_id = p_organisation_id
  );
END;
$$;

COMMENT ON FUNCTION check_user_organisation_access(UUID) IS 
  'SECURITY DEFINER required: queries public.rbac_organisation_roles (has RLS). Without it, circular RLS dependency would occur.';

-- ✅ GOOD: No SECURITY DEFINER needed (pure computation)
CREATE OR REPLACE FUNCTION calculate_total(p_amount NUMERIC, p_tax_rate NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE  -- ✅ STABLE for performance, but no SECURITY DEFINER needed
AS $$
BEGIN
  RETURN p_amount * (1 + p_tax_rate);  -- No table queries
END;
$$;
```

## Helper Selection Quick Guide

| Scenario | Helper(s) to use | Notes |
|----------|------------------|-------|
| Organisation-scoped rows | `check_user_organisation_access(organisation_id)` | Always check `organisation_id IS NOT NULL` first. |
| Page-permission checks | `check_rbac_permission_with_context(..., get_app_id('APP'))` | Use the wrapper instead of inline `rbac_check_permission_simplified` + `auth.uid()`. |
| Event-scoped rows | `check_user_event_access(event_id)` | Combine with permission wrapper when pages require it. |
| Public rows | `check_public_event_access(event_id)` or `is_public = true` | Keep anonymous and authenticated policies separate. |
| User-owned rows | `get_effective_user_id() = user_id` | Use when `organisation_id IS NULL`. |
| Service role bypass | `is_service_role()` | Put first in OR chains; use sparingly. |

## RLS Helper Requirements (enforced)

- Helper functions **must** be `STABLE`, `SECURITY DEFINER` (when querying RLS-protected tables), and `SET search_path TO public` (MANDATORY for SECURITY DEFINER functions).
- **Never** inline `auth.uid()`, `auth.role()`, or `current_setting()` inside policies.
- Use `get_app_id()` for app UUIDs (do not hardcode UUIDs or call legacy getters).
- Avoid subqueries inside policies; move lookups into helpers.
- **Security**: All SECURITY DEFINER functions must schema-qualify table/function references and document why SECURITY DEFINER is needed.

## Standard Helper Functions

### Core Helper Functions

These functions are available for use in RLS policies:

#### `is_super_admin(p_user_id UUID)`
- **Returns**: `boolean`
- **Purpose**: Checks if the specified user is a super admin
- **Usage**: `is_super_admin(safe_get_user_id_for_rls())`
- **⚠️ CRITICAL**: Always pass an explicit user ID parameter. Never call without parameters.
- **Security**: This function requires an explicit parameter to prevent fallback strategy vulnerabilities. Use `safe_get_user_id_for_rls()` to get the user ID in RLS policies.

#### `check_user_organisation_access(p_organisation_id UUID)`
- **Returns**: `boolean`
- **Purpose**: Checks if current user has access to the specified organisation
- **Usage**: `check_user_organisation_access(organisation_id)`

#### `check_user_event_access(p_event_id TEXT)`
- **Returns**: `boolean`
- **Purpose**: Checks if current user has access to the specified event
- **Usage**: `check_user_event_access(event_id)`

#### `check_public_event_access(p_event_id TEXT)`
- **Returns**: `boolean`
- **Purpose**: Checks if the specified event is publicly accessible
- **Usage**: `check_public_event_access(event_id)`

#### `get_app_id(p_app_name TEXT)`
- **Returns**: `UUID`
- **Purpose**: Returns the UUID for any registered app
- **Usage**: `get_app_id('BASE')`, `get_app_id('PACE')`, `get_app_id('CAKE')`
- **Note**: Replaced and dropped legacy functions `get_base_app_id()`, `get_pace_app_id()`, `util_get_cake_app_id()` (no longer exist in database)

#### `get_current_organisation_context()`
- **Returns**: `UUID`
- **Purpose**: Returns the current organisation context from the session
- **Usage**: `get_current_organisation_context()`

#### `is_authenticated_user()`
- **Returns**: `boolean`
- **Purpose**: Checks if the current user is authenticated (not anonymous)
- **Usage**: `is_authenticated_user()`
- **Note**: Use this instead of `(SELECT auth.role()) = 'authenticated'` in policies

#### `is_service_role()`
- **Returns**: `boolean`
- **Purpose**: Checks if the current user has service_role
- **Usage**: `is_service_role()`
- **Note**: Use this instead of `(SELECT auth.role()) = 'service_role'` in policies

#### `get_effective_user_id()`
- **Returns**: `UUID`
- **Purpose**: Returns the current user ID (auth.uid()) in a STABLE function
- **Usage**: `get_effective_user_id()`
- **Note**: Use this instead of `(SELECT auth.uid())` or inline `auth.uid()` in policies

### Event Helper Functions

#### `get_unit_event_id(p_unit_id TEXT)`
- **Returns**: `TEXT`
- **Purpose**: Returns the event_id for a given unit_id
- **Usage**: `get_unit_event_id(unit_id)`

#### `get_form_event_id(p_form_id UUID)`
- **Returns**: `TEXT`
- **Purpose**: Returns the event_id for a given form_id
- **Usage**: `get_form_event_id(form_id)`

#### `get_form_response_event_id(p_response_id UUID)`
- **Returns**: `TEXT`
- **Purpose**: Returns the event_id for a given form_response_id
- **Usage**: `get_form_response_event_id(response_id)`

#### `get_event_organisation_id(p_event_id TEXT)`
- **Returns**: `UUID`
- **Purpose**: Returns the organisation_id for a given event_id
- **Usage**: `get_event_organisation_id(event_id)`

### RBAC Permission Helper Functions

#### `check_rbac_permission_with_context(p_permission TEXT, p_page_name TEXT, p_organisation_id UUID, p_event_id TEXT, p_app_id UUID)`
- **Returns**: `boolean`
- **Purpose**: STABLE SECURITY DEFINER wrapper for `rbac_check_permission_simplified()`. Use this in RLS policies instead of calling `rbac_check_permission_simplified()` with `auth.uid()` directly.
- **Usage**: `check_rbac_permission_with_context('read:page.table_name', 'table_name', organisation_id, NULL, get_app_id('APP_NAME'))`
- **Note**: This wrapper ensures `auth.uid()` is called once per function invocation (not per row) and the function is STABLE for RLS policy performance.

## RLS Policy Patterns

This section documents the standard RLS policy patterns used throughout the codebase. All patterns follow the principles of using helper functions, enforcing security by default, and maintaining consistent structure.

> **Prerequisite:** All RLS policy patterns below assume the table has `organisation_id` (and `event_id` for event-scoped tables). See [Table Schema Standards](./4-api-tech-stack-standards.md#table-schema-standards) for the required columns every table must have, including the exceptions list for tables that do not require `organisation_id`.

### Policy Naming Convention

Policies follow this naming pattern:
- `rbac_{operation}_{table_name}_{scope}` for authenticated policies
- `{operation}_{table_name}_{scope}` for public/anonymous policies

Examples:
- `rbac_select_cake_dish_authenticated` - Authenticated SELECT policy
- `event_public_select` - Public SELECT policy for events
- `rbac_insert_file_references` - INSERT policy (no scope suffix if only one)

### Standard Organisation-Scoped Policy

**Use Case:** Tables where rows belong to an organisation and access is controlled by organisation membership.

**Pattern:**
```sql
CREATE POLICY "rbac_select_table_name" ON table_name
FOR SELECT TO authenticated
USING (
  organisation_id IS NOT NULL
  AND (
    is_super_admin(safe_get_user_id_for_rls())
    OR check_user_organisation_access(organisation_id)
  )
);
```

**Example:** `organisations`, `organisation_app_access`

**Notes:**
- Always check `organisation_id IS NOT NULL` first
- Super admin check comes before organisation access check
- **MUST** use `is_super_admin(safe_get_user_id_for_rls())` with explicit parameter
- Use `check_user_organisation_access()` for basic membership checks

### RBAC Permission-Based Policy

**Use Case:** Tables that require specific page-level permissions (most common pattern for app tables).

**Pattern:**
```sql
CREATE POLICY "rbac_select_table_name" ON table_name
FOR SELECT TO authenticated
USING (
  organisation_id IS NOT NULL
  AND (
    is_super_admin(safe_get_user_id_for_rls())
    OR check_rbac_permission_with_context(
      'read:page.table_name',
      'table_name',
      organisation_id,
      event_id,  -- NULL if not event-scoped
      get_app_id('APP_NAME')
    )
  )
);
```

**Example:** `cake_dish`, `cake_item`, `base_application`

**Full CRUD Example:**
```sql
-- SELECT
CREATE POLICY "rbac_select_table_name" ON table_name
FOR SELECT TO authenticated
USING (
  organisation_id IS NOT NULL
  AND (
    is_super_admin(safe_get_user_id_for_rls())
    OR check_rbac_permission_with_context(
      'read:page.table_name',
      'table_name',
      organisation_id,
      event_id,
      get_app_id('APP_NAME')
    )
  )
);

-- INSERT
CREATE POLICY "rbac_insert_table_name" ON table_name
FOR INSERT TO authenticated
WITH CHECK (
  organisation_id IS NOT NULL
  AND (
    is_super_admin(safe_get_user_id_for_rls())
    OR check_rbac_permission_with_context(
      'create:page.table_name',
      'table_name',
      organisation_id,
      event_id,
      get_app_id('APP_NAME')
    )
  )
);

-- UPDATE
CREATE POLICY "rbac_update_table_name" ON table_name
FOR UPDATE TO authenticated
USING (
  organisation_id IS NOT NULL
  AND (
    is_super_admin(safe_get_user_id_for_rls())
    OR check_rbac_permission_with_context(
      'update:page.table_name',
      'table_name',
      organisation_id,
      event_id,
      get_app_id('APP_NAME')
    )
  )
)
WITH CHECK (
  organisation_id IS NOT NULL
  AND (
    is_super_admin(safe_get_user_id_for_rls())
    OR check_rbac_permission_with_context(
      'update:page.table_name',
      'table_name',
      organisation_id,
      event_id,
      get_app_id('APP_NAME')
    )
  )
);

-- DELETE
CREATE POLICY "rbac_delete_table_name" ON table_name
FOR DELETE TO authenticated
USING (
  organisation_id IS NOT NULL
  AND (
    is_super_admin(safe_get_user_id_for_rls())
    OR check_rbac_permission_with_context(
      'delete:page.table_name',
      'table_name',
      organisation_id,
      event_id,
      get_app_id('APP_NAME')
    )
  )
);
```

**Notes:**
- Always use `check_rbac_permission_with_context()` instead of calling `rbac_check_permission_simplified()` with `auth.uid()` directly
- The wrapper function is STABLE SECURITY DEFINER and ensures optimal performance
- Permission format: `{operation}:page.{page_name}` (e.g., `'read:page.dishes'`, `'create:page.items'`)
- Use `get_app_id('APP_NAME')` to get the app UUID (never hardcode)

### Standard Event-Scoped Policy

**Use Case:** Tables where rows belong to an event and access is controlled by event membership.

**Pattern:**
```sql
CREATE POLICY "rbac_select_table_name" ON table_name
FOR SELECT TO authenticated
USING (
  organisation_id IS NOT NULL
  AND (
    is_super_admin(safe_get_user_id_for_rls())
    OR check_user_event_access(event_id)
  )
);
```

**Example:** Event-specific data that doesn't require page-level permissions

**Note:** For event-scoped data that also requires page permissions, combine with RBAC permission pattern.

### User-Scoped Data Policy

**Use Case:** Tables where rows belong to individual users (organisation_id IS NULL) and users can only access their own data.

**Pattern:**
```sql
CREATE POLICY "rbac_select_table_name" ON table_name
FOR SELECT TO authenticated
USING (
  organisation_id IS NULL
  AND get_effective_user_id() = user_id
);
```

**Example:** User profile data, user-scoped file references

**Multi-Condition Pattern (Organisation OR User-Scoped):**
```sql
CREATE POLICY "rbac_select_table_name" ON table_name
FOR SELECT
USING (
  -- Organisation-scoped access
  (
    organisation_id IS NOT NULL
    AND is_authenticated_user()
    AND (
      is_super_admin(safe_get_user_id_for_rls())
      OR check_user_organisation_access(organisation_id)
    )
  )
  OR
  -- User-scoped access
  (
    organisation_id IS NULL
    AND is_authenticated_user()
    AND get_effective_user_id() = user_id
  )
);
```

**Example:** `file_references`, `pace_address` (can be either organisation or user-scoped)

**Real-World Example: File References Table**

```sql
-- Real-world example: file_references table supports both organisation and user-scoped files
CREATE POLICY "rbac_select_file_references" ON file_references
FOR SELECT
USING (
  -- Service role can access all files (for system operations)
  is_service_role()
  OR
  -- Organisation-scoped files (shared within organisation)
  (
    organisation_id IS NOT NULL
    AND is_authenticated_user()
    AND (
      is_super_admin(safe_get_user_id_for_rls())
      OR check_user_organisation_access(organisation_id)
    )
  )
  OR
  -- User-scoped files (personal files)
  (
    organisation_id IS NULL
    AND is_authenticated_user()
    AND get_effective_user_id() = user_id
  )
);

-- INSERT policy: Users can upload files to their organisation or personal storage
CREATE POLICY "rbac_insert_file_references" ON file_references
FOR INSERT TO authenticated
WITH CHECK (
  -- Organisation-scoped: Must have organisation access
  (
    organisation_id IS NOT NULL
    AND check_user_organisation_access(organisation_id)
  )
  OR
  -- User-scoped: Must be own user_id
  (
    organisation_id IS NULL
    AND get_effective_user_id() = user_id
  )
);
```

### Service Role Policy

**Use Case:** Allow service_role to bypass RLS for system operations.

**Pattern:**
```sql
CREATE POLICY "rbac_select_table_name" ON table_name
FOR SELECT
USING (
  is_service_role()
  OR (
    -- Other conditions for authenticated users
    is_authenticated_user()
    AND ...
  )
);
```

**Example:** `file_references` (service_role can access all files for system operations)

**Notes:**
- Service role check should be first in OR conditions
- Service role bypasses all other security checks
- Use sparingly - only for tables that need system-level access

### Public Access Policy

**Use Case:** Tables where some data should be publicly accessible (anonymous users).

**Pattern:**
```sql
CREATE POLICY "public_select_table_name" ON table_name
FOR SELECT TO anon
USING (
  check_public_event_access(event_id)
);
```

**Simple public flag (when a single table is sufficient):** MUST use one of: the helper pattern above when reusable across policies, or the following when a single table suffices:

```sql
CREATE POLICY "public_select_table_name" ON table_name
FOR SELECT TO anon
USING (
  is_public = true
  AND organisation_id IS NOT NULL
);
```

**Example:** `event` (public events), `forms` (published forms)

**Real-World Example: Public Event Registration**

```sql
-- Real-world example: Events table with public registration
-- Public users can view and register for public events
-- Authenticated users can view all events in their organisation

-- Public access: Anonymous users can view public events
CREATE POLICY "public_select_events" ON events
FOR SELECT TO anon
USING (
  is_public = true
  AND organisation_id IS NOT NULL
  AND status = 'published'
);

-- Authenticated access: Users can view events in their organisation
CREATE POLICY "rbac_select_events" ON events
FOR SELECT TO authenticated
USING (
  -- Public events (anyone can see)
  (is_public = true AND organisation_id IS NOT NULL)
  OR
  -- Organisation events (members can see)
  (
    organisation_id IS NOT NULL
    AND (
      is_super_admin(safe_get_user_id_for_rls())
      OR check_user_organisation_access(organisation_id)
    )
  )
);

-- Public registration: Anonymous users can create registrations for public events
CREATE POLICY "public_insert_event_registrations" ON event_registrations
FOR INSERT TO anon
WITH CHECK (
  -- Only for public events
  event_id IN (
    SELECT id FROM events
    WHERE is_public = true AND status = 'published'
  )
);

-- Authenticated registration: Users can register for events in their organisation
CREATE POLICY "rbac_insert_event_registrations" ON event_registrations
FOR INSERT TO authenticated
WITH CHECK (
  -- Must have access to the event's organisation
  event_id IN (
    SELECT id FROM events
    WHERE organisation_id IS NOT NULL
    AND (
      is_super_admin(safe_get_user_id_for_rls())
      OR check_user_organisation_access(organisation_id)
    )
  )
);
```

**Combined Public + Authenticated Pattern:**
```sql
-- Public access
CREATE POLICY "public_select_table_name" ON table_name
FOR SELECT TO anon
USING (
  is_public = true
  AND organisation_id IS NOT NULL
);

-- Authenticated access (with additional permissions)
CREATE POLICY "rbac_select_table_name" ON table_name
FOR SELECT TO authenticated
USING (
  (is_public = true AND organisation_id IS NOT NULL)
  OR (
    organisation_id IS NOT NULL
    AND (
      is_super_admin(safe_get_user_id_for_rls())
      OR check_user_organisation_access(organisation_id)
    )
  )
);
```

### Complex Multi-Condition Policy

**Use Case:** Tables that need multiple access patterns (service role, public, organisation-scoped, user-scoped).

**Pattern:**
```sql
CREATE POLICY "rbac_select_table_name" ON table_name
FOR SELECT
USING (
  -- Service role can access all
  is_service_role()
  -- Public access
  OR (is_public = true)
  -- Organisation-scoped authenticated access
  OR (
    is_authenticated_user()
    AND organisation_id IS NOT NULL
    AND (
      is_super_admin(safe_get_user_id_for_rls())
      OR check_user_organisation_access(organisation_id)
    )
  )
  -- User-scoped authenticated access
  OR (
    is_authenticated_user()
    AND organisation_id IS NULL
    AND get_effective_user_id() = user_id
  )
);
```

**Example:** `file_references` (supports all access patterns)

**Notes:**
- Order matters: most permissive first (service_role), then public, then authenticated
- Each condition should be mutually exclusive where possible
- Use helper functions for all checks (never inline auth calls)

### Read-Only Type Table Policy

**Use Case:** Reference/lookup tables that authenticated users should be able to read but not modify.

**Pattern:**
```sql
CREATE POLICY "read_table_name" ON table_name
FOR SELECT
USING (is_authenticated_user());
```

**Example:** `pace_gender_type`, `pace_phone_type`, `medi_condition_type`

**Notes:**
- No INSERT/UPDATE/DELETE policies needed
- Super simple - just check if user is authenticated
- These tables typically don't have organisation_id

### RBAC app resolution (rbac_apps)

**Contract for consuming apps (e.g. pace-mint):** pace-core resolves the app id by querying `public.rbac_apps` (via the Supabase client passed to `setupRBAC()`) for a row with `name = <app name>` and `is_active = true`. For that to succeed:

- The role used for the request (e.g. `authenticated`) **must** be allowed by RLS to SELECT rows in `public.rbac_apps` where `is_active = true`. If not, app resolution can return 406 and RBAC context fails to load.
- The app row must exist with the correct `name` and `is_active = true`.

A dedicated SELECT policy (e.g. `rbac_select_rbac_apps_app_resolution`) that allows `authenticated` to SELECT when `is_authenticated_user() AND is_active = true` satisfies this contract. Do not require organisation context or permission checks that depend on app id for this table, or app resolution becomes circular.

### Super Admin Only Policy

**Use Case:** Tables that only super admins should access.

**Pattern:**
```sql
CREATE POLICY "rbac_select_table_name" ON table_name
FOR SELECT TO authenticated
USING (is_super_admin(safe_get_user_id_for_rls()));
```

**Example:** `rbac_global_roles`, `rbac_policy_configs`

**Full CRUD Example:**
```sql
-- All operations restricted to super admin
CREATE POLICY "rbac_select_table_name" ON table_name
FOR SELECT TO authenticated
USING (is_super_admin(safe_get_user_id_for_rls()));

CREATE POLICY "rbac_insert_table_name" ON table_name
FOR INSERT TO authenticated
WITH CHECK (is_super_admin(safe_get_user_id_for_rls()));

CREATE POLICY "rbac_update_table_name" ON table_name
FOR UPDATE TO authenticated
USING (is_super_admin(safe_get_user_id_for_rls()))
WITH CHECK (is_super_admin(safe_get_user_id_for_rls()));

CREATE POLICY "rbac_delete_table_name" ON table_name
FOR DELETE TO authenticated
USING (is_super_admin(safe_get_user_id_for_rls()));
```

### Common Patterns Summary

| Pattern | Use Case | Key Helper Functions |
|---------|----------|---------------------|
| Organisation-Scoped | Basic org membership | `check_user_organisation_access()` |
| RBAC Permission-Based | Page-level permissions | `check_rbac_permission_with_context()`, `get_app_id()` |
| Event-Scoped | Event membership | `check_user_event_access()` |
| User-Scoped | Personal data | `get_effective_user_id()` |
| Service Role | System operations | `is_service_role()` |
| Public Access | Anonymous users | `check_public_event_access()` or `is_public` flag |
| Read-Only Types | Reference tables | `is_authenticated_user()` |
| Super Admin Only | Admin-only tables | `is_super_admin(safe_get_user_id_for_rls())` |

### Policy Best Practices

1. **Always use helper functions** - Never inline `auth.uid()`, `auth.role()`, or `current_setting()`
2. **Check NULL first** - Always check `organisation_id IS NOT NULL` before using it
3. **Super admin first** - Super admin checks should come before other checks in OR conditions. **MUST** use `is_super_admin(safe_get_user_id_for_rls())` with explicit parameter - never call without parameters.
4. **Service role first** - Service role checks should be the first condition in multi-condition policies
5. **Consistent naming** - Follow the naming convention: `rbac_{operation}_{table}_{scope}`
6. **Document exceptions** - If a policy deviates from standard patterns, add a comment explaining why
7. **Test thoroughly** - Test with different user roles (super_admin, org_admin, member, anon)
8. **Avoid `true OR ...`** - Never use `true OR ...` conditions as they bypass all security checks

## Edge Functions and Serverless Functions

**Edge Functions (Deno serverless functions) MUST use pace-core's `isPermitted()` API function.** Edge Functions cannot use React hooks, but pace-core provides programmatic APIs that work outside React.

### ✅ CORRECT - Edge Function Pattern

```typescript
// supabase/functions/my-function/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { setupRBAC, isPermitted } from 'npm:@jmruthers/pace-core@^0.6.0/rbac';

Deno.serve(async (req: Request) => {
  // 1. Create Supabase client from request headers
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  // 2. Get user from session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // 3. Setup RBAC (required before using isPermitted)
  setupRBAC(supabase);

  // 4. Extract organisation context from request
  const organisationId = req.headers.get('x-organisation-id') || 
                         (await req.json()).organisationId;

  if (!organisationId) {
    return new Response(JSON.stringify({ error: 'Organisation context required' }), { status: 400 });
  }

  // 5. Check permission using pace-core API
  const hasPermission = await isPermitted({
    userId: user.id,
    scope: { organisationId },
    permission: 'read:dashboard',
    pageId: 'dashboard'
  });

  if (!hasPermission) {
    return new Response(JSON.stringify({ error: 'Permission denied' }), { status: 403 });
  }

  // 6. Proceed with function logic
  return new Response(JSON.stringify({ success: true }));
});
```

### ❌ FORBIDDEN - Custom RBAC Helper in Edge Functions

**Creating custom RBAC helper functions in Edge Functions is FORBIDDEN.** pace-core provides all necessary APIs.

```typescript
// ❌ FORBIDDEN - Custom RBAC helper
// supabase/functions/_shared/rbac.ts
export async function checkPermission(userId: string, permission: string) {
  // Custom logic that bypasses pace-core
  const { data } = await supabase.rpc('rbac_check_permission_simplified', {
    p_user_id: userId,
    p_permission: permission
  });
  return data;
}
```

### Why No Exceptions

- pace-core provides `isPermitted()` API that works outside React
- `setupRBAC()` initializes the engine with a Supabase client
- No custom helpers needed - use pace-core APIs directly
- Custom helpers bypass security validation, caching, and audit logging

### Edge Function Requirements

1. **MUST** call `setupRBAC(supabase)` before using `isPermitted()`
2. **MUST** extract `userId` from Supabase auth session
3. **MUST** extract `organisationId` from request (headers, body, or query params)
4. **MUST** use `isPermitted()` with complete `PermissionCheck` input
5. **MUST NOT** create custom RBAC helper functions
6. **MUST NOT** call `rbac_check_permission_simplified` RPC directly

## Security Baseline

- Never bypass RLS; validate all inputs and sanitize logs (no tokens/PII).
- Use safe, user-friendly error messaging.
- Prefer pace-core security helpers and secure clients (`useSecureSupabase`, RBAC helpers) over custom implementations.
- Monitor RLS performance (avoid subqueries/InitPlan); keep helpers `STABLE SECURITY DEFINER` with `SET search_path TO public`.
- **SECURITY DEFINER functions**: Must schema-qualify all references, use `SET search_path TO public`, and document why SECURITY DEFINER is needed.
- **Edge Functions MUST use pace-core `isPermitted()` API - no exceptions allowed.**

### Common Pitfalls to Avoid

**❌ DON'T:**
```sql
-- Inline auth calls
USING (user_id = auth.uid())

-- Security bypass
USING (true OR check_user_organisation_access(organisation_id))

-- Missing NULL check
USING (check_user_organisation_access(organisation_id))

-- Direct current_setting
USING (organisation_id = current_setting('app.organisation_id')::UUID)

-- Public policy without proper checks
USING (true)  -- Allows anyone!

-- Always-true write policies on audit/log tables
-- (19 such policies were found on MINT tables and pump_scheduled_jobs
--  during the 2026-03-14 security audit and replaced with proper RBAC checks)
```

**✅ DO:**
```sql
-- Use helper functions
USING (get_effective_user_id() = user_id)

-- Proper security checks
USING (check_user_organisation_access(organisation_id))

-- NULL check first
USING (organisation_id IS NOT NULL AND check_user_organisation_access(organisation_id))

-- Use helper function
USING (organisation_id = get_organisation_context())

-- Proper public policy
USING (is_public = true AND organisation_id IS NOT NULL)
```

## Organisation context resolution (consuming apps)

When a consuming app uses both **selectedOrganisation** (from `useOrganisations()`) and **selectedEvent** (from `useEvents()`), any code that passes organisation context to RPCs or payloads (**p_organisation_id**, **organisation_id**, **selectedOrganisationId**) **MUST** use a **derived organisation ID** that falls back to the event’s organisation when the context selector has no org selected.

**Why:** If the user has selected an event but no organisation in the header, `selectedOrganisation` may be null while `selectedEvent.organisation_id` is set. Passing only `selectedOrganisation?.id` to RPCs then sends `undefined`, breaking data isolation or causing incorrect behaviour.

**✅ CORRECT – derived organisationId:**
```ts
const organisationId = useMemo(
  () =>
    selectedOrganisation?.id ??
    (selectedEvent as { organisation_id?: string | null } | undefined)?.organisation_id ??
    undefined,
  [selectedOrganisation?.id, selectedEvent]
);
// Use organisationId for all p_organisation_id, organisation_id, selectedOrganisationId
```

**❌ WRONG – using selectedOrganisation?.id when selectedEvent is in scope:**
```ts
p_organisation_id: selectedOrganisation?.id,  // undefined when event selected without org
organisation_id: selectedOrganisation?.id || '',
selectedOrganisationId: selectedOrganisation?.id,
```

**Enforcement:** The Standard 3 audit and the ESLint rule `require-derived-organisation-id` flag files that use both `selectedOrganisation` and `selectedEvent` but pass `selectedOrganisation?.id` (or `selectedOrganisation.id`) to organisation context parameters. Fix by deriving `organisationId` as above and using it consistently.

## App Ownership

Tables are assigned to specific apps for RBAC permission checking:

| App | Tables | Permission Page |
|-----|--------|-----------------|
| **BASE** | `base_*` tables | (per-table pages) |
| **PACE** | `pace_*` tables, `form_*` tables | (per-table pages) |
| **CAKE** | `cake_*` tables | (per-table pages, e.g. `dishes`, `meals`, `unit-menu`) |
| **TRAC** | `trac_*` tables | (per-table pages) |
| **MEDI** | `medi_*` tables | (per-table pages) |
| **MINT** | `mint_*` tables | `billing-control-panel` |
| **PUMP** | `pump_*` tables | `CommsLog` (pump_scheduled_jobs), per-table pages (others) |
| **PORTAL** | `form_context_types` (shared with PACE) | (per-table pages) |

## Testing Requirements

### Before Merging RLS Changes

1. **Run Supabase Advisors**:
   ```bash
   supabase advisors performance
   supabase advisors security
   ```

2. **Run Database Tests**:
   ```bash
   timeout 120 npm run test:db
   ```

3. **Run Application Tests**:
   ```bash
   timeout 60 npm run test
   ```

4. **Verify Performance**:
   - Use EXPLAIN ANALYZE to verify no InitPlan nodes
   - Verify queries complete in < 1 second
   - Check Supabase Advisors show zero `auth_rls_initplan` warnings

### Test Coverage Requirements

- [ ] Policy coverage: All tables have RLS enabled and policies
- [ ] Performance: Queries complete in < 1 second
- [ ] Security: Cross-organisation access is blocked
- [ ] Helper functions: All are STABLE, SECURITY DEFINER (when needed), with `SET search_path TO public`
- [ ] Security: All SECURITY DEFINER functions schema-qualify references and document rationale

## Maintenance

### Ongoing RLS Compliance Monitoring

**Run Supabase advisors regularly** to catch any rogue policies that violate standards:

```bash
# Performance advisors
supabase advisors performance

# Security advisors
supabase advisors security

# Review slow queries
# (configure log_min_duration_statement = 1000)
```

### Monitoring

Monitor:
- Query duration > 5 seconds
- Connection pool exhaustion (>80% utilization)
- CPU usage > 80%
- Memory usage > 80%
- `auth_rls_initplan` advisor warnings > 0

## Migration Guidelines

### Migration Filename Requirements

**CRITICAL**: Migration filenames **MUST** use real timestamps, not guessed or placeholder dates.

1. **Always use the current timestamp** when creating migration files
2. **Format**: `YYYYMMDDHHMMSS_descriptive_name.sql`
3. **How to get the timestamp**:
   ```bash
   date +"%Y%m%d%H%M%S"
   ```
4. **Never guess or use placeholder dates** - This causes migration ordering issues and conflicts
5. **Verify the timestamp is after the latest migration** in `supabase/migrations/`

**Example**:
```bash
# Get current timestamp
date +"%Y%m%d%H%M%S"
# Output: 20251201124800

# Use it in filename
20251201124800_allow_medi_action_plan_null_condition_id.sql
```

### Creating New RLS Policies

1. **Use helper functions** - Never inline `auth.uid()` or `current_setting()`
2. **Test with EXPLAIN ANALYZE** - Verify no InitPlan nodes
3. **Load test** - Test with realistic data volumes
4. **Run Supabase Advisors** - Verify no new warnings

### Updating Existing Policies

1. **Backup existing policies** before changes
2. **Test in development** first
3. **Monitor performance** after deployment
4. **Rollback plan** ready if issues occur

## ESLint Rules

Rule IDs use the plugin prefix **`pace-core-compliance/`**. The following rules enforce security and RBAC standards:

- **`pace-core-compliance/no-direct-supabase-client`** — Require useSecureSupabase from pace-core/rbac; disallow direct createClient from @supabase/supabase-js.
- **`pace-core-compliance/rbac-permission-loading`** — Enforce loading state handling when using RBAC permission hooks.
- **`pace-core-compliance/no-direct-rbac-rpc`** — Disallow direct RPC calls to rbac_*; use pace-core RBAC hooks/APIs.
- **`pace-core-compliance/no-direct-rbac-table`** — Disallow direct queries to RBAC tables; use pace-core APIs.
- **`pace-core-compliance/no-hardcoded-role-checks`** — Disallow hardcoded role checks; use usePermissionLevel/getRoleContext from pace-core/rbac.
- **`pace-core-compliance/rbac-use-resource-names-constants`** — Require RESOURCE_NAMES constants instead of string literals in useResourcePermissions.
- **`pace-core-compliance/no-rbac-wrapper-components`** — Disallow wrapper components around pace-core RBAC components.
- **`pace-core-compliance/no-rbac-wrapper-functions`** — Disallow wrapper functions around pace-core RBAC hooks.

These rules are part of the `pace-core-compliance` plugin and are enabled when extending `@jmruthers/pace-core/eslint-config`.

## Related Documentation

- [Standards Overview](./0-standards-overview.md) - Standards system overview
- [pace-core Compliance](./5-pace-core-compliance-standards.md) - Secure Supabase client usage
- [Operations](./9-operations-standards.md) - General performance patterns (React, caching, etc.)

---

**Last Updated:** 2026-03-14
**Version:** 2.1.0
**Applies to:** All pace-core and consuming apps

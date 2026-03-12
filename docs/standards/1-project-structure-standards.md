# Project Structure Standards

**🤖 Cursor Rule**: See [01-project-structure.mdc](../cursor-rules/01-project-structure.mdc) for AI-optimized directives that automatically enforce this structure.

## Purpose

This guide defines the standard project structure and file organization patterns that all apps consuming `@jmruthers/pace-core` **MUST** follow. Adhering to this structure ensures:

- **Consistency** across all PACE suite applications
- **Maintainability** through predictable organization
- **Developer Experience** with clear patterns and conventions
- **Compatibility** with pace-core tooling and automation
- **Scalability** as your app grows

## Table of Contents

1. [Standard Directory Structure](#standard-directory-structure)
2. [File Organization Standard](#file-organization-standard)
3. [Naming Conventions](#naming-conventions)
4. [Import Path Configuration](#import-path-configuration)
5. [Component Organization](#component-organization)
6. [Testing Structure](#testing-structure)
7. [Database & Supabase Structure](#database--supabase-structure)
8. [Configuration Files](#configuration-files)
9. [Structure Checklist](#structure-checklist)

### How each layer enforces this standard

- **Standards (this doc):** Source of truth; defines MUST/SHOULD for structure, naming, imports, and config.
- **Cursor rule:** `01-project-structure.mdc` — AI guidance when creating or organizing files (`**/*.{ts,tsx,js,jsx,md}`, `src/**`); points to this doc.
- **ESLint:** No project-structure rules; structure is enforced by the Cursor rule and the audit tool only.
- **Audit tool:** Standard 1 audit runs as part of `npm run validate`; checks directory structure, config files, import paths (tsconfig), test colocation, feature-based organization (no type-based or domain-based). Report: `audit/<timestamp>-pace-core-audit.md`. For pace-core development, run `npm run validate` from the repository root.

### Audit issue types and where to read

| Audit issue type    | See section in this doc                        |
|---------------------|------------------------------------------------|
| directoryStructure  | Standard Directory Structure                   |
| configFiles         | Configuration Files                           |
| importPaths         | Import Path Configuration                     |
| testColocation      | Testing Structure (Test Colocation)           |
| organizationPattern | Component Organization / File Organization Standard |

---

## Standard Directory Structure

### Complete Project Structure

Every consuming app **MUST** follow this base structure. All listed paths and files are required unless marked optional.

```
your-app/
├── .cursor/
│   ├── rules/                    # Cursor rules (pace-core + local)
│   │   ├── 00-standards-overview.mdc
│   │   ├── 01-pace-core-compliance.mdc
│   │   ├── 02-project-structure.mdc
│   │   └── [local-rules].mdc
│   └── mcp.json                  # MCP server configuration (required)
│
├── .vscode/                      # VS Code settings (optional)
│   └── settings.json
│
├── public/                       # Static assets
│   ├── favicon.ico
│   ├── robots.txt
│   ├── fonts/                    # App fonts (required)
│   │   └── *.woff2
│   └── logos/                    # App logos (required)
│       └── [logo-files]
│
├── src/                          # Source code
│   ├── components/               # App-specific components
│   │   ├── [feature-name]/      # Organized by feature
│   │   └── shared/              # Shared app components
│   │
│   ├── hooks/                    # App-specific hooks
│   │   ├── [feature-name]/      # Feature-specific hooks
│   │   └── [hook-name].ts
│   │
│   ├── services/                 # App-specific services (if using service pattern)
│   │   └── [service-name].ts
│   │
│   ├── pages/                    # Page components (route components)
│   │   ├── [PageName].tsx
│   │   └── [feature]/           # Feature-based pages
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── [domain].ts          # Domain-specific types
│   │   └── index.ts             # Re-export barrel file
│   │
│   ├── utils/                    # App-specific utility functions (required)
│   │   ├── [utility-name].ts
│   │   └── index.ts             # Re-export barrel file
│   │
│   ├── lib/                      # Base Supabase client only (required)
│   │   └── supabase.ts          # Single file; passed to UnifiedAuthProvider only
│   │
│   ├── App.tsx                   # Main app component
│   ├── main.tsx                  # Application entry point
│   └── app.css                   # Global styles (MUST follow 7-styling-standards.md)
│
├── supabase/                     # Supabase configuration (no migrations in consuming apps)
│   └── config.toml               # Supabase config
│
├── tests/                        # Integration/E2E tests (optional)
│   └── [test-files].test.ts
│
├── audit/                        # Audit reports (generated, gitignored)
│   └── audit-*.md
│
├── .env                          # Local environment variables (required; gitignored)
├── .gitignore
├── eslint.config.js              # ESLint config (flat config; or .eslintrc.js / eslint.config.cjs)
├── package.json
├── tsconfig.json                 # TypeScript config
├── tsconfig.app.json             # App-specific TS config (if needed)
├── vite.config.ts                # Vite configuration
├── vitest.config.ts              # Vitest configuration
├── README.md
└── CHANGELOG.md                  # (optional but recommended)
```

### Directory Purpose Reference

| Directory / file | Purpose | Required? |
|------------------|---------|-----------|
| `.cursor/rules/` | Cursor AI rules for code generation | ✅ Yes |
| `.cursor/mcp.json` | MCP server configuration | ✅ Yes |
| `public/` | Static assets served directly | ✅ Yes |
| `public/fonts/` | App fonts in `.woff2` format | ✅ Yes |
| `public/logos/` | App logos | ✅ Yes |
| `src/` | All source code | ✅ Yes |
| `src/components/` | App-specific React components | ✅ Yes |
| `src/hooks/` | Custom React hooks | ✅ Yes |
| `src/pages/` | Route/page components | ✅ Yes |
| `src/types/` | TypeScript type definitions | ✅ Yes |
| `src/utils/` | App-specific utility functions | ✅ Yes |
| `src/lib/` | Base Supabase client only (e.g. `supabase.ts`) | ✅ Yes |
| `supabase/` | Supabase config and Edge Functions only | ✅ Yes |
| `tests/` | Integration/E2E tests | Optional |
| `audit/` | Generated audit reports | ✅ Yes (gitignored) |
| `.env` | Local environment variables | ✅ Yes (gitignored) |

---

## File Organization Standard

### Feature-Based Organization

**MUST** organize components, hooks, and related code by feature/domain:

```
src/
├── components/
│   ├── events/
│   │   ├── EventCard.tsx
│   │   ├── EventList.tsx
│   │   └── EventForm.tsx
│   ├── users/
│   │   ├── UserProfile.tsx
│   │   └── UserList.tsx
│   └── shared/
│       ├── AppLayout.tsx
│       └── Navigation.tsx
│
├── hooks/
│   ├── events/
│   │   ├── useEventData.ts
│   │   └── useEventForm.ts
│   └── users/
│       └── useUserData.ts
│
├── pages/
│   ├── EventsPage.tsx
│   ├── EventDetailPage.tsx
│   ├── UsersPage.tsx
│   └── UserProfilePage.tsx
│
└── types/
    ├── events.ts
    └── users.ts
```

**Why feature-based?** Since pace apps are already split by domain, organizing code by feature within each app provides:
- **Clear boundaries** - Related code stays together
- **Easy navigation** - Find all code for a feature in one place
- **Simplified imports** - Consistent path structure
- **Better maintainability** - Changes to a feature are localized

### src/utils vs src/lib (prescriptive)

- **`src/lib/`** – **MUST** contain only the base Supabase client (e.g. `supabase.ts`). No other files. Used only by `main.tsx` or `App.tsx` for `UnifiedAuthProvider`.
- **`src/utils/`** – **MUST** contain app-specific utility functions (formatting, validation, helpers). Re-export via `index.ts` where useful.

Do not put app utilities in `src/lib/`. Do not put the Supabase client in `src/utils/`.

---

## Naming Conventions

### Files

| Type | Convention | Example | Notes |
|------|------------|---------|-------|
| **Components** | `PascalCase.tsx` | `EventCard.tsx` | React components |
| **Hooks** | `camelCase.ts` with `use` prefix | `useEventData.ts` | Custom hooks |
| **Utilities** | `camelCase.ts` | `formatEvent.ts` | Helper functions |
| **Types** | `camelCase.ts` or `types.ts` | `eventTypes.ts` | Type definitions |
| **Services** | `PascalCase.ts` | `EventService.ts` | Service classes |
| **Tests** | `*.test.ts` or `*.test.tsx` | `EventCard.test.tsx` | Test files |
| **Config** | `kebab-case.config.js` | `vite.config.ts` | Config files |
| **Pages** | `PascalCase.tsx` with `Page` suffix | `EventsPage.tsx` | Route components |

### Directories

| Type | Convention | Example | Notes |
|------|------------|---------|-------|
| **Feature directories** | `kebab-case` | `event-management/` | Feature/domain names |
| **Component directories** | `kebab-case` | `event-card/` | When component has multiple files |
| **Shared directories** | `kebab-case` | `shared/` | Shared across features |

### Code Naming

```typescript
// ✅ CORRECT - Components
export function EventCard() { }
export const UserProfile = () => { };

// ✅ CORRECT - Hooks
export function useEventData() { }
export function useUserProfile() { }

// ✅ CORRECT - Utilities
export function formatEvent() { }
export function validateUserInput() { }

// ✅ CORRECT - Types
export type Event = { };
export interface UserProfile { }

// ✅ CORRECT - Services
export class EventService { }
```

---

## Import Path Configuration

### Path Aliases Setup

**MUST** configure path aliases in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/pages/*": ["./src/pages/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  }
}
```

**MUST** also configure in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/lib': path.resolve(__dirname, './src/lib'),
    },
  },
});
```

### Import Patterns

```tsx
// ✅ CORRECT - Absolute imports from src
import { EventCard } from '@/components/events/EventCard';
import { useEventData } from '@/hooks/events/useEventData';
import { formatEvent } from '@/utils/formatEvent';
import type { Event } from '@/types/events';

// ✅ CORRECT - pace-core imports
import { Button, Card, DataTable } from '@jmruthers/pace-core';
import { useUnifiedAuth, usePermissions } from '@jmruthers/pace-core';
import { formatDate, formatCurrency } from '@jmruthers/pace-core';

// ✅ CORRECT - Relative imports for nearby files (same directory)
import { EventCardHeader } from './EventCardHeader';
import { EventCardFooter } from './EventCardFooter';

// ❌ WRONG - Deep relative imports
import { EventCard } from '../../../components/events/EventCard';

// ❌ WRONG - Importing from pace-core source
import { Button } from '@jmruthers/pace-core/src/components/Button';
```

---

## Component Organization

### Component Structure

**MUST** organize components by feature, not by type:

```
src/components/
├── events/                    # ✅ Feature-based
│   ├── EventCard.tsx
│   ├── EventList.tsx
│   └── EventForm.tsx
│
└── shared/                    # ✅ Shared app components
    ├── AppLayout.tsx
    └── Navigation.tsx
```

```
src/components/
├── buttons/                   # ❌ WRONG - Type-based
├── inputs/                    # ❌ WRONG - Type-based
└── cards/                     # ❌ WRONG - Type-based
```

**Why?** Use pace-core components for UI primitives (Button, Input, Card, etc.). Your components should be feature-specific compositions.

### When to split a component into separate files

**MUST** split a component into separate files when:

- The file exceeds **approximately 1000 lines** of code, or
- A subcomponent is **complex enough** to warrant its own tests and types.

### Component File Structure

For simple components (single file):

```
src/components/events/EventCard.tsx
```

For complex components (multiple related files):

```
src/components/events/EventCard/
├── EventCard.tsx              # Main component
├── EventCardHeader.tsx        # Sub-components
├── EventCardFooter.tsx
├── EventCard.test.tsx         # Tests (colocated)
├── EventCard.types.ts         # Component-specific types
└── index.ts                   # Barrel export
```

### Component Composition Example

```tsx
// ✅ CORRECT - Use pace-core components
import { Button, Card, Input } from '@jmruthers/pace-core';
import { useEventData } from '@/hooks/events/useEventData';

export function EventCard({ eventId }: { eventId: string }) {
  const { event } = useEventData(eventId);
  
  return (
    <Card>
      <h2>{event.title}</h2>
      <p>{event.description}</p>
      <Button>View Details</Button>
    </Card>
  );
}
```

---

## Testing Structure

### Test Colocation

**MUST** colocate tests with source files:

```
src/
├── components/
│   └── events/
│       ├── EventCard.tsx
│       └── EventCard.test.tsx        # ✅ Colocated
│
├── hooks/
│   ├── useEventData.ts
│   └── useEventData.test.ts           # ✅ Colocated
│
└── utils/
    ├── formatEvent.ts
    └── formatEvent.test.ts            # ✅ Colocated
```

### Test File Naming

- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.ts`
- E2E tests: Place in `tests/` directory

### Test Organization Example

```typescript
// src/components/events/EventCard.test.tsx
import { render, screen } from '@testing-library/react';
import { EventCard } from './EventCard';

describe('EventCard', () => {
  it('renders event title', () => {
    // Test implementation
  });
});
```

---

## Database & Supabase Structure

### Migrations (consuming apps)

**Consuming apps MUST NOT have `supabase/migrations/`.** All database migrations are managed only in pace-core. Consuming apps connect to an existing Supabase project and schema.

### Supabase directory in consuming apps

**MUST** have at minimum:

```
supabase/
├── config.toml                   # Supabase config
└── functions/                    # Only if the app defines Edge Functions
    └── [function-name]/
        ├── index.ts
        └── package.json
```

Do not create a `migrations/` folder in consuming apps.

### Supabase Client Setup

**MUST** place the base Supabase client in `src/lib/supabase.ts`. The base client **MUST NOT** be exported for general use; it is used only by `main.tsx` or `App.tsx` and passed to `UnifiedAuthProvider`. Components **MUST** use `useSecureSupabase()` from pace-core for queries. See [pace-core Compliance](./5-pace-core-compliance-standards.md) for security requirements.

```typescript
// src/lib/supabase.ts — base client for UnifiedAuthProvider only; DO NOT import elsewhere
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Used only by main.tsx/App.tsx for UnifiedAuthProvider; components use useSecureSupabase()
export const supabaseClient = createClient<Database>(supabaseUrl, supabasePublishableKey);
```

---

## Configuration Files

### Required Configuration Files

**MUST** have these configuration files in the root:

| File | Purpose | Required? |
|------|---------|-----------|
| `package.json` | Dependencies and scripts | ✅ Yes |
| `tsconfig.json` | TypeScript configuration | ✅ Yes |
| `vite.config.ts` | Vite build configuration | ✅ Yes |
| `vitest.config.ts` | Vitest test configuration | ✅ Yes |
| `.gitignore` | Git ignore patterns | ✅ Yes |
| `.env` | Local environment variables (not committed) | ✅ Yes |
| `eslint.config.js` (or `.eslintrc.js` / `eslint.config.cjs`) | ESLint configuration | ✅ Yes |

For Supabase and MCP setup, see [New project setup](../NEW-PROJECT-SETUP.md) (Environment variables and MCP setup).

### Root Directory Rules

**MUST** keep root directory clean:

✅ **Allowed in root:**
- Configuration files (`package.json`, `tsconfig.json`, etc.)
- Documentation (`README.md`, `CHANGELOG.md`)
- Build tool configs (`vite.config.ts`, etc.)
- `.cursor/` directory (including `mcp.json`)
- `.gitignore`, `.env`

❌ **NOT allowed in root:**
- Source files (`*.ts`, `*.tsx`)
- Component files
- Test files
- Utility files

---

## Structure Checklist

Before committing code, verify your project structure:

### Directory Structure
- [ ] Standard directory structure followed
- [ ] Root directory contains only config files
- [ ] All source code in `src/`
- [ ] `.cursor/rules/` and `.cursor/mcp.json` present
- [ ] `public/fonts/` (`.woff2`) and `public/logos/` present
- [ ] `.env` present (`.env` gitignored)
- [ ] No `supabase/migrations/` (consuming apps; migrations only in pace-core)

### File Organization
- [ ] Components organized by feature, not type
- [ ] Tests colocated with source files
- [ ] Naming conventions followed
- [ ] No duplicate pace-core components

### Imports
- [ ] Path aliases configured (`@/` prefix)
- [ ] Absolute imports used (no deep relative paths)
- [ ] pace-core imported from package, not source
- [ ] No restricted imports (e.g., `@radix-ui/*`)

### Configuration
- [ ] `tsconfig.json` has path aliases
- [ ] `vite.config.ts` has path aliases
- [ ] ESLint configured with pace-core rules
- [ ] All required config files present

### Documentation
- [ ] `README.md` documents project structure
- [ ] Non-standard decisions documented

---

## Common Mistakes to Avoid

### ❌ Don't: Organize by Component Type

```
src/components/
├── buttons/        # ❌ Use pace-core Button instead
├── inputs/         # ❌ Use pace-core Input instead
└── cards/          # ❌ Use pace-core Card instead
```

### ❌ Don't: Create Duplicate Components

```tsx
// ❌ WRONG - Don't create local Button
// src/components/Button.tsx
export function Button() { }

// ✅ CORRECT - Use pace-core
import { Button } from '@jmruthers/pace-core';
```

### ❌ Don't: Use Deep Relative Imports

```tsx
// ❌ WRONG
import { EventCard } from '../../../components/events/EventCard';

// ✅ CORRECT
import { EventCard } from '@/components/events/EventCard';
```

### ❌ Don't: Place Source Files in Root

```
your-app/
├── App.tsx          # ❌ WRONG - Should be in src/
├── components/      # ❌ WRONG - Should be in src/components/
└── utils.ts         # ❌ WRONG - Should be in src/utils/
```

### ❌ Don't: Modify pace-core Code

```tsx
// ❌ WRONG - Don't import from pace-core source
import { Button } from '@jmruthers/pace-core/src/components/Button';

// ✅ CORRECT - Import from package
import { Button } from '@jmruthers/pace-core';
```

---

## Related Documentation

- [Standards Overview](./0-standards-overview.md) - Standards system overview
- [pace-core Compliance](./5-pace-core-compliance-standards.md) - pace-core usage patterns
- [Styling Standards](./7-styling-standards.md) - **CRITICAL: Required CSS configuration**
- [Code Quality](./6-code-quality-standards.md) - Code style and TypeScript standards
- [API & Tech Stack](./4-api-tech-stack-standards.md) - Tech stack requirements
- [Architecture](./2-architecture-standards.md) - Architecture principles

---

**Last Updated:** 2025-01-28  
**Version:** 2.0.0  
**Applies to:** All consuming apps using `@jmruthers/pace-core`

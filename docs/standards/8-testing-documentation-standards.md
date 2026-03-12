# Testing & Documentation Standards

**🤖 Cursor Rule**: See [08-testing-documentation.mdc](../cursor-rules/08-testing-documentation.mdc) for AI-optimized directives that automatically enforce testing and documentation standards.

**🔧 ESLint Rules**: See [08-testing.cjs](../../packages/core/eslint-rules/rules/08-testing.cjs) for mechanically checkable testing rules.

## Purpose

This standard defines testing strategies, documentation requirements, and issue reporting templates to ensure consistent quality, maintainability, and effective communication across pace-core and consuming apps.

---

## How each layer enforces this standard

- **Standards (this doc):** Source of truth; defines testing strategy (unit/integration/E2E), test structure and naming, testing tools (React Testing Library, userEvent, Vitest), test timeouts, coverage requirements, documentation requirements, and bug/feature request templates.
- **Cursor rule:** `08-testing-documentation.mdc` — AI guidance when editing test files (`**/*.{test,spec}.{ts,tsx}`) and docs (`**/*.md`, `**/*.mdx`); points to this doc.
- **ESLint:** Rules in `08-testing.cjs` (plugin prefix `pace-core-compliance/`): see ESLint Rules section below. Run via lint step in CI and locally.
- **Audit tool:** Standard 8 audit runs as part of `npm run validate`; checks test timeout configuration (vitest.config, package.json scripts), required testing tools (vitest, @testing-library/react, @testing-library/user-event), and test file structure/naming (.test vs .spec). Report: `audit/<timestamp>-pace-core-audit.md`. For pace-core development, run `npm run validate` from the repository root.

---

## Audit issue types and where to read

| Audit issue type | See section in this doc |
|------------------|--------------------------|
| testTimeout | Test Timeouts |
| testingTools | Testing Tools |
| testStructure | Test Structure; Test File Naming |
| coverageConfig | Coverage setup (Vitest) |

---

## Testing Strategy

### Test Types

**MUST** use this testing strategy:

- **Unit tests** - For utils & hooks (≥90% coverage)
- **Integration tests** - For components (≥70% coverage)
- **Few meaningful E2E tests** - In consuming apps only (critical user flows)

### Test Structure

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

### Testing Tools

**MUST** use:

- **React Testing Library** - For component testing
- **userEvent** - For user interaction simulation
- **Vitest** - For test runner
- **Avoid unnecessary mocks** - Prefer real implementations when possible

### Test Timeouts

**MUST** configure timeouts in `vitest.config.ts` for all test commands to prevent tests from hanging indefinitely. Do not rely on package.json script flags alone.

**Required configuration (in `vitest.config.ts`):**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 10000,        // 10 seconds per test
    hookTimeout: 10000,        // 10 seconds for hooks
    teardownTimeout: 5000,     // 5 seconds for cleanup
  },
});
```

**Timeout guidance:** Unit tests typically complete in &lt; 1 second; 10s is a safe default. For a single slow test, set a per-test timeout (e.g. `it('...', async () => { ... }, 15000)`). E2E or integration tests may use higher values (e.g. 30–60s) where appropriate.

### Example Test

```typescript
// src/components/events/EventCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventCard } from './EventCard';

describe('EventCard', () => {
  it('renders event title', () => {
    const event = { id: '1', name: 'Test Event', date: new Date() };
    render(<EventCard event={event} />);
    expect(screen.getByText('Test Event')).toBeInTheDocument();
  });

  it('handles click interaction', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    const event = { id: '1', name: 'Test Event', date: new Date() };
    
    render(<EventCard event={event} onClick={handleClick} />);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Test Coverage Requirements

- **Utils & Hooks**: ≥90% coverage (statement and line coverage)
- **Components**: ≥70% coverage (statement and line coverage)
- **Critical paths**: 100% coverage (authentication, payments, RBAC/permission checks, and any other security or money-related paths)

Coverage metrics apply to **the source code you own** and for which you enforce these thresholds—not dependencies (e.g. `node_modules`) or build output.

**By context:**

- **Library-only repo:** The code you own is the library source (e.g. `src/` or `packages/<name>/src/`). Configure coverage so the report includes only that.
- **Consuming app repo:** The code you own is the application source (e.g. `src/`). The same thresholds (utils/hooks ≥90%, components ≥70%, critical paths 100%) apply to that source.
- **Monorepo with both library and app:** You may hold both to the standard. Configure coverage so the report includes both (e.g. package source and app source); apply thresholds per glob or per-folder so library and app are each assessed. Example: the code you own might be `packages/core/src` and/or the app `src/`; configure `include`/`exclude` so the report reflects those.

**Exclusions (universal):** Always exclude from coverage collection and reporting: build output (`dist/`), tooling (`scripts/`, `audit-tool/` or equivalent), barrel/index-only files with no logic, and `node_modules`. Do not include dependency code in your aggregate.

**Which report:** Use the coverage report that includes only (or clearly segments) the code to which you apply the thresholds. That may be one combined report (e.g. package + app in one run) or separate runs per package/app; in either case, judge the overall percentage and thresholds against the code you own, not against dist, scripts, or dependencies.

**Coverage setup (Vitest)** — so the report includes only the source you own:

- **Put coverage under `test.coverage`** in `vitest.config.ts`. Vitest reads coverage options from `test.coverage`, not from a top-level `coverage` key.
- **Use provider `istanbul`.** Istanbul instruments only files that match `include`; the report then shows only those files. With v8, the report can include build output or tooling unless you rely solely on exclude.
- **Optional:** In `package.json`, force the provider in the script so it is used even if v8 is installed: `"test:coverage": "vitest run --coverage --coverage.provider=istanbul"`.
- **`include`:** Only paths you own (e.g. `src/**`, or `packages/<name>/src/**` and `src/**` in a monorepo).
- **`exclude`:** Test files (`**/*.test.ts`, `**/*.integration.test.tsx`, etc.), `dist/`, `scripts/`, `audit-tool/` (or equivalent), `node_modules/`, barrel `index.ts` files, and entry points like `src/main.tsx`.

Example (monorepo with package + app):

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      include: ['packages/core/src/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.{ts,tsx}', '**/*.integration.test.{ts,tsx}', '**/index.ts',
        'packages/core/audit-tool/**', 'packages/core/scripts/**', '**/dist/**', '**/node_modules/**', 'src/main.tsx',
      ],
      thresholds: { /* per-folder or per-glob */ },
    },
  },
});
```

**Critical paths example (pace-core):** In the pace-core package, critical paths include auth (e.g. UnifiedAuthProvider, login flows) and RBAC (guards, useCan, useRBAC, ProtectedRoute, secure-client). Other repos will have their own critical paths (payments, app-specific auth, etc.).

---

## Documentation

**Requirements docs are the primary documentation for features.** Each feature or slice is specified in a requirements doc (overview, acceptance criteria, API/contract, demo and testing requirements). That is enough for building and maintaining the app; no separate per-component or per-API doc is required unless stated below.

**When to add more:**
- **pace-core package**: Maintain an API reference (or equivalent) for the public surface so consuming apps know how to use components, hooks, and utilities. This can live in the package (e.g. `packages/core/docs/api-reference/` or implementation guides) and be generated or hand-maintained.
- **Non-obvious behavior**: Add short comments or a minimal doc when a decision or behavior would not be clear from the code or from the requirements doc alone (e.g. why a workaround exists, or a non-obvious contract).

**Do not** enforce heavy documentation (e.g. mandatory Overview/API/Examples/A11y/Edge Cases for every component). Requirements docs plus clear code and types are the standard; supplement only where they add value.

---

## Bug Reports

### Bug Report Template

**MUST** use this template when reporting bugs:

```markdown
## Description
Clear description of the bug and expected vs actual behavior.

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Minimal Reproduction
Link to CodeSandbox/StackBlitz or minimal code snippet that reproduces the issue.

## Environment
- pace-core version: X.X.X
- React version: X.X.X
- Node version: X.X.X
- Browser: Chrome/Firefox/Safari X.X
- OS: macOS/Windows/Linux

## Error Messages/Logs
```
Paste error messages or logs here
```

## Additional Context
Screenshots, videos, or other context that helps understand the issue.
```

### Bug Report Checklist

Before submitting a bug report, verify:

- [ ] Description clearly explains the issue
- [ ] Steps to reproduce are minimal and ordered
- [ ] Minimal reproduction provided (link or code)
- [ ] Environment information complete
- [ ] Error messages/logs included
- [ ] Additional context provided if helpful

---

## Feature Requests

### Feature Request Template

**MUST** use this template when requesting features:

```markdown
## Feature Description
Clear description of the feature and the problem it solves.

## Proposed Solution/API
Description of how the feature should work, including API design if applicable.

## Use Case
Real-world scenario where this feature would be useful.

## Alternatives Considered
Other approaches you've considered and why they don't work.

## Example Code
\`\`\`tsx
// Example of how the feature would be used
<NewComponent prop="value" />
\`\`\`

## Additional Context
Mockups, diagrams, or other context that helps understand the feature.
```

### Feature Request Checklist

Before submitting a feature request, verify:

- [ ] Feature description is clear
- [ ] Problem statement is well-defined
- [ ] Proposed solution/API is described
- [ ] Use case with real scenario provided
- [ ] Alternatives considered and documented
- [ ] Example code snippet included
- [ ] Additional context provided if helpful

---

## Testing Checklist

Before committing code with tests, verify:

- [ ] Tests colocated with source files
- [ ] React Testing Library + userEvent used
- [ ] Unnecessary mocks avoided
- [ ] Coverage requirements met (≥90% utils/hooks, ≥70% components)
- [ ] Critical paths have 100% coverage
- [ ] Tests are meaningful and test behavior, not implementation

---

## Documentation Checklist

Before committing, verify:

- [ ] Feature or change is covered by a requirements doc (or existing doc is updated if behavior changed)
- [ ] For pace-core: public API reference (or equivalent) updated if you changed exported components/hooks/utils
- [ ] Non-obvious behavior has a short comment or note where it helps

---

## ESLint Rules

Rule IDs use the plugin prefix **`pace-core-compliance/`**. The following rule enforces testing standards:

- **`pace-core-compliance/test-file-naming`** — Enforce test file naming: `*.test.ts` or `*.test.tsx` (not `*.spec.ts`).

This rule is part of the `pace-core-compliance` plugin and is enabled when extending `@jmruthers/pace-core/eslint-config`.

---

## Related Documentation

- [Standards Overview](./0-standards-overview.md) - Standards system overview
- [Code Quality](./6-code-quality-standards.md) - Code patterns and TypeScript
- [Architecture](./2-architecture-standards.md) - Component design principles

---

**Last Updated:** 2025-02-25  
**Version:** 2.0.0  
**Applies to:** All pace-core and consuming apps

# Pace Standards

This repository defines the **canonical development standards** for **pace-core** and **all consuming applications** in the pace-suite. They are human-readable first and enforced by Cursor rules, ESLint, and the audit tool.

**Entry point:** [0-standards-overview.md](./0-standards-overview.md) — read this first for the four-layer quality system, precedence, and how to use the standards.

## Standards documents (10 files, SDLC order)

| File | Purpose |
|------|---------|
| [0-standards-overview.md](./0-standards-overview.md) | Entry point, four layers, precedence, file mapping |
| [1-project-structure-standards.md](./1-project-structure-standards.md) | Directory structure, file organization, naming |
| [2-architecture-standards.md](./2-architecture-standards.md) | SOLID principles, component and API design |
| [3-security-rbac-standards.md](./3-security-rbac-standards.md) | RLS, RBAC, security requirements |
| [4-api-tech-stack-standards.md](./4-api-tech-stack-standards.md) | Tech stack, API/RPC naming, result shapes |
| [5-pace-core-compliance-standards.md](./5-pace-core-compliance-standards.md) | pace-core usage, ESLint, secure Supabase client |
| [6-code-quality-standards.md](./6-code-quality-standards.md) | TypeScript, naming, code style, React patterns |
| [7-styling-standards.md](./7-styling-standards.md) | **CRITICAL:** CSS config, Tailwind v4, markup quality |
| [8-testing-documentation-standards.md](./8-testing-documentation-standards.md) | Testing strategy, documentation, templates |
| [9-operations-standards.md](./9-operations-standards.md) | Error handling, performance, CI/CD |

All other quality tools align to these standards; they are the single source of truth.

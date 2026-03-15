# Standards and guardrails

Use this document together with the setup guide ([NEW-PROJECT-SETUP.md](NEW-PROJECT-SETUP.md)) when building the project shell, and with the project brief ([0-project-brief.md](0-project-brief.md)) and Cursor rules and ESLint config when implementing features from requirements docs.

---

## Source of truth

The **renumbered standards** (SDLC order) are the single source of truth:

| # | Standard | Location (in package) |
|---|----------|------------------------|
| 0 | Overview | `packages/core/docs/standards/0-standards-overview.md` |
| 1 | Project structure | `packages/core/docs/standards/1-project-structure-standards.md` |
| 2 | Architecture | `packages/core/docs/standards/2-architecture-standards.md` |
| 3 | Security & RBAC | `packages/core/docs/standards/3-security-rbac-standards.md` |
| 4 | API & tech stack | `packages/core/docs/standards/4-api-tech-stack-standards.md` |
| 5 | pace-core compliance | `packages/core/docs/standards/5-pace-core-compliance-standards.md` |
| 6 | Code quality | `packages/core/docs/standards/6-code-quality-standards.md` |
| 7 | Styling | `packages/core/docs/standards/7-styling-standards.md` |
| 8 | Testing & documentation | `packages/core/docs/standards/8-testing-documentation-standards.md` |
| 9 | Operations | `packages/core/docs/standards/9-operations-standards.md` |

When the repo is created from the brief, the standards may be provided under `docs/standards/` (or from the package once it exists). Cursor rules and ESLint config are derived from these standards and must be used when building from the brief or from any requirements doc.

---

## Cursor rules and ESLint config

- **Cursor rules** are supplied only by the package. Install them by running **`npm run setup`** (from the repo root or from a consuming app with `@jmruthers/pace-core` installed). Setup copies rules from `packages/core/cursor-rules/` (or from `node_modules/@jmruthers/pace-core/cursor-rules/`) into `.cursor/rules/`. Do not maintain cursor rules in consuming apps; pace-core dictates them and they stay in sync via the package.
- **ESLint config** is documented under `docs/eslint-config/`; the actual config and rules live in the package. Use `npm run setup` to configure the app to extend `@jmruthers/pace-core/eslint-config`.
- **Audit tool and validate script** are required for the validate pipeline; see [NEW-PROJECT-SETUP.md](NEW-PROJECT-SETUP.md) (Files to copy, Getting the four-layer quality system working) for what to copy into `packages/core/` (audit-tool directory and validate.cjs).
- When building from a **requirements doc**, use the same standards + guardrails + Cursor rules + ESLint config as context. Do not implement features without a requirements doc.

---

## Order of application

1. **Project shell:** Use [NEW-PROJECT-SETUP.md](NEW-PROJECT-SETUP.md) + this **guardrails** doc + **Cursor rules** + **ESLint config** to create the repo structure, package layout, demo app at root, and validate pipeline. No feature implementation beyond what is needed to boot the app and run validate.
2. **Each feature:** Use **one requirements doc** at a time, plus the **standards** (and this guardrails doc) and **Cursor rules** + **ESLint config**. Implement only what the requirements doc specifies; add or update tests and demo as specified. Run validate after each slice.

**Rule:** No feature work without a requirements doc. Use `docs/requirements/backlog/` for the order of work; move docs to `docs/requirements/implemented/` when done.

---

## Definition of done

For the shell and for each feature slice:

Implementation is verified by the **four-layer** quality system: standards documents, Cursor rules, ESLint, and the pace-core audit tool. `npm run validate` runs typecheck, lint, build, tests, and pace-core audit(s); reports are written to `audit/`. See [Standards overview](standards/0-standards-overview.md) for the full four-layer description.

- **Validate passes:** Run `npm run validate` (or the equivalent command). It runs typecheck → lint → build → tests → audit in order. When it passes, the slice is done.
- **Demo (if applicable):** The requirements doc states which demo page(s) or flows verify the feature; ensure those work.
- **Standards:** Code must comply with the standards referenced in the requirements doc and with the Cursor rules and ESLint config. Fix any audit or lint findings; do not silence tools.

---

## Quick reference for AI agents

- **Standards:** Read the overview (0) first; then the standard(s) relevant to the task (e.g. Styling 7 for markup, Security 3 for RBAC, Testing 8 for tests).
- **Requirements doc:** Contains overview, acceptance criteria, API/contract, demo requirements, testing requirements, and a "Do not" section. Implement from the spec; do not copy from an existing codebase.
- **Database:** The codebase uses an **existing** database schema and data; do not create or migrate schema. Reference existing tables/policies in requirements docs where a feature depends on them. RLS and function review is out of scope for this project.

# [Feature/Area Name]

## Overview

- Purpose and scope (package only; or package + demo app for pace-core; or in-app only for consuming apps).
- Dependencies on other requirements (e.g. "Requires: Auth and RBAC setup").
- Standards that apply (e.g. Styling, RBAC, Testing — use renumbered standard names: 01–09).

## Acceptance criteria

- [ ] Criterion 1 (testable outcome).
- [ ] Criterion 2 (…).
- [ ] … (references to standards where relevant, e.g. "Standard 07: Styling").

## API / Contract

- Public exports: components, hooks, types, utils (names and signatures). For consuming apps, list app-specific modules or pace-core imports used.
- File paths (e.g. packages/core for pace-core; app-specific paths for consuming apps).
- No implementation detail; only contract.

## Verification

- **pace-core:** Which demo page(s) or flows exercise this feature; concrete steps for the user to verify behaviour.
- **Consuming apps:** Which in-app page(s) or flows exercise this feature; concrete steps to verify behaviour. (Consuming apps do not have a separate demo app.)

## Testing requirements

- What must be covered (unit vs integration), and any coverage expectations (from Standard 08).
- Critical paths or scenarios to test.

## Do not

- Do not copy implementation from the old codebase; implement from this spec.
- Do not add undocumented public props or exports.
- (Feature-specific constraints.)

## References

- Links to implementation guides or API reference (for authoring this doc only; implementation must follow this spec).

---

## Prompt to use with Cursor

Implement the feature described in this document. Follow the standards and guardrails provided. Add or update tests and verification (demo app for pace-core, or in-app for consuming apps) as specified in "Testing requirements" and "Verification". Run validate and fix any issues until it passes.

---

**Checklist before running Cursor:** intro doc + guardrails doc + Cursor rules + ESLint config + this requirements doc.

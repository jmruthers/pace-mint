# M04 – Budget Structure Management

## Overview

- **Purpose and scope:** Manage hierarchical budget categories for an event: single root, unlimited depth, auto-generated codes (e.g. 1, 1.1, 1.1.1), parent roll-up (no editable amounts on parents).
- **Requires:** M03.
- **Standards:** 02 Architecture, 03 Security & RBAC, 08 Testing & Documentation.

**pace-core / standards:** Use pace-core components (Standard 05). RBAC via pace-core (Standard 03). Styling per Standard 07.

**Aligns with:** ARC § 4 Planning engine.

## Acceptance criteria

- [ ] Budget tree supports unlimited depth.
- [ ] Single root category per event.
- [ ] All nodes have a parent except root.
- [ ] Codes auto-generated (e.g. 1, 1.1, 1.1.1).
- [ ] Parent rows automatically sum child values; parent rows cannot store editable amounts.

## API / Contract

**Types:** (in `src/types/mint.ts`)

- `BudgetNode`

**Hooks:**

- `src/hooks/useBudgetTree.ts` — `useBudgetTree(eventId: string): { data, isLoading, error, refetch, addNode, updateNode, deleteNode }`

**Components:**

- `src/components/mint/BudgetTreeView.tsx` — Hierarchical tree view (e.g. DataTable or tree component from pace-core if available).
- `src/components/mint/BudgetNodeEditor.tsx` — Create/edit budget node (name, code derived); parent read-only for amount.

No implementation detail; only contract.

## Verification

- **Route:** `/budget-tree` (or event-scoped).
- User should:
  1. Create a budget node.
  2. Nest nodes (parent/child).
  3. View hierarchical tree and confirm parent sums roll up.

## Testing requirements

- **Unit:** Node creation; hierarchy validation; roll-up calculation.
- **Integration:** Orphan nodes disallowed; parent amount fields read-only.
- Coverage per Standard 08.

## Do not

- Do not copy implementation from the old codebase; implement from this spec.
- Do not add undocumented public props or exports.
- Do not allow orphan nodes.
- Do not allow editing parent node amount values.

## References

- ARC § 4 Planning engine. Tree data modelling.

---

## Prompt to use with Cursor

Implement the feature described in this document. Follow the standards and guardrails provided. Add or update tests and verification as specified in "Testing requirements" and "Verification". Run validate and fix any issues until it passes.

---

**Checklist before running Cursor:** intro doc + guardrails doc + Cursor rules + ESLint config + this requirements doc.

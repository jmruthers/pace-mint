# Styling Standards

**🤖 Cursor Rule**: See [07-styling.mdc](../cursor-rules/07-styling.mdc) for AI-optimized directives that automatically enforce markup quality (this rule is ALWAYS APPLIED).

**🔧 ESLint Rules**: See [05-styling.cjs](../../packages/core/eslint-rules/rules/05-styling.cjs) for mechanically checkable styling/markup rules.

## Purpose

This standard defines the **REQUIRED** configuration for consuming apps to properly use pace-core styling. Adhering to this standard ensures:

- ✅ pace-core components render with correct styles
- ✅ Colors, typography, and spacing work correctly
- ✅ Tailwind v4 content scanning works properly
- ✅ Consistent styling across all PACE suite applications

---

## How each layer enforces this standard

- **Standards (this doc):** Source of truth; defines required CSS setup (app.css, @source, @theme, color palettes), markup/styling rules, and Tailwind v4 usage.
- **Cursor rule:** `07-styling.mdc` — ALWAYS APPLIED; AI guidance when editing `src/**/*.{ts,tsx,js,jsx}`; points to this doc and CSS checklist.
- **ESLint:** Rules in `05-styling.cjs` (plugin prefix `pace-core-compliance/`): see ESLint Rules section below. Run via lint step in CI and locally.
- **Audit tool:** Standard 7 audit runs as part of `npm run validate`; checks app.css existence/structure, required imports, @source directives, @theme and color palettes, and Tailwind v4 plugin in vite.config. Report: `audit/<timestamp>-pace-core-audit.md`. For pace-core development, run `npm run validate` from the repository root.

---

## Audit issue types and where to read

| Audit issue type | See section in this doc |
|------------------|--------------------------|
| appCss | Required File: src/app.css; CRITICAL: @source paths; CSS Import Path; Required Color Palettes; Verification Checklist |
| tailwindConfig | Verification Checklist / Troubleshooting (Tailwind v4) |

---

## Component & Markup Guidance

- Components should be stateless when possible, fully typed, and accessibility-first.
- **The only `<div>` in the project** should be the one with `id="root"` in `index.html` (the React mount point). Use semantic HTML elements (`<main>`, `<section>`, `<article>`, `<nav>`, `<header>`, `<footer>`, etc.) or React Fragments for grouping; never add `<div>` elsewhere.
- Never add wrapper elements for styling—use React Fragments or apply layout classes to existing semantic parents or pace-core layout components.
- No inline styles; rely on pace-core variants and Tailwind utilities (layout/spacing) using theme tokens only.
- **No arbitrary Tailwind colours**—use `main-*`, `sec-*`, `acc-*` (or semantic tokens like `text-foreground`) only.
- **Minimise use of arbitrary values**—avoid bracket syntax (e.g. `w-[137px]`) where a theme token or standard utility exists.
- Apply layout utilities to existing semantic parents or pace-core layout components.

### Layout

Use **grid** or **native HTML flow** for layouts; **do not use flex** (no `display: flex`, no Tailwind `flex`, `flex-row`, `flex-col`, `flex-wrap`, etc.). This keeps layout predictable and avoids unnecessary complexity.

- **inline / inline-block** — Simple single-row layouts (e.g. a row of labels or small controls).
- **Standard HTML flow** — Basic single-column layouts; block elements stack naturally.
- **Grid** — Advanced single-column or single-row control (e.g. `grid-template-columns`, `grid-template-rows`) and all multi-row / multi-column "grid" layouts.

There is no need to introduce flex when flow + inline + grid cover the same cases with simpler, more predictable markup and styling.

- **WRONG:** `className="flex items-center gap-2"`, `className="flex flex-col"`, or any `flex*` utilities.
- **CORRECT:** `className="grid grid-cols-[auto_1fr] gap-2"`, `className="contents"` with grid on parent, or inline-block / normal flow as above.

### Component Principles

- Stateless when possible; keep surface area small and composable.
- Accessible by default with correct roles, keyboard support, and visible focus.
- UI primitives only; never add domain logic or data fetching inside components.
- Support controlled + uncontrolled usage where applicable.

### Testing Expectations

- Use React Testing Library + userEvent.
- Test key interactions; snapshots only for simple components.
- Keep components small—move non-UI logic to hooks/services.

## ⚠️ CRITICAL: Required Configuration

**Without proper configuration, pace-core components will appear unstyled or with incorrect styling.**

## Two-File CSS Architecture

pace-core uses a two-file CSS architecture:

1. **`@jmruthers/pace-core/styles/core.css`** - Core foundation (fonts, resets, typography, component styles)
2. **`src/app.css`** - App-specific configuration (color palettes, source directives)

## Required File: `src/app.css`

**MUST** create `src/app.css` in your consuming app with the following structure:

```css
@import "tailwindcss";

/* @source directives for Tailwind v4 content scanning */
/* CRITICAL: Paths are relative to the CSS file location (src/app.css) */
@source "./**/*.{js,ts,jsx,tsx}";
@source "../node_modules/@jmruthers/pace-core/src/**/*.{js,ts,jsx,tsx}";

/* Import pace-core CSS files so Tailwind processes them */
/* CRITICAL: Must use package path, not /src/styles/ path */
@import "@jmruthers/pace-core/styles/core.css";

@theme static {
  /* Your app's color palettes here */
  /* See Color Palette Requirements below */
}
```

## ⚠️ CRITICAL: @source Directive Paths

**The @source directive paths are relative to the CSS file location, not the project root.**

Since `app.css` is in `src/app.css`, the paths MUST be:

### ✅ CORRECT Patterns

```css
/* For app source files (relative to src/) */
@source "./**/*.{js,ts,jsx,tsx}";

/* For pace-core (one level up from src/ to project root, then into node_modules) */
@source "../node_modules/@jmruthers/pace-core/src/**/*.{js,ts,jsx,tsx}";
```

### ❌ WRONG Patterns

```css
/* ❌ WRONG: Two levels up for node_modules (only needed if app.css is nested deeper) */
@source "../../node_modules/@jmruthers/pace-core/src/**/*.{js,ts,jsx,tsx}";

/* ❌ WRONG: Using ../src/ when app.css is already in src/ */
@source "../src/**/*.{js,ts,jsx,tsx}";

/* ❌ WRONG: Using ./src/ when app.css is already in src/ */
@source "./src/**/*.{js,ts,jsx,tsx}";

/* ❌ WRONG: Using project root paths (paths are relative to CSS file) */
@source "./node_modules/@jmruthers/pace-core/src/**/*.{js,ts,jsx,tsx}";
```

### Path Resolution Logic

```
Project Structure:
your-app/
├── src/
│   └── app.css          ← CSS file is here
├── node_modules/
│   └── @jmruthers/
│       └── pace-core/
│           └── src/     ← pace-core source is here
```

**From `src/app.css`:**
- To scan app source: `./**/*.{js,ts,jsx,tsx}` (current directory = src/)
- To scan pace-core: `../node_modules/@jmruthers/pace-core/src/**/*.{js,ts,jsx,tsx}` (up one level to project root, then into node_modules)

## ⚠️ CRITICAL: CSS Import Path

**MUST** use the package path, not the source path:

### ✅ CORRECT

```css
@import "@jmruthers/pace-core/styles/core.css";
```

### ❌ WRONG

```css
/* ❌ WRONG: Don't use /src/styles/ path */
@import "@jmruthers/pace-core/src/styles/core.css";

/* ❌ WRONG: Don't import in main.tsx (import in app.css instead) */
/* In main.tsx: */
import '@jmruthers/pace-core/styles/core.css';  /* ❌ WRONG */
```

## Required Color Palettes

**MUST** define three complete color palettes in `@theme static`:

```css
@theme static {
  /* Main palette - Primary brand color (all shades 50-950 required) */
  --color-main-raw: oklch(0.58 0.23 300);
  --color-main-50: oklch(0.98 0.003 300);
  --color-main-100: oklch(0.96 0.014 300);
  --color-main-200: oklch(0.927 0.033 300);
  --color-main-300: oklch(0.881 0.059 300);
  --color-main-400: oklch(0.822 0.093 300);
  --color-main-500: oklch(0.75 0.133 300);
  --color-main-600: oklch(0.665 0.182 300);
  --color-main-700: oklch(0.58 0.23 300);
  --color-main-800: oklch(0.456 0.158 300);
  --color-main-900: oklch(0.332 0.099 300);
  --color-main-950: oklch(0.195 0.047 300);

  /* Secondary palette - Supporting color (all shades 50-950 required) */
  --color-sec-raw: oklch(0.675 0.169 244.75);
  --color-sec-50: oklch(0.98 0.003 244.75);
  --color-sec-100: oklch(0.96 0.014 244.75);
  --color-sec-200: oklch(0.927 0.032 244.75);
  --color-sec-300: oklch(0.881 0.057 244.75);
  --color-sec-400: oklch(0.822 0.089 244.75);
  --color-sec-500: oklch(0.75 0.128 244.75);
  --color-sec-600: oklch(0.675 0.169 244.75);
  --color-sec-700: oklch(0.567 0.134 244.75);
  --color-sec-800: oklch(0.456 0.101 244.75);
  --color-sec-900: oklch(0.332 0.068 244.75);
  --color-sec-950: oklch(0.195 0.037 244.75);

  /* Accent palette - Highlight color (all shades 50-950 required) */
  --color-acc-raw: oklch(0.64 0.23 7.385);
  --color-acc-50: oklch(0.98 0.003 7.385);
  --color-acc-100: oklch(0.96 0.017 7.385);
  --color-acc-200: oklch(0.927 0.039 7.385);
  --color-acc-300: oklch(0.881 0.069 7.385);
  --color-acc-400: oklch(0.822 0.109 7.385);
  --color-acc-500: oklch(0.75 0.157 7.385);
  --color-acc-600: oklch(0.64 0.23 7.385);
  --color-acc-700: oklch(0.567 0.193 7.385);
  --color-acc-800: oklch(0.456 0.142 7.385);
  --color-acc-900: oklch(0.332 0.092 7.385);
  --color-acc-950: oklch(0.195 0.047 7.385);
}
```

**All shades (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950) plus `-raw` are REQUIRED.**

## Required Import in Entry Point

**MUST** import `app.css` in your entry point (e.g., `src/main.tsx`):

```tsx
// src/main.tsx
import './app.css';  // ✅ CORRECT - Import app.css which imports core.css once
```

**DO NOT** import `core.css` directly in `main.tsx`, `App.tsx`, or any other entry surface. Double-importing `core.css` leads to stylesheet duplication and ordering issues.

```tsx
// ❌ WRONG - Don't import core.css directly (app.css already does it)
import '@jmruthers/pace-core/styles/core.css';
import './app.css';
```

### Multi-entry decision tree

When you have additional entry points (storybook, tests, preview servers):
- If the entry point renders your React tree, **import only `app.css`** there as well.
- If you need raw styles for non-React tooling, **import `@jmruthers/pace-core/styles/core.css` once** in that tool-specific stylesheet, never alongside `app.css`.
- If you are unsure, default to a single `app.css` import and remove any extra `core.css` imports.

## Styling & Markup Rules

- **No inline styles**: Do not use `style={{ ... }}` except when a third-party library strictly requires it. Prefer pace-core variants + Tailwind utilities.
- **Use theme tokens only**: No arbitrary Tailwind colours—use `main-*`, `sec-*`, `acc-*`, or semantic tokens like `text-foreground` only. Minimise use of arbitrary values (bracket syntax such as `bg-[oklch(...)]` or `w-[137px]`); use theme tokens or standard utilities where possible.
- **Semantic-first markup**: The only `<div>` in the project should be the one with `id="root"` in `index.html`. Use semantic HTML elements or React fragments; never add `<div>` elsewhere.
- **Never add wrapper elements**: Do not add extra elements just for styling—apply layout classes to existing semantic parents or use pace-core layout components.
- **Typography**: Never add text styling overrides. Rely on pace-core typography defaults only.
- **Layout**: Use grid or native HTML flow only; do not use flex. Prefer inline/inline-block for simple single rows, normal flow for basic single column, and grid for advanced or multi-axis layouts.

## Complete Example

### `src/app.css`

```css
@import "tailwindcss";

/* @source directives for Tailwind v4 content scanning */
@source "./**/*.{js,ts,jsx,tsx}";
@source "../node_modules/@jmruthers/pace-core/src/**/*.{js,ts,jsx,tsx}";

/* Import pace-core CSS files so Tailwind processes them */
@import "@jmruthers/pace-core/styles/core.css";

@theme static {
  /* Your app's color palettes */
  --color-main-raw: oklch(0.58 0.23 300);
  --color-main-50: oklch(0.98 0.003 300);
  /* ... continue through 950 for main, sec, and acc */
}
```

### `src/main.tsx`

```tsx
import { createRoot } from 'react-dom/client';
import App from './App';
import './app.css';  // ✅ Import app.css (which imports core.css)

createRoot(document.getElementById('root')!).render(<App />);
```

## Verification Checklist

Before committing, verify:

- [ ] `src/app.css` exists and follows the structure above
- [ ] `@source` directives use correct paths (relative to `src/app.css`)
- [ ] `@import "@jmruthers/pace-core/styles/core.css";` is in `app.css` (not in `main.tsx`)
- [ ] All three color palettes (main, sec, acc) are defined with all shades (50-950)
- [ ] `app.css` is imported in `main.tsx` (not `core.css`)
- [ ] No duplicate imports of `core.css`

## Common Mistakes

### ❌ Mistake 1: Wrong @source Paths

```css
/* ❌ WRONG */
@source "../../node_modules/@jmruthers/pace-core/src/**/*.{js,ts,jsx,tsx}";
```

**Fix:** Use `../node_modules/` (one level up, not two)

### ❌ Mistake 2: Importing core.css in main.tsx

```tsx
// ❌ WRONG
import '@jmruthers/pace-core/styles/core.css';
import './app.css';
```

**Fix:** Only import `app.css` in `main.tsx`. The `app.css` file imports `core.css`.

### ❌ Mistake 3: Using /src/styles/ Path

```css
/* ❌ WRONG */
@import "@jmruthers/pace-core/src/styles/core.css";
```

**Fix:** Use `@jmruthers/pace-core/styles/core.css` (package path, not source path)

### ❌ Mistake 4: Missing Color Shades

```css
/* ❌ WRONG - Missing shades */
@theme static {
  --color-main-500: oklch(0.75 0.133 300);
  /* Missing 50, 100, 200, etc. */
}
```

**Fix:** Include all shades (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950) plus `-raw` for each palette

### ❌ Mistake 5: Wrong App Source Path

```css
/* ❌ WRONG - If app.css is in src/ */
@source "../src/**/*.{js,ts,jsx,tsx}";
```

**Fix:** Use `./**/*.{js,ts,jsx,tsx}` when `app.css` is in `src/`

## Troubleshooting

### Components Appear Unstyled

1. **Check @source directives:** Verify paths are correct relative to `src/app.css`
2. **Check CSS import:** Ensure `@import "@jmruthers/pace-core/styles/core.css";` is in `app.css`
3. **Check app.css import:** Ensure `import './app.css';` is in `main.tsx`
4. **Clear build cache:** Delete `dist/`, `.vite/`, and rebuild

### Colors Don't Work

1. **Check color palettes:** Verify all shades (50-950) are defined for main, sec, and acc
2. **Check @theme static:** Ensure color variables are in `@theme static` block
3. **Check import order:** Ensure `core.css` is imported before `@theme static` in `app.css`

### Tailwind Classes Missing

1. **Check @source directives:** Verify pace-core source is being scanned
2. **Check build output:** Look for warnings about missing classes
3. **Verify package version:** Ensure you're using a recent version of pace-core

## ESLint Rules

Rule IDs use the plugin prefix **`pace-core-compliance/`**. The following rules enforce styling and markup standards:

- **`pace-core-compliance/no-inline-styles`** — Disallow `style={{...}}`; use pace-core or Tailwind.
- **`pace-core-compliance/no-typography-styling`** — Disallow typography/color/spacing classes on typography elements (per standard).
- **`pace-core-compliance/no-pace-core-style-override`** — Disallow overriding className on pace-core components.
- **`pace-core-compliance/prefer-semantic-html`** — Prefer semantic elements over `<div>`/`<span>`.
- **`pace-core-compliance/no-nested-same-type-tags`** — Disallow redundant nesting of same semantic type.

These rules are part of the `pace-core-compliance` plugin and are enabled when extending `@jmruthers/pace-core/eslint-config`.

## Related Documentation

- [Standards Overview](./0-standards-overview.md) - Standards system overview
- [Project Structure](./1-project-structure-standards.md) - File organization standards
- [Architecture](./2-architecture-standards.md) - Component development standards

---

**Last Updated:** 2025-01-28  
**Version:** 2.0.0  
**Applies to:** All consuming apps using `@jmruthers/pace-core`

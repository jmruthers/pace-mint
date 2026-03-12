# Code Quality Standards

**🤖 Cursor Rule**: See [06-code-quality.mdc](../cursor-rules/06-code-quality.mdc) for AI-optimized directives that automatically enforce code quality standards.

**🔧 ESLint Rules**: See [04-code-quality.cjs](../../packages/core/eslint-rules/rules/04-code-quality.cjs) for mechanically checkable code quality rules.

## Purpose

This standard defines TypeScript rules, naming conventions, and code style patterns to ensure consistent, maintainable, and type-safe code across pace-core and consuming apps.

---

## How each layer enforces this standard

- **Standards (this doc):** Source of truth; defines TypeScript rules, naming conventions, patterns, and accessibility (WCAG 2.1 AA).
- **Cursor rule:** `06-code-quality.mdc` — AI guidance when editing `src/**/*.{ts,tsx,js,jsx}`; points to this doc.
- **ESLint:** Rules in `04-code-quality.cjs` (plugin prefix `pace-core-compliance/`): `naming-convention`, `component-naming`, `type-naming`. Run via lint step in CI and locally.
- **Audit tool:** Standard 6 audit runs as part of `npm run validate`; checks TypeScript config (strict mode), test coverage config (vitest), and excessive/debug console logging. Report: `audit/<timestamp>-pace-core-audit.md`. For pace-core development, run `npm run validate` from the repository root.

---

## Audit issue types and where to read

| Audit issue type           | See section in this doc                              |
|----------------------------|------------------------------------------------------|
| typescriptConfig           | TypeScript Rules (Avoid Implicit any / tsconfig)     |
| testCoverage               | (Standard 8) Vitest coverage: use `test.coverage`, provider `istanbul`, include/exclude so report shows only owned source |
| excessiveConsoleLogging   | Forbidden Patterns / code hygiene                   |
| debugConsoleLogging       | Forbidden Patterns / code hygiene                   |

---

## TypeScript Rules

### No `any` Type

**Never use `any`. Use `unknown` for truly unknown types, then narrow with type guards.**

```typescript
// ❌ WRONG - Using any
function processData(data: any) {
  return data.value;
}

// ✅ CORRECT - Using unknown with type guard
function isDataObject(value: unknown): value is { value: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    typeof (value as { value: unknown }).value === 'string'
  );
}

function processData(data: unknown) {
  if (isDataObject(data)) {
    return data.value; // TypeScript knows data.value is string
  }
  throw new Error('Invalid data');
}
```

### Prefer Discriminated Unions

**Use discriminated unions instead of boolean mode flags.**

```typescript
// ❌ WRONG - Boolean flag
interface ComponentProps {
  mode: 'create' | 'edit';
  isEditing: boolean; // Redundant with mode
}

// ✅ CORRECT - Discriminated union
type ComponentProps =
  | { mode: 'create'; initialData?: never }
  | { mode: 'edit'; initialData: Event };

function Component(props: ComponentProps) {
  if (props.mode === 'create') {
    // TypeScript knows initialData doesn't exist
    return <CreateForm />;
  }
  // TypeScript knows initialData exists
  return <EditForm data={props.initialData} />;
}
```

### Avoid Type Assertions

**Avoid type assertions unless in escape hatches. Prefer type guards.**

```typescript
// ❌ WRONG - Type assertion
function getValue(data: unknown): string {
  return (data as { value: string }).value; // Unsafe
}

// ✅ CORRECT - Type guard
function isValueObject(data: unknown): data is { value: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'value' in data &&
    typeof (data as { value: unknown }).value === 'string'
  );
}

function getValue(data: unknown): string {
  if (isValueObject(data)) {
    return data.value; // Type-safe
  }
  throw new Error('Invalid data');
}
```

### Use ReadonlyArray Where Possible

**Prefer `ReadonlyArray` for arrays that shouldn't be mutated.**

```typescript
// ❌ WRONG - Mutable array
function processItems(items: string[]) {
  items.push('new'); // Mutates input
  return items;
}

// ✅ CORRECT - Readonly array
function processItems(items: ReadonlyArray<string>): string[] {
  return [...items, 'new']; // Creates new array
}
```

### Avoid Implicit `any`

**Always provide explicit types. Enable `strict` mode in TypeScript.**

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

---

## Naming Conventions

### Hooks

**Hooks must start with `use` prefix and use camelCase.**

```typescript
// ✅ CORRECT
export function useEventData() { }
export function useUserProfile() { }
export function useDebounce() { }

// ❌ WRONG
export function getEventData() { } // Not a hook
export function UseEventData() { } // Wrong case
```

### Providers

**Providers must end with `Provider` suffix and use PascalCase.**

```typescript
// ✅ CORRECT
export function UnifiedAuthProvider() { }
export function QueryProvider() { }
export function ThemeProvider() { }

// ❌ WRONG
export function unifiedAuthProvider() { } // Wrong case
export function UnifiedAuth() { } // Missing Provider suffix
```

### Utilities

**Utilities use camelCase and should be pure functions when possible.**

```typescript
// ✅ CORRECT
export function formatDate(date: Date): string { }
export function validateEmail(email: string): boolean { }
export function calculateTotal(items: Item[]): number { }

// ❌ WRONG
export function FormatDate() { } // Wrong case
export function format_date() { } // Wrong case
```

### Components

**Components use PascalCase.**

```typescript
// ✅ CORRECT
export function EventCard() { }
export function UserProfile() { }
export const Button = () => { };

// ❌ WRONG
export function eventCard() { } // Wrong case
export function event_card() { } // Wrong case
```

### Types and Interfaces

**Types and interfaces use PascalCase. Prefer `type` for unions/intersections, `interface` for objects.**

```typescript
// ✅ CORRECT
export type EventStatus = 'draft' | 'published' | 'archived';
export interface Event {
  id: string;
  title: string;
}

// ❌ WRONG
export type eventStatus = 'draft' | 'published'; // Wrong case
export interface event { } // Wrong case
```

---

## Preferred Patterns

### Pure Functions

**Prefer pure functions that don't have side effects.**

```typescript
// ✅ CORRECT - Pure function
function calculateTotal(items: ReadonlyArray<Item>): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ WRONG - Side effect
function calculateTotal(items: Item[]): number {
  let total = 0;
  items.forEach(item => {
    total += item.price;
    console.log(item); // Side effect
  });
  return total;
}
```

### Composition Over Inheritance

**Prefer composition and functional patterns over class inheritance.**

```typescript
// ❌ WRONG - Class inheritance
class BaseService {
  protected baseUrl: string;
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
}

class EventService extends BaseService {
  getEvents() {
    return fetch(`${this.baseUrl}/events`);
  }
}

// ✅ CORRECT - Composition
function createApiClient(baseUrl: string) {
  return {
    get: (path: string) => fetch(`${baseUrl}${path}`),
    post: (path: string, data: unknown) => fetch(`${baseUrl}${path}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  };
}

function createEventService(client: ReturnType<typeof createApiClient>) {
  return {
    getEvents: () => client.get('/events'),
    createEvent: (data: Event) => client.post('/events', data),
  };
}
```

### Early Returns

**Use early returns to reduce nesting and improve readability.**

```typescript
// ❌ WRONG - Deep nesting
function processEvent(event: Event | null): string {
  if (event !== null) {
    if (event.status === 'published') {
      if (event.date > new Date()) {
        return 'Upcoming event';
      } else {
        return 'Past event';
      }
    } else {
      return 'Draft event';
    }
  } else {
    return 'No event';
  }
}

// ✅ CORRECT - Early returns
function processEvent(event: Event | null): string {
  if (event === null) {
    return 'No event';
  }
  
  if (event.status !== 'published') {
    return 'Draft event';
  }
  
  if (event.date > new Date()) {
    return 'Upcoming event';
  }
  
  return 'Past event';
}
```

**Real-World Example: Permission Check with Early Returns**

```typescript
// ✅ CORRECT - Real-world permission check with early returns
async function canUserEditEvent(
  userId: string,
  eventId: string,
  secureSupabase: SupabaseClient
): Promise<boolean> {
  // Early return: No user ID
  if (!userId) {
    return false;
  }
  
  // Early return: No event ID
  if (!eventId) {
    return false;
  }
  
  // Get event
  const { data: event, error } = await secureSupabase
    .from('events')
    .select('organisation_id, status, created_by')
    .eq('id', eventId)
    .single();
  
  // Early return: Event not found
  if (error || !event) {
    return false;
  }
  
  // Early return: Event is archived
  if (event.status === 'archived') {
    return false;
  }
  
  // Check permissions
  const { canUpdate, isLoading } = useResourcePermissions(RESOURCE_NAMES.EVENTS);
  
  // Early return: Permissions still loading
  if (isLoading) {
    return false;
  }
  
  // Check if user created the event (always allow edit for creator)
  if (event.created_by === userId) {
    return true;
  }
  
  // Check RBAC permissions
  return canUpdate({ organisationId: event.organisation_id });
}

// Usage
async function handleEditClick(eventId: string) {
  const { user } = await secureSupabase.auth.getUser();
  
  if (!user) {
    toast.error('Please log in to edit events');
    return;
  }
  
  const canEdit = await canUserEditEvent(user.id, eventId, secureSupabase);
  
  if (!canEdit) {
    toast.error('You do not have permission to edit this event');
    return;
  }
  
  navigate(`/events/${eventId}/edit`);
}
```

### Small Private Helpers

**Extract complex logic into small, focused helper functions.**

```typescript
// ❌ WRONG - Complex inline logic
function formatEventDisplay(event: Event): string {
  const date = new Date(event.date);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${event.title} - ${month} ${day}, ${year} at ${time}`;
}

// ✅ CORRECT - Extracted helpers
function formatDate(date: Date): string {
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function formatEventDisplay(event: Event): string {
  const date = new Date(event.date);
  return `${event.title} - ${formatDate(date)} at ${formatTime(date)}`;
}
```

---

## Forbidden Patterns

### Implicit `any`

**Never use implicit `any`. Always provide explicit types.**

```typescript
// ❌ WRONG
function process(data) { // Implicit any
  return data.value;
}

// ✅ CORRECT
function process(data: { value: string }): string {
  return data.value;
}
```

### Bloated Components

**Components should be small and focused. Extract logic to hooks/services.**

```tsx
// ❌ WRONG - Bloated component
function EventPage({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissions, setPermissions] = useState(null);
  
  useEffect(() => {
    // 50+ lines of logic
  }, [eventId]);
  
  // 400+ lines of JSX
  return <div>...</div>;
}

// ✅ CORRECT - Focused component
function EventPage({ eventId }: { eventId: string }) {
  const { event, isLoading, error } = useEventData(eventId);
  const { permissions } = useResourcePermissions(RESOURCE_NAMES.EVENTS);
  
  if (isLoading) return <Loading />;
  if (error) return <Error error={error} />;
  
  return <EventDetails event={event} permissions={permissions} />;
}
```

### Domain-Specific Types in pace-core

**pace-core must not contain domain-specific types. These belong in consuming apps.**

```typescript
// ❌ WRONG - Domain type in pace-core
// packages/core/src/types/event.ts
export interface Event {
  id: string;
  name: string;
  date: Date;
}

// ✅ CORRECT - Generic type in pace-core
// packages/core/src/types/common.ts
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// ✅ CORRECT - Domain type in consuming app
// src/types/event.ts
import type { BaseEntity } from '@jmruthers/pace-core';

export interface Event extends BaseEntity {
  name: string;
  date: Date;
}
```

---

## React Patterns

### Functional Components Only

**Use functional components with hooks. No class components.**

```tsx
// ❌ WRONG - Class component
class EventCard extends React.Component<{ event: Event }> {
  render() {
    return <div>{this.props.event.name}</div>;
  }
}

// ✅ CORRECT - Functional component
function EventCard({ event }: { event: Event }) {
  return <div>{event.name}</div>;
}
```

### Proper Hook Dependencies

**Always include all dependencies in hook dependency arrays.**

```tsx
// ❌ WRONG - Missing dependencies
function Component({ id }: { id: string }) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData(id).then(setData);
  }, []); // Missing id dependency
  
  return <div>{data?.name}</div>;
}

// ✅ CORRECT - All dependencies included
function Component({ id }: { id: string }) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData(id).then(setData);
  }, [id]); // All dependencies included
  
  return <div>{data?.name}</div>;
}
```

### Memoization and the React 19 Compiler

**With React 19 and the React Compiler enabled**, the compiler automatically memoizes values and callbacks at build time. In that setup you **SHOULD NOT** add manual `useMemo`, `useCallback`, or `React.memo` for general cases—write pure components and correct dependency arrays; let the compiler handle optimization.

**When the React Compiler is not enabled** (e.g. legacy app, or compiler not yet adopted), use manual memoization only when:

- A value is **expensive to compute** and you have measured a performance problem, or
- A callback is passed to a **memoized child** that would otherwise re-render unnecessarily, or
- You need a **stable reference** for a non-React API (e.g. `useEffect` or a third-party hook that relies on referential equality).

**Best practice:** Prefer relying on the compiler where available. Add manual `useMemo`/`useCallback` only when profiling shows a need or when the compiler is not in use.

```tsx
// ✅ With React Compiler: no manual memoization needed
function Component({ items }: { items: ReadonlyArray<Item> }) {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return <div>Total: {total}</div>;
}

// When compiler is NOT enabled and you have a measured need: memoize expensive work
function ComponentWithoutCompiler({ items }: { items: ReadonlyArray<Item> }) {
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price, 0);
  }, [items]);
  return <div>Total: {total}</div>;
}

// When compiler is NOT enabled and a memoized child needs a stable callback
const MemoizedChild = React.memo(({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick}>Click</button>
));
function Parent() {
  const handleClick = useCallback(() => console.log('clicked'), []);
  return <MemoizedChild onClick={handleClick} />;
}
```

---

## Accessibility Requirements

**MUST** ensure all components and pages meet WCAG 2.1 Level AA standards.

### Core Principles

1. **Semantic HTML** - Use semantic elements (`<main>`, `<section>`, `<article>`, `<nav>`, etc.) instead of `<div>` wrappers
2. **Keyboard Navigation** - All interactive elements must be accessible via keyboard
3. **ARIA Labels** - Provide clear labels for screen readers when visible text isn't sufficient
4. **Focus Management** - Visible focus indicators on all interactive elements
5. **Color Contrast** - Text must meet 4.5:1 contrast ratio (WCAG AA)

### Implementation Requirements

```tsx
// ✅ CORRECT - Semantic HTML with ARIA
<main>
  <h1>Page Title</h1>
  <section aria-labelledby="section-title">
    <h2 id="section-title">Section Title</h2>
    <Button
      aria-label="Delete user"
      aria-describedby="delete-help"
    >
      Delete
    </Button>
    <span id="delete-help" className="sr-only">
      Permanently removes the user account
    </span>
  </section>
</main>

// ❌ WRONG - Non-semantic structure
<div>
  <div className="title">Page Title</div>
  <div>
    <button>Delete</button>
  </div>
</div>
```

### Keyboard Navigation

**MUST** ensure all interactive elements are keyboard accessible:

```tsx
// ✅ CORRECT - pace-core components handle keyboard navigation automatically
import { Button, DataTable } from '@jmruthers/pace-core';

<Button onClick={handleClick}>Click me</Button>
<DataTable data={data} columns={columns} />
```

### Screen Reader Support

**MUST** provide appropriate ARIA attributes:

```tsx
// ✅ CORRECT - ARIA labels for icons
<Button aria-label="Close dialog">
  <Icon name="x" aria-hidden="true" />
</Button>

// ✅ CORRECT - Error messages with role="alert"
{error && (
  <div role="alert" aria-live="polite">
    {error.message}
  </div>
)}

// ✅ CORRECT - Loading states
<div role="status" aria-live="polite" aria-busy={loading}>
  {loading && <span className="sr-only">Loading data...</span>}
  {loading ? <Spinner /> : <Content />}
</div>
```

### Testing Accessibility

**MUST** test with:
- Keyboard navigation (Tab, Enter, Space, Arrow keys)
- Screen readers (NVDA, JAWS, VoiceOver)
- Automated tools (axe DevTools, WAVE, Lighthouse)

**Accessibility Checklist:**
- [ ] All interactive elements keyboard accessible
- [ ] Visible focus indicators on all interactive elements
- [ ] ARIA labels provided for icons and images
- [ ] Semantic HTML used appropriately
- [ ] Error messages properly associated with form fields
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Screen reader announcements work correctly
- [ ] Focus management in modals and dynamic content

## Code Quality Checklist

Before committing code, verify:

- [ ] No `any` types (use `unknown` with type guards)
- [ ] No implicit `any` (TypeScript `strict` mode enabled)
- [ ] Discriminated unions used instead of boolean flags
- [ ] Type assertions avoided (use type guards)
- [ ] `ReadonlyArray` used for immutable arrays
- [ ] Naming conventions followed (hooks: `use*`, providers: `*Provider`, etc.)
- [ ] Pure functions preferred (no side effects)
- [ ] Early returns used to reduce nesting
- [ ] Complex logic extracted to helpers
- [ ] Components are small and focused
- [ ] No domain-specific types in pace-core
- [ ] Functional components only (no class components)
- [ ] Hook dependencies are complete
- [ ] Memoization used when appropriate
- [ ] Accessibility requirements met (WCAG 2.1 AA)
- [ ] Keyboard navigation supported
- [ ] ARIA labels provided where needed
- [ ] Semantic HTML used appropriately

---

## ESLint Rules

Rule IDs use the plugin prefix **`pace-core-compliance/`**. The following rules enforce code quality standards:

- **`pace-core-compliance/naming-convention`** — Enforces hook naming (`use*`) and provider naming (`*Provider`).
- **`pace-core-compliance/component-naming`** — Enforces component PascalCase.
- **`pace-core-compliance/type-naming`** — Enforces types and interfaces PascalCase.

These rules are part of the `pace-core-compliance` plugin and are automatically enabled when you extend `@jmruthers/pace-core/eslint-config`.

**Setup**: Run `npm run setup` to configure ESLint (and other pace-core tools) in your consuming app.

## Related Documentation

- [Standards Overview](./0-standards-overview.md) - Standards system overview
- [Architecture](./2-architecture-standards.md) - SOLID principles and architecture
- [API & Tech Stack](./4-api-tech-stack-standards.md) - TypeScript configuration
- [Testing & Documentation](./8-testing-documentation-standards.md) - Testing patterns

---

**Last Updated:** 2025-01-28  
**Version:** 2.0.0  
**Applies to:** All pace-core and consuming apps

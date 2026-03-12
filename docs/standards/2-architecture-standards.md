# Architecture Standards

**🤖 Cursor Rule**: See [02-architecture.mdc](../cursor-rules/02-architecture.mdc) for AI-optimized directives that automatically enforce SOLID principles and architectural patterns.

## Purpose

Define the core architectural principles and SOLID expectations for pace-core and consuming apps so components, APIs, and utilities evolve consistently and sustainably.

### How each layer enforces this standard

- **Standards (this doc):** Source of truth; defines SOLID, component design, API design, and boundaries.
- **Cursor rule:** `03-architecture.mdc` — AI guidance when editing `src/**/*.{ts,tsx}`; points to this doc.
- **ESLint:** SRP proxies only: `max-lines-per-function`, `complexity`, `max-lines` (on `src/**` and, in the monorepo, `packages/core/src/**`). Other architecture enforcement is via the Cursor rule and the audit tool.
- **Audit tool:** Standard 2 audit runs as part of `npm run validate`; checks component boundaries (data fetching in components, complex business logic in components) and ApiResult shape usage. Report: `audit/<timestamp>-pace-core-audit.md`. For pace-core development, run `npm run validate` from the repository root.

### Audit issue types and where to read

| Audit issue type   | See section in this doc                                        |
|--------------------|----------------------------------------------------------------|
| componentBoundary  | Component Design Principles / SOLID (Single Responsibility)    |
| apiResult          | API Design Principles (Type-Safe Results)                      |

---

## Architectural Principles

1. **Composition over complexity** - Build complex features from simple, composable pieces
2. **Separation of concerns** - Each module has a single, well-defined responsibility
3. **Domain-agnostic core** - pace-core provides generic primitives, not business logic
4. **Extensible, stable APIs** - APIs should be easy to extend without breaking existing code
5. **Secure by default** - Security is built-in, not bolted on
6. **Performance-conscious** - Consider performance implications in design decisions

---

## SOLID Principles

### Single Responsibility Principle

**Each module has one reason to change; extract complex logic to hooks/services.**

```tsx
// ❌ WRONG - Component doing too much
function EventCard({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Data fetching logic
    fetchEvent(eventId).then(setEvent).finally(() => setLoading(false));
  }, [eventId]);
  
  // Formatting logic
  const formattedDate = new Intl.DateTimeFormat('en-US').format(new Date(event.date));
  
  // Permission checking logic
  const canEdit = checkPermission('edit', event);
  
  // Rendering
  return <div>...</div>;
}

// ✅ CORRECT - Separated concerns
function EventCard({ eventId }: { eventId: string }) {
  const { event, isLoading } = useEventData(eventId); // Hook handles data fetching
  const formattedDate = formatDate(event?.date); // Utility handles formatting
  const { canEdit } = useResourcePermissions(RESOURCE_NAMES.EVENTS); // Hook handles permissions
  
  if (isLoading) return <Loading />;
  return <div>...</div>;
}
```

### Open/Closed Principle

**Extend via composition/configuration, avoid modifying shared primitives.**

```tsx
// ❌ WRONG - Modifying base component
function CustomButton({ children, ...props }) {
  return (
    <Button {...props} className="custom-style">
      {children}
    </Button>
  );
}

// ✅ CORRECT - Extending via composition
function CustomButton({ children, variant = 'default', ...props }) {
  return (
    <Button variant={variant} {...props}>
      {children}
    </Button>
  );
}

// ✅ CORRECT - Using configuration/props
<Button variant="custom" className="additional-styles">
  Click me
</Button>
```

### Liskov Substitution Principle

**Derived types/components must satisfy the base contract.**

```tsx
// ✅ CORRECT - Derived component satisfies base contract
interface BaseButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

function PrimaryButton({ onClick, disabled, children }: BaseButtonProps) {
  return (
    <Button variant="primary" onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  );
}

// Can be used anywhere BaseButtonProps is expected
function ButtonGroup({ buttons }: { buttons: BaseButtonProps[] }) {
  return buttons.map((props, i) => <PrimaryButton key={i} {...props} />);
}
```

### Interface Segregation Principle

**Prefer focused interfaces/props over catch-all configs.**

```tsx
// ❌ WRONG - Catch-all config object
interface ComponentProps {
  config: {
    variant?: string;
    size?: string;
    color?: string;
    disabled?: boolean;
    onClick?: () => void;
    // ... many more
  };
}

// ✅ CORRECT - Focused, specific props
interface ComponentProps {
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}
```

### Dependency Inversion Principle

**Depend on abstractions (types/interfaces); inject implementations.**

```tsx
// ✅ CORRECT - Depend on interface, not implementation
interface DataService {
  fetchEvent(id: string): Promise<Event>;
  updateEvent(id: string, data: Partial<Event>): Promise<Event>;
}

function useEventData(eventId: string, service: DataService) {
  const [event, setEvent] = useState<Event | null>(null);
  
  useEffect(() => {
    service.fetchEvent(eventId).then(setEvent);
  }, [eventId, service]);
  
  return { event };
}

// Can inject different implementations
const supabaseService: DataService = { /* ... */ };
const mockService: DataService = { /* ... */ };
```

### How we check SOLID

Each principle is enforced by one or more layers. The table below shows which layer(s) check what.

| Principle | Standards | Cursor rule | ESLint | Audit tool |
|-----------|-----------|-------------|--------|------------|
| **SRP** | Defined (this doc) | Guidance: extract logic to hooks/services | Proxies: `max-lines-per-function`, `max-lines` (1000), `complexity` (on `src/**`, `packages/core/src/**`) | componentBoundary: data fetching in components, complex business logic (no line or named-export checks; those are in ESLint) |
| **OCP** | Defined (this doc) | Guidance: composition over modification | — | — |
| **LSP** | Defined (this doc) | Guidance: maintain interface contracts | — | — |
| **ISP** | Defined (this doc) | Guidance: focused interfaces | — | Optional: large interface/props count heuristic |
| **DIP** | Defined (this doc) | Guidance: depend on abstractions | — | Partly covered by componentBoundary (data in components) |

**Limitations:** OCP, LSP, ISP, and DIP are enforced by standards and cursor rules only; there are no mechanical checks for them. SRP is partially checked: the audit flags component-boundary violations (data/business logic in components), and ESLint uses length/complexity as proxies for “single reason to change.” Full SRP adherence is not mechanically decidable.

### Size limits (SRP proxies)

**Line-related limits** are enforced only by **ESLint** (single source; audit does not report line counts):

| What | Limit | Enforced by | Why |
|------|-------|--------------|-----|
| **Lines per function** | 400 | ESLint `max-lines-per-function` | Same. |
| **Lines per file** | 1000 | ESLint `max-lines` | Same. |
| **Named exports per file** | 10 | ESLint `pace-core-compliance/max-named-exports` | Same. |

All SRP size limits (lines and named exports) are enforced only by ESLint; the audit does not report them.

---

## Component Design Principles

### Stateless When Possible

**Keep components stateless and composable. Move state to hooks.**

```tsx
// ❌ WRONG - Component manages state
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// ✅ CORRECT - State in hook, component is presentational
function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const increment = () => setCount(c => c + 1);
  return { count, increment };
}

function Counter() {
  const { count, increment } = useCounter();
  return <Button onClick={increment}>{count}</Button>;
}
```

### Accessible by Default

**Components must be accessible with correct roles, keyboard support, and visible focus.** Prefer pace-core `Button` when available; it provides built-in accessibility. This example illustrates accessibility attributes when building a custom primitive.

```tsx
// ✅ CORRECT - Accessible component
function AccessibleButton({ children, onClick, disabled }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      role="button"
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className="focus:outline focus:outline-2 focus:outline-main-500"
    >
      {children}
    </button>
  );
}
```

### UI Primitives Only

**Never add domain logic or data fetching inside components. Use hooks/services instead.**

```tsx
// ❌ WRONG - Domain logic in component
function EventCard({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState(null);
  
  useEffect(() => {
    // Domain-specific logic
    if (eventId.startsWith('EVT-')) {
      fetchEvent(eventId).then(setEvent);
    }
  }, [eventId]);
  
  return <div>{event?.name}</div>;
}

// ✅ CORRECT - Logic in hook
function useEventData(eventId: string) {
  const [event, setEvent] = useState(null);
  
  useEffect(() => {
    if (eventId.startsWith('EVT-')) {
      fetchEvent(eventId).then(setEvent);
    }
  }, [eventId]);
  
  return { event };
}

function EventCard({ eventId }: { eventId: string }) {
  const { event } = useEventData(eventId);
  return <div>{event?.name}</div>;
}
```

### Support Controlled + Uncontrolled Usage

**Components should work in both controlled and uncontrolled modes.**

```tsx
// ✅ CORRECT - Supports both modes
interface InputProps {
  value?: string; // Controlled
  defaultValue?: string; // Uncontrolled
  onChange?: (value: string) => void;
}

function Input({ value, defaultValue, onChange }: InputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  
  const handleChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };
  
  return <input value={currentValue} onChange={e => handleChange(e.target.value)} />;
}
```

**Real-World Example: Search Input Component**

```tsx
// ✅ CORRECT - Real-world search input with debouncing
import { useDebounce } from '@jmruthers/pace-core';
import { Input } from '@jmruthers/pace-core';

interface SearchInputProps {
  value?: string;
  defaultValue?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

function SearchInput({
  value,
  defaultValue,
  onSearch,
  placeholder = 'Search...',
  debounceMs = 300,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  
  // Debounce search calls
  const debouncedValue = useDebounce(currentValue, debounceMs);
  
  useEffect(() => {
    if (debouncedValue && onSearch) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch]);
  
  const handleChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
  };
  
  return (
    <Input
      value={currentValue}
      onChange={handleChange}
      placeholder={placeholder}
      type="search"
      aria-label="Search"
    />
  );
}

// Usage examples:
// Controlled mode (parent manages state)
function ControlledSearch() {
  const [query, setQuery] = useState('');
  
  return (
    <SearchInput
      value={query}
      onSearch={(q) => {
        setQuery(q);
        // Trigger search API call
      }}
    />
  );
}

// Uncontrolled mode (component manages its own state)
function UncontrolledSearch() {
  return (
    <SearchInput
      defaultValue=""
      onSearch={(q) => {
        // Trigger search API call
      }}
    />
  );
}
```

### Small Surface Area

**Keep component APIs small and focused. Prefer composition over configuration.**

```tsx
// ❌ WRONG - Too many props, complex API
interface ComplexComponentProps {
  variant: 'a' | 'b' | 'c' | 'd' | 'e';
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color: 'red' | 'blue' | 'green' | 'yellow';
  position: 'top' | 'bottom' | 'left' | 'right';
  animation: 'fade' | 'slide' | 'zoom';
  // ... 20 more props
}

// ✅ CORRECT - Small, focused API
interface SimpleComponentProps {
  variant?: 'default' | 'primary';
  children: React.ReactNode;
}

// Complex behavior via composition
function ComplexLayout() {
  return (
    <Container>
      <Header variant="primary" />
      <Content />
      <Footer />
    </Container>
  );
}
```

---

## API Design Principles

### Consistent Naming Conventions

**Follow standard naming patterns for RPCs and APIs.**

```typescript
// ✅ CORRECT - Consistent naming
// Format: <family>_<domain>_<verb>
data_events_list
data_events_get
app_events_create
app_events_update
app_events_delete
app_events_bulk_create // Bulk operations use _bulk_ prefix
```

### Type-Safe Results

**Always use type-safe result types for APIs.**

```typescript
// ✅ CORRECT - Type-safe result type
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

async function fetchEvent(id: string): Promise<ApiResult<Event>> {
  try {
    const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
    if (error) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'Event not found' } };
    }
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: 'An error occurred' } };
  }
}
```

### Idempotent Writes

**Write operations should be idempotent when possible.**

```typescript
// ✅ CORRECT - Idempotent update
async function updateEvent(id: string, data: Partial<Event>): Promise<ApiResult<Event>> {
  // Using upsert makes this idempotent
  const { data: event, error } = await supabase
    .from('events')
    .upsert({ id, ...data }, { onConflict: 'id' })
    .select()
    .single();
    
  if (error) {
    return { ok: false, error: { code: 'UPDATE_FAILED', message: error.message } };
  }
  return { ok: true, data: event };
}
```

### Read RPCs Never Mutate

**Read operations must never have side effects.**

```typescript
// ❌ WRONG - Read operation with side effects
async function getEvent(id: string): Promise<Event> {
  // Side effect: updates last_accessed
  await supabase.from('events').update({ last_accessed: new Date() }).eq('id', id);
  const { data } = await supabase.from('events').select('*').eq('id', id).single();
  return data;
}

// ✅ CORRECT - Pure read operation
async function getEvent(id: string): Promise<ApiResult<Event>> {
  const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
  if (error) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Event not found' } };
  }
  return { ok: true, data };
}
```

### Never Accept Dynamic SQL

**Never accept SQL strings as parameters. Use parameterized queries or RPCs.**

```typescript
// ❌ WRONG - Dynamic SQL injection risk
async function executeQuery(sql: string): Promise<any> {
  return supabase.rpc('execute_sql', { sql });
}

// ✅ CORRECT - Parameterized query
async function getEvents(filters: EventFilters): Promise<ApiResult<Event[]>> {
  let query = supabase.from('events').select('*');
  
  if (filters.organisationId) {
    query = query.eq('organisation_id', filters.organisationId);
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  const { data, error } = await query;
  // ...
}
```

---

## Performance & RLS Boundaries

**Note:** Detailed RLS performance requirements are covered in [Security & RBAC Standards](./3-security-rbac-standards.md). This section provides a brief overview.

### RLS Helper Functions

**Policies must rely on helper functions (no subqueries) to avoid N+1/per-row overhead.**

See [Security & RBAC Standards](./3-security-rbac-standards.md) for detailed RLS policy patterns and helper function requirements.

### Test Migrations

**Verify DB migrations for performance regressions and timeouts.**

```bash
# Run migrations with timeout
timeout 120 npm run test:db

# Check for performance issues
supabase advisors performance
```

### Monitor Queries

**Use EXPLAIN/Advisors to ensure policies don't introduce InitPlan nodes.**

See [Security & RBAC Standards](./3-security-rbac-standards.md) for detailed RLS performance monitoring requirements.

---

## In/Out of Scope

### In Scope

pace-core provides:

- **UI primitives** - Buttons, inputs, cards, dialogs, etc.
- **All UI styling** - Typography, spacing, layout, and component styles; apps supply only their colour palettes (see [Styling standards](./7-styling-standards.md)).
- **Generic hooks** - `useDebounce`, `useToast`, `useUnifiedAuth`, etc.
- **Shared API patterns** - Result types, error handling, RPC conventions
- **Error-handling conventions** - Consistent error shapes and recovery
- **RPC shape conventions** - Naming, parameterization, idempotency

### Out of Scope

pace-core does NOT provide:

- **App/domain-specific logic** - Business rules, workflows, domain models
- **App-specific colours only** - Apps define their colour palettes (main/sec/acc in app.css); pace-core provides all other UI styling.
- **Business workflows** - Order processing, user onboarding, etc.

---

## Precedence

When architectural decisions conflict, apply this precedence:

1. **Security** - Security requirements override all others
2. **API/RPC** - API contracts must be stable and consistent
3. **Components** - Component APIs should be simple and composable
4. **Code Style** - Code style and patterns
5. **Testing** - Testing requirements
6. **Documentation** - Documentation requirements

---

## Cursor Checklist

When making architectural changes, verify:

- [ ] Changes fit boundaries (no domain logic in core primitives)
- [ ] Follow SOLID guidance above
- [ ] Prefer additive changes; avoid breaking contracts
- [ ] Keep helpers small, pure, and typed
- [ ] Components are stateless when possible
- [ ] Components are accessible by default
- [ ] APIs use type-safe result types
- [ ] RPCs follow naming conventions
- [ ] Write operations are idempotent when possible
- [ ] No dynamic SQL in APIs

---

## Related Documentation

- [Standards Overview](./0-standards-overview.md) - Standards system overview
- [Code Quality](./6-code-quality-standards.md) - TypeScript and code patterns
- [API & Tech Stack](./4-api-tech-stack-standards.md) - API and RPC standards
- [Security & RBAC](./3-security-rbac-standards.md) - Security and RLS patterns
- [Styling](./7-styling-standards.md) - Component styling patterns

---

**Last Updated:** 2025-01-28  
**Version:** 2.0.0  
**Applies to:** All pace-core and consuming apps

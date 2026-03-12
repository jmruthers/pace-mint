# Operations Standards

**🤖 Cursor Rule**: See [09-operations.mdc](../cursor-rules/09-operations.mdc) for AI-optimized directives that automatically enforce error handling, performance, and CI/CD best practices.

## Purpose

This standard defines error handling patterns, performance optimization strategies, and CI/CD integration patterns to ensure reliable, performant, and maintainable applications.

**Note:** RLS-specific performance requirements are covered in [Security & RBAC Standards](./3-security-rbac-standards.md). This document focuses on general application performance.

---

## How each layer enforces this standard

- **Standards (this doc):** Source of truth; defines error handling patterns (ApiResult, type guards, user-facing vs logging messages), performance optimization (memoization, code splitting, caching), and CI/CD integration (pipeline stages, required checks, package.json scripts).
- **Cursor rule:** `09-operations.mdc` — AI guidance when editing `src/**`, config files, and `.github/workflows/**`; points to this doc.
- **ESLint:** No dedicated Standard 9 rules; error handling and performance patterns are encouraged via the Cursor rule and via overlapping [Code Quality](./6-code-quality-standards.md) / [API & Tech Stack](./4-api-tech-stack-standards.md) rules. Run `npm run lint` as part of CI.
- **Audit tool:** Standard 9 audit runs as part of `npm run validate`; checks error handling patterns (ApiResult usage), CI/CD configuration (.github/workflows), and error boundary usage. Report: `audit/<timestamp>-pace-core-audit.md`. For pace-core development, run `npm run validate` from the repository root.

---

## Audit issue types and where to read

| Audit issue type | See section in this doc |
|------------------|--------------------------|
| errorHandling | Error Handling Patterns; Result Types; API Errors |
| cicd | CI/CD Integration; Required CI Checks |
| errorBoundary | Error Handling Patterns (Pattern 3: Error Boundaries) |

---

## Error Handling Patterns

### Principles

1. **Never expose internal details** in user-facing error messages
2. **Always use type-safe error handling** (no `any` types)
3. **Log errors appropriately** (with context, without sensitive data)
4. **Provide recovery paths** when possible
5. **Use consistent error shapes** across the application

### Error Types

#### API Errors

**Shape:**
```typescript
type ApiError = {
  ok: false;
  error: {
    code: string;        // Machine-readable error code
    message: string;     // User-friendly message
    details?: object;    // Optional additional context (non-sensitive)
  };
};
```

**Example:**
```typescript
// ✅ CORRECT
const result = await apiCall();
if (!result.ok) {
  // result.error.message is user-friendly
  toast.error(result.error.message);
  logger.error('API call failed', { code: result.error.code, details: result.error.details });
}

// ❌ WRONG - Exposing internal details
if (error.message.includes('SQL')) {
  toast.error(error.message); // Exposes database internals
}
```

#### Validation Errors

**Shape:**
```typescript
type ValidationError = {
  field: string;
  message: string;
  code?: string;
};
```

**Example:**
```typescript
// ✅ CORRECT - Using Zod validation
const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(1, 'Name is required'),
});

try {
  const data = schema.parse(formData);
} catch (error) {
  if (error instanceof z.ZodError) {
    // User-friendly validation messages
    error.errors.forEach(err => {
      toast.error(err.message);
    });
  }
}
```

#### Network Errors

**Pattern:**
```typescript
// ✅ CORRECT - Handle network errors gracefully
try {
  const data = await fetchData();
} catch (error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    toast.error('Unable to connect. Please check your internet connection.');
    logger.error('Network error', { error: error.message });
  } else {
    toast.error('An unexpected error occurred. Please try again.');
    logger.error('Unexpected error', { error });
  }
}
```

### Error Handling Patterns

#### Pattern 1: Try-Catch with Type Guards

**Use for:** Known error types that need different handling

```typescript
// ✅ CORRECT
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'ok' in error &&
    (error as ApiError).ok === false &&
    'error' in error
  );
}

try {
  const result = await apiCall();
  if (!result.ok) {
    handleApiError(result.error);
  }
} catch (error) {
  if (isApiError(error)) {
    handleApiError(error.error);
  } else {
    handleUnknownError(error);
  }
}
```

#### Pattern 2: Result Types

**Use for:** Functions that can fail (preferred pattern)

```typescript
// ✅ CORRECT - Using Result type
type Result<T, E = ApiError> = 
  | { ok: true; data: T }
  | { ok: false; error: E };

async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) {
      return { ok: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } };
    }
    return { ok: true, data };
  } catch (error) {
    return { 
      ok: false, 
      error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' } 
    };
  }
}

// Usage
const result = await fetchUser(userId);
if (result.ok) {
  // TypeScript knows result.data exists
  setUser(result.data);
} else {
  // TypeScript knows result.error exists
  toast.error(result.error.message);
}
```

**Real-World Example: Form Submission with Validation**

```typescript
// ✅ CORRECT - Real-world form submission with Result type
async function submitEventForm(formData: EventFormData): Promise<Result<Event>> {
  // 1. Validate input
  const validation = eventFormSchema.safeParse(formData);
  if (!validation.success) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please check your input and try again',
        details: validation.error.errors,
      },
    };
  }

  // 2. Check permissions
  const { canCreate, isLoading } = useResourcePermissions(RESOURCE_NAMES.EVENTS);
  if (isLoading) {
    return {
      ok: false,
      error: {
        code: 'PERMISSION_CHECK_IN_PROGRESS',
        message: 'Please wait while we verify your permissions',
      },
    };
  }
  if (!canCreate({ organisationId: formData.organisationId })) {
    return {
      ok: false,
      error: {
        code: 'PERMISSION_DENIED',
        message: 'You do not have permission to create events',
      },
    };
  }

  // 3. Submit to API
  try {
    const { data, error } = await secureSupabase.rpc('app_events_create', {
      p_name: formData.name,
      p_date: formData.date,
      p_organisation_id: formData.organisationId,
    });

    if (error) {
      // Map database errors to user-friendly messages
      if (error.code === '23505') { // Unique constraint violation
        return {
          ok: false,
          error: {
            code: 'DUPLICATE_EVENT',
            message: 'An event with this name already exists',
          },
        };
      }
      return {
        ok: false,
        error: {
          code: 'CREATE_FAILED',
          message: 'Unable to create event. Please try again.',
        },
      };
    }

    return { ok: true, data };
  } catch (error) {
    logger.error('Unexpected error creating event', { error, formData: { ...formData, password: '[REDACTED]' } });
    return {
      ok: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred. Please try again.',
      },
    };
  }
}

// Usage in component
async function handleSubmit(formData: EventFormData) {
  setIsSubmitting(true);
  const result = await submitEventForm(formData);
  
  if (result.ok) {
    toast.success('Event created successfully');
    navigate(`/events/${result.data.id}`);
  } else {
    // Handle different error types
    if (result.error.code === 'VALIDATION_ERROR') {
      // Show field-level errors
      setFieldErrors(result.error.details);
    } else {
      // Show general error
      toast.error(result.error.message);
    }
  }
  
  setIsSubmitting(false);
}
```

#### Pattern 3: Error Boundaries (React)

**Use for:** Catching React component errors

```tsx
// ✅ CORRECT - Error boundary component
import { ErrorBoundary } from '@jmruthers/pace-core';

function App() {
  return (
    <ErrorBoundary
      fallback={<ErrorFallback />}
      onError={(error, errorInfo) => {
        logger.error('React error boundary caught error', { error, errorInfo });
      }}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

#### Pattern 4: Async Error Handling

**Use for:** Async operations with proper error handling

```typescript
// ✅ CORRECT - Async with error handling
async function loadData() {
  try {
    setIsLoading(true);
    const result = await fetchData();
    if (!result.ok) {
      throw new Error(result.error.message);
    }
    setData(result.data);
  } catch (error) {
    handleError(error);
  } finally {
    setIsLoading(false);
  }
}
```

### Error Messages

#### User-Facing Messages

**MUST:**
- Be user-friendly and actionable
- Not expose internal details (SQL, stack traces, file paths)
- Provide context when helpful
- Be consistent in tone and style

**Examples:**
```typescript
// ✅ CORRECT - User-friendly
'Unable to save changes. Please try again.'
'This field is required.'
'Invalid email address format.'

// ❌ WRONG - Exposes internals
'SQLSTATE[23000]: Integrity constraint violation'
'Cannot read property "data" of undefined'
'/app/src/services/api.ts:123:45'
```

#### Logging Messages

**MUST:**
- Include error context (user ID, operation, etc.)
- Not log sensitive data (passwords, tokens, PII)
- Use structured logging when possible
- Include error codes for correlation

**Examples:**
```typescript
// ✅ CORRECT - Structured logging
logger.error('Failed to save user', {
  userId: user.id,
  operation: 'updateUser',
  errorCode: error.code,
  timestamp: new Date().toISOString(),
});

// ❌ WRONG - Logs sensitive data
logger.error('Failed to save user', {
  password: user.password, // NEVER log passwords
  token: authToken,        // NEVER log tokens
  ssn: user.ssn,          // NEVER log PII
});
```

### Error Recovery

#### Retry Logic

**Use for:** Transient errors (network, timeouts)

```typescript
// ✅ CORRECT - Retry with exponential backoff
async function fetchWithRetry<T>(
  fn: () => Promise<Result<T>>,
  maxRetries = 3
): Promise<Result<T>> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await fn();
    if (result.ok) {
      return result;
    }
    
    // Don't retry on client errors (4xx)
    if (result.error.code?.startsWith('4')) {
      return result;
    }
    
    // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
  }
  
  return { ok: false, error: { code: 'MAX_RETRIES', message: 'Operation failed after retries' } };
}
```

**Real-World Example: File Upload with Retry**

```typescript
// ✅ CORRECT - File upload with retry and progress tracking
async function uploadFileWithRetry(
  file: File,
  onProgress?: (progress: number) => void
): Promise<Result<{ url: string }>> {
  const maxRetries = 3;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });
      
      const result = await new Promise<Result<{ url: string }>>((resolve) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve({ ok: true, data: JSON.parse(xhr.responseText) });
          } else {
            resolve({
              ok: false,
              error: {
                code: `HTTP_${xhr.status}`,
                message: 'File upload failed. Please try again.',
              },
            });
          }
        });
        
        xhr.addEventListener('error', () => {
          resolve({
            ok: false,
            error: {
              code: 'NETWORK_ERROR',
              message: 'Network error. Please check your connection.',
            },
          });
        });
        
        xhr.addEventListener('timeout', () => {
          resolve({
            ok: false,
            error: {
              code: 'TIMEOUT',
              message: 'Upload timed out. Please try again.',
            },
          });
        });
        
        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      });
      
      if (result.ok) {
        return result;
      }
      
      // Don't retry on client errors (4xx) or permission errors
      if (result.error.code?.startsWith('HTTP_4') || result.error.code === 'PERMISSION_DENIED') {
        return result;
      }
      
      // Exponential backoff before retry
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      logger.error('File upload error', { error, attempt, fileName: file.name });
      
      if (attempt === maxRetries - 1) {
        return {
          ok: false,
          error: {
            code: 'UPLOAD_FAILED',
            message: 'File upload failed after multiple attempts. Please try again later.',
          },
        };
      }
    }
  }
  
  return {
    ok: false,
    error: {
      code: 'MAX_RETRIES',
      message: 'File upload failed after multiple attempts.',
    },
  };
}

// Usage in component
function FileUploader() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  async function handleFileSelect(file: File) {
    setIsUploading(true);
    setUploadProgress(0);
    
    const result = await uploadFileWithRetry(file, (progress) => {
      setUploadProgress(progress);
    });
    
    if (result.ok) {
      toast.success('File uploaded successfully');
      setFileUrl(result.data.url);
    } else {
      toast.error(result.error.message);
    }
    
    setIsUploading(false);
  }
  
  return (
    <div>
      <input type="file" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
      {isUploading && <ProgressBar value={uploadProgress} />}
    </div>
  );
}
```

#### Fallback Values

**Use for:** Non-critical data that can have defaults

```typescript
// ✅ CORRECT - Fallback to default
const userPreferences = await fetchUserPreferences().catch(() => ({
  theme: 'light',
  language: 'en',
}));
```

#### Graceful Degradation

**Use for:** Features that can work without optional data

```typescript
// ✅ CORRECT - Graceful degradation
async function loadDashboard() {
  const [events, stats, preferences] = await Promise.allSettled([
    fetchEvents(),
    fetchStats(),
    fetchPreferences(),
  ]);
  
  // Use data that loaded successfully
  if (events.status === 'fulfilled') {
    setEvents(events.value);
  } else {
    logger.warn('Events failed to load', events.reason);
    setEvents([]); // Fallback to empty array
  }
  
  // Similar for stats and preferences
}
```

---

## Performance Optimization

### React Performance

#### Memoization and the React 19 Compiler

**When the React Compiler is enabled** (see [API & Tech Stack](./4-api-tech-stack-standards.md) and [Code Quality](./6-code-quality-standards.md)), it automatically memoizes values, callbacks, and component renders. Do not add manual `useMemo`, `useCallback`, or `React.memo` for general cases—write straightforward code and let the compiler optimize.

**When the React Compiler is not enabled**, add manual memoization only when profiling shows a need:
- **Expensive computations:** `useMemo` when a derivation is costly and causes measurable jank.
- **Stable callbacks:** `useCallback` when a callback is passed to a memoized child and referential equality matters.
- **Expensive components:** `React.memo` when a component is heavy and its parent re-renders often with unchanged props.

Prefer enabling the React Compiler over sprinkling manual memoization.

#### Avoiding Unnecessary Re-renders

**With the React Compiler:** Write normally; the compiler handles object/array identity and re-renders in most cases.

**Without the React Compiler:** If profiling shows that creating new objects/arrays in render causes unnecessary child re-renders, then use `useMemo` (or move the value outside render) for those props. Do not preemptively wrap every object in `useMemo`—only when you have a measured problem.

#### Code Splitting

**Lazy load heavy components:**

```tsx
// ✅ CORRECT - Lazy load
import { lazy, Suspense } from 'react';
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Database Performance

#### Query Optimization

**Use indexes for frequently queried columns:**

```sql
-- ✅ CORRECT - Index on frequently queried column
CREATE INDEX idx_users_organisation_id ON users(organisation_id);
CREATE INDEX idx_events_organisation_id_event_id ON events(organisation_id, event_id);
```

**Avoid N+1 queries:**

```tsx
// ❌ WRONG - N+1 queries
const events = await fetchEvents();
for (const event of events) {
  const users = await fetchEventUsers(event.id); // N queries!
}

// ✅ CORRECT - Single query with join
const eventsWithUsers = await fetchEventsWithUsers(); // 1 query
```

**Use RPC functions for complex queries:**

```tsx
// ✅ CORRECT - RPC for complex query
const { data } = await supabase.rpc('data_events_list', { 
  organisation_id: orgId 
});

// ❌ AVOID - Complex client-side query
const { data } = await supabase
  .from('events')
  .select('*, users(*), organisations(*)')
  .eq('organisation_id', orgId);
```

### Caching Strategies

#### TanStack Query Configuration

**Configure appropriate cache times:**

```tsx
// ✅ CORRECT - Configure cache
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes
      gcTime: 10 * 60 * 1000,       // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
    },
  },
});
```

**Use query keys effectively:**

```tsx
// ✅ CORRECT - Specific query keys
const { data } = useQuery({
  queryKey: ['events', organisationId, eventId],
  queryFn: () => fetchEvent(organisationId, eventId),
});

// ❌ WRONG - Too generic
const { data } = useQuery({
  queryKey: ['events'],
  queryFn: () => fetchEvent(organisationId, eventId),
});
```

#### React Query Optimizations

**Use `keepPreviousData` for pagination:**

```tsx
// ✅ CORRECT - Keep previous data during pagination
const { data } = useQuery({
  queryKey: ['events', page],
  queryFn: () => fetchEvents(page),
  keepPreviousData: true,
});
```

**Use `select` to transform data efficiently:**

```tsx
// ✅ CORRECT - Transform in select (only runs when data changes)
const { data: eventCount } = useQuery({
  queryKey: ['events'],
  queryFn: fetchEvents,
  select: (data) => data.length,
});
```

### Bundle Size Optimization

#### Tree Shaking

**Use named imports:**

```tsx
// ✅ CORRECT - Tree-shakeable
import { Button, Card } from '@jmruthers/pace-core';

// ❌ WRONG - Imports entire library
import * as PaceCore from '@jmruthers/pace-core';
```

#### Dynamic Imports

**Lazy load heavy dependencies:**

```tsx
// ✅ CORRECT - Dynamic import
const HeavyLibrary = lazy(() => import('heavy-library'));

// ❌ WRONG - Eager import
import HeavyLibrary from 'heavy-library';
```

### Performance Monitoring

#### Measuring Performance

**Use React DevTools Profiler:**

1. Open React DevTools
2. Go to Profiler tab
3. Record a session
4. Identify slow components
5. Optimize based on findings

**Use browser DevTools:**

1. Open Performance tab
2. Record page load
3. Identify bottlenecks
4. Optimize critical rendering path

#### Performance Metrics

**Track these metrics:**

- **Time to First Byte (TTFB)** - < 200ms
- **First Contentful Paint (FCP)** - < 1.8s
- **Largest Contentful Paint (LCP)** - < 2.5s
- **Time to Interactive (TTI)** - < 3.8s
- **Cumulative Layout Shift (CLS)** - < 0.1

---

## CI/CD Integration

### Principles

1. **Automate everything** - Manual steps are error-prone
2. **Fail fast** - Catch issues early in the pipeline
3. **Test before deploy** - Never deploy untested code
4. **Security first** - Scan for vulnerabilities
5. **Consistent environments** - Dev, staging, production parity

### CI/CD Pipeline Structure

#### Standard Pipeline Stages

```
1. Lint & Format Check
2. Type Check
3. Unit Tests
4. Integration Tests
5. Build
6. Security Scan
7. Deploy (staging/production)
```

### GitHub Actions Example

#### Basic Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  quality-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Format check
        run: npm run format:check
      
      - name: Run tests
        run: npm run test
      
      - name: Build
        run: npm run build
      
      - name: Security scan
        run: npm audit --audit-level=moderate
```

### Required CI Checks

**Every CI pipeline MUST include:**

1. **Linting** - ESLint with pace-core rules
   ```yaml
   - name: Lint
     run: npm run lint
   ```

2. **Type Checking** - TypeScript compilation
   ```yaml
   - name: Type check
     run: npx tsc --noEmit
   ```

3. **Testing** - Unit and integration tests
   ```yaml
   - name: Run tests
     run: npm run test
   ```

4. **Build** - Verify build succeeds
   ```yaml
   - name: Build
     run: npm run build
   ```

### Package.json Scripts

**MUST have these scripts in `package.json`:**

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage --coverage.provider=istanbul",
    "build": "vite build",
    "format": "prettier --write .",
    "format:check": "prettier --check"
  }
}
```

### Environment Variables

#### CI/CD Secrets

**Store sensitive values as secrets:**

```yaml
# .github/workflows/deploy.yml
env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
  VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
```

**Never commit secrets to repository:**
- Use GitHub Secrets
- Use environment-specific config files
- Use `.env.example` for documentation

### Database Migrations in CI/CD

**For Supabase migrations:**

```yaml
- name: Run migrations
  run: |
    npx supabase db push
    # Or use Supabase CLI
    supabase migration up
```

**Best Practices:**
- Run migrations in staging first
- Test migrations in CI
- Never run destructive migrations automatically
- Use migration review process

### Deployment Strategies

#### Staging Deployment

**Deploy to staging on every merge to `develop`:**

```yaml
deploy-staging:
  if: github.ref == 'refs/heads/develop'
  environment: staging
  steps:
    - name: Deploy to Staging
      run: |
        # Deploy to staging environment
```

#### Production Deployment

**Deploy to production only from `main` branch:**

```yaml
deploy-production:
  if: github.ref == 'refs/heads/main'
  environment: production
  steps:
    - name: Deploy to Production
      run: |
        # Deploy to production environment
```

---

## Checklists

### Error Handling Checklist

Before committing code with error handling, verify:

- [ ] User-facing error messages are friendly and actionable
- [ ] No internal details exposed in user messages
- [ ] Type-safe error handling (no `any` types)
- [ ] Errors are logged with context (no sensitive data)
- [ ] Recovery paths provided when possible
- [ ] Error shapes are consistent
- [ ] Error boundaries used for React components
- [ ] Async operations have proper error handling
- [ ] Validation errors use Zod or similar
- [ ] Network errors handled gracefully

### Performance Checklist

Before committing performance-sensitive code, verify:

- [ ] React Compiler enabled (see API & Tech Stack standard), or manual memoization only where profiling shows a need
- [ ] Heavy components lazy loaded
- [ ] Queries use indexes appropriately
- [ ] No N+1 query patterns
- [ ] TanStack Query configured with appropriate cache times
- [ ] Bundle size optimized (tree shaking, code splitting)
- [ ] Performance metrics measured and acceptable

### CI/CD Checklist

Before setting up CI/CD, verify:

- [ ] Lint check configured
- [ ] Type check configured
- [ ] Tests run in CI
- [ ] Build succeeds in CI
- [ ] Security scan configured
- [ ] Environment variables set as secrets
- [ ] Staging deployment configured
- [ ] Production deployment configured
- [ ] Migration strategy defined
- [ ] Rollback plan documented

---

## Common Mistakes to Avoid

### Error Handling

```typescript
// ❌ WRONG - Expose internal details
toast.error(error.message); // May contain SQL, stack traces, etc.

// ❌ WRONG - Use any for errors
catch (error: any) {
  console.log(error.message);
}

// ❌ WRONG - Log sensitive data
logger.error('Login failed', { password, token });

// ❌ WRONG - Ignore errors
try {
  await riskyOperation();
} catch (error) {
  // Silent failure
}
```

### Performance

```tsx
// ❌ WRONG - Over-memoize (especially with React Compiler enabled)
const simpleValue = useMemo(() => items.length, [items]); // Unnecessary; compiler or no compiler
```

With the React Compiler enabled, writing inline objects or functions in render is fine—the compiler optimizes. Without the compiler, only add `useMemo`/`useCallback` when profiling shows a real problem; do not preemptively wrap everything.

---

## Related Documentation

- [Standards Overview](./0-standards-overview.md) - Standards system overview
- [Security & RBAC](./3-security-rbac-standards.md) - RLS performance requirements
- [Code Quality](./6-code-quality-standards.md) - React performance and memoization
- [API & Tech Stack](./4-api-tech-stack-standards.md) - TanStack Query and React Compiler

---

**Last Updated:** 2025-01-28  
**Version:** 2.0.0  
**Applies to:** All pace-core and consuming apps

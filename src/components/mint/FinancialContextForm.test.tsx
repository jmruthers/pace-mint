import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FinancialContextForm } from './FinancialContextForm'

const defaultFormData = {
  context_type: 'event' as const,
  context_id: 'ev-1',
  organisation_id: 'org-1',
  parent_context_id: '',
  lifecycle_status: 'draft' as const,
  base_currency: 'AUD',
}

let mockPersistReturn: {
  create: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  isPending: boolean
  error: Error | null
}

vi.mock('@/hooks/usePersistFinancialContext', () => ({
  usePersistFinancialContext: () => mockPersistReturn,
}))

/* eslint-disable pace-core-compliance/prefer-pace-core-form, pace-core-compliance/prefer-pace-core-components -- test mock */
vi.mock('@jmruthers/pace-core', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@jmruthers/pace-core')>()
  return {
    ...orig,
    Form: ({
      children,
      onSubmit,
    }: {
      children: React.ReactNode
      onSubmit?: (data: typeof defaultFormData) => void
    }) => (
      <form
        data-testid="financial-context-form-mock"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit?.(defaultFormData)
        }}
      >
        {children}
      </form>
    ),
    FormField: ({ name, label }: { name: string; label?: string }) => (
      <section>
        {label && <label>{label}</label>}
        <input name={name} />
      </section>
    ),
  }
})

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('FinancialContextForm', () => {
  beforeEach(() => {
    mockPersistReturn = {
      create: vi.fn().mockResolvedValue({ ok: true, data: { id: 'new-1', ...defaultFormData } }),
      update: vi.fn().mockResolvedValue({ ok: true, data: { id: 'ctx-1', ...defaultFormData } }),
      isPending: false,
      error: null,
    }
  })

  it('renders create form with context type and base currency', () => {
    render(<FinancialContextForm onSuccess={vi.fn()} />, { wrapper })
    expect(screen.getByRole('heading', { name: 'Create financial context' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
  })

  it('renders edit form when existing provided', () => {
    render(
      <FinancialContextForm
        existing={{
          id: 'ctx-1',
          context_type: 'event',
          context_id: 'ev-1',
          organisation_id: 'org-1',
          parent_context_id: null,
          lifecycle_status: 'draft',
          base_currency: 'AUD',
        }}
        onSuccess={vi.fn()}
      />,
      { wrapper }
    )
    expect(screen.getByRole('heading', { name: 'Edit financial context' })).toBeInTheDocument()
  })

  it('shows error when usePersistFinancialContext returns error', () => {
    mockPersistReturn.error = new Error('Create failed')
    render(<FinancialContextForm />, { wrapper })
    expect(screen.getAllByRole('alert').some((el) => el.textContent === 'Create failed')).toBe(true)
  })

  it('renders Cancel when onCancel provided', () => {
    const onCancel = vi.fn()
    render(<FinancialContextForm onCancel={onCancel} />, { wrapper })
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })
})

/**
 * Tests that use real hooks and seeded store to cover page branches.
 * Excluded from coverage exclude list so page code is covered when run.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as store from '@/services/mint/context-store'
import * as contexts from '@/services/mint/contexts'
import { FinancialContextPage } from './FinancialContextPage'

vi.mock('@jmruthers/pace-core/rbac', () => ({
  PagePermissionGuard: ({
    children,
  }: {
    children: React.ReactNode
    pageName: string
    operation: string
  }) => <>{children}</>,
}))

let mockEventId: string | null = null
vi.mock('@/hooks/useEventFinanceContext', () => ({
  useEventFinanceContext: () => ({ eventId: mockEventId }),
}))

vi.mock('@/components/mint/FinancialContextForm', () => ({
  FinancialContextForm: () => <div data-testid="financial-context-form">Form</div>,
}))
vi.mock('@/components/mint/DimensionConfigPanel', () => ({
  DimensionConfigPanel: ({ contextId }: { contextId: string | null }) => (
    <div data-testid="dimension-config-panel">Dimensions for {contextId}</div>
  ),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('FinancialContextPage with real hooks', () => {
  beforeEach(() => {
    mockEventId = null
    store.contextStore.clear()
    store.contextCurrenciesStore.clear()
    store.contextVariablesStore.clear()
    store.dimensionDefinitionsStore.clear()
  })

  it('shows context card and selected section after Select', async () => {
    const created = await contexts.createFinancialContext({
      context_type: 'membership_program',
      context_id: 'mp-1',
      organisation_id: 'org-1',
      lifecycle_status: 'draft',
      base_currency: 'AUD',
    })
    if (!created.ok) throw new Error('create failed')

    render(<FinancialContextPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'membership_program / mp-1' })).toBeInTheDocument()
    })

    const selectButtons = screen.getAllByRole('button', { name: 'Select' })
    fireEvent.click(selectButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('dimension-config-panel')).toHaveTextContent('Dimensions for ' + created.data.id)
    })
    expect(screen.getByRole('heading', { name: 'Currencies and variables' })).toBeInTheDocument()
  })

  it('shows event-type card and Configuring message when event has context', async () => {
    mockEventId = 'ev-1'
    const created = await contexts.createFinancialContext({
      context_type: 'event',
      context_id: 'ev-1',
      organisation_id: 'org-1',
      lifecycle_status: 'draft',
      base_currency: 'AUD',
    })
    if (!created.ok) throw new Error('create failed')

    render(<FinancialContextPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Configuring financial context for selected event.')).toBeInTheDocument()
    })
    expect(screen.getByText(/Event-type context: use VariableConfigPanel/)).toBeInTheDocument()
  })

  it('shows no financial context for event when event has no context', async () => {
    mockEventId = 'ev-no-ctx'
    render(<FinancialContextPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('No financial context for this event yet. Create one below.')).toBeInTheDocument()
    })
  })
})

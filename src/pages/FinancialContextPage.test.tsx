import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FinancialContextPage } from './FinancialContextPage'
import type { FinancialContext } from '@/types/finance'

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
let mockResolvedContextId: string | null = null
let mockContextsList: FinancialContext[] = []
let mockListLoading = false
let mockListError: Error | null = null
let mockSelectedContextDetail: FinancialContext | null = null

vi.mock('@/hooks/useEventFinanceContext', () => ({
  useEventFinanceContext: () => ({ eventId: mockEventId }),
}))

vi.mock('@/hooks/useResolvedEventContextId', () => ({
  useResolvedEventContextId: () => ({ contextId: mockResolvedContextId, isLoading: false }),
}))

vi.mock('@/hooks/useFinancialContextsList', () => ({
  useFinancialContextsList: () => ({
    data: mockContextsList,
    isLoading: mockListLoading,
    error: mockListError,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/hooks/useFinancialContext', () => ({
  useFinancialContext: (id: string) => ({
    data: id ? mockSelectedContextDetail : null,
  }),
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

const oneContext: FinancialContext = {
  id: 'ctx-1',
  context_type: 'event',
  context_id: 'ev-1',
  organisation_id: 'org-1',
  parent_context_id: null,
  lifecycle_status: 'draft',
  base_currency: 'AUD',
}

describe('FinancialContextPage', () => {
  beforeEach(() => {
    mockEventId = null
    mockResolvedContextId = null
    mockContextsList = []
    mockListLoading = false
    mockListError = null
    mockSelectedContextDetail = null
  })

  it('renders financial context heading and intro', () => {
    render(<FinancialContextPage />, { wrapper })
    expect(screen.getByRole('heading', { name: 'Financial context' })).toBeInTheDocument()
    expect(screen.getByText(/A financial context defines who owns/)).toBeInTheDocument()
  })

  it('shows create details and empty list message', () => {
    render(<FinancialContextPage />, { wrapper })
    expect(screen.getAllByTestId('financial-context-form').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('No financial contexts yet. Create one above.').length).toBeGreaterThanOrEqual(1)
  })

  it('shows list error when useFinancialContextsList returns error', () => {
    mockListError = new Error('List failed')
    render(<FinancialContextPage />, { wrapper })
    expect(screen.getByRole('alert')).toHaveTextContent('List failed')
  })

  it('shows loading when list is loading', () => {
    mockListLoading = true
    render(<FinancialContextPage />, { wrapper })
    expect(screen.getByText('Loading contexts…')).toBeInTheDocument()
  })

  it('shows context cards and Select sets selected context', () => {
    mockContextsList = [oneContext]
    mockSelectedContextDetail = oneContext
    render(<FinancialContextPage />, { wrapper })
    expect(screen.getByRole('heading', { name: 'event / ev-1' })).toBeInTheDocument()
    const selectBtn = screen.getAllByRole('button', { name: 'Select' })[0]
    fireEvent.click(selectBtn)
    expect(screen.getByTestId('dimension-config-panel')).toHaveTextContent('Dimensions for ctx-1')
    expect(screen.getByText(/Event-type context: use VariableConfigPanel/)).toBeInTheDocument()
  })

  it('shows event hint in intro when eventId is set', () => {
    mockEventId = 'ev-99'
    render(<FinancialContextPage />, { wrapper })
    expect(screen.getByText(/When an event is selected in the header/)).toBeInTheDocument()
  })

  it('shows no financial context for event when eventId set and no resolved context', () => {
    mockEventId = 'ev-99'
    mockResolvedContextId = null
    render(<FinancialContextPage />, { wrapper })
    expect(screen.getAllByText('No financial context for this event yet. Create one below.').length).toBeGreaterThanOrEqual(1)
  })

  it('shows Configuring financial context for selected event when isFromEvent', () => {
    mockContextsList = [oneContext]
    mockResolvedContextId = oneContext.id
    mockSelectedContextDetail = oneContext
    mockEventId = 'ev-1'
    render(<FinancialContextPage />, { wrapper })
    expect(screen.getByText('Configuring financial context for selected event.')).toBeInTheDocument()
  })

  it('Edit opens editing form', () => {
    mockContextsList = [oneContext]
    render(<FinancialContextPage />, { wrapper })
    const editBtn = screen.getAllByRole('button', { name: 'Edit' })[0]
    fireEvent.click(editBtn)
    expect(screen.getAllByTestId('financial-context-form').length).toBeGreaterThanOrEqual(2)
  })

})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DimensionConfigPanel } from './DimensionConfigPanel'

const defineDimensionFn = vi.fn().mockResolvedValue({ ok: true })

let mockDimensionConfigReturn: {
  dimensions: Array<{ id: string; context_id: string; name: string; key: string; description?: string | null }>
  isLoading: boolean
  error: Error | null
  defineDimension: ReturnType<typeof vi.fn>
  isPending: boolean
  defineError: Error | null
  formKey: number
  refetch: ReturnType<typeof vi.fn>
}

vi.mock('@/hooks/useDimensionConfig', () => ({
  useDimensionConfig: (_contextId: string | null) => mockDimensionConfigReturn,
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
      onSubmit?: (data: { name: string; key: string; description?: string }) => void
    }) => (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit?.({ name: 'Region', key: 'region', description: 'Optional desc' })
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
    DataTable: ({
      data,
      emptyState,
    }: {
      data: Array<{ id: string; name: string; key: string; description?: string | null }>
      emptyState?: { title?: string; description?: string }
    }) => (
      <div data-testid="dimensions-datatable">
        {data.length === 0 ? (
          <p>{emptyState?.title ?? 'No dimensions defined yet'}. {emptyState?.description ?? 'Add one above.'}</p>
        ) : (
          <table>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.key}</td>
                  <td>{row.description ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    ),
  }
})

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('DimensionConfigPanel', () => {
  beforeEach(() => {
    defineDimensionFn.mockClear()
    mockDimensionConfigReturn = {
      dimensions: [],
      isLoading: false,
      error: null,
      defineDimension: defineDimensionFn,
      isPending: false,
      defineError: null,
      formKey: 0,
      refetch: vi.fn(),
    }
  })

  it('returns null when contextId is null', () => {
    const { container } = render(<DimensionConfigPanel contextId={null} />, { wrapper })
    expect(container.firstChild).toBeNull()
  })

  it('renders Dimensions card and add form when contextId provided', () => {
    render(<DimensionConfigPanel contextId="ctx-1" />, { wrapper })
    expect(screen.getByRole('heading', { name: 'Dimensions' })).toBeInTheDocument()
    expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('button', { name: 'Add dimension' })).toBeInTheDocument()
  })

  it('calls defineDimension when add form is submitted', async () => {
    render(<DimensionConfigPanel contextId="ctx-1" />, { wrapper })
    const addBtn = screen.getAllByRole('button', { name: 'Add dimension' })[0]
    fireEvent.submit(addBtn.closest('form')!)
    await vi.waitFor(() => {
      expect(defineDimensionFn).toHaveBeenCalledWith({
        context_id: 'ctx-1',
        name: 'Region',
        key: 'region',
        description: 'Optional desc',
      })
    })
  })

  it('shows loading and then table when dimensions provided', () => {
    mockDimensionConfigReturn.dimensions = [
      { id: 'dim-1', context_id: 'ctx-1', name: 'Program', key: 'program', description: 'Program dimension' },
    ]
    render(<DimensionConfigPanel contextId="ctx-1" />, { wrapper })
    expect(screen.getByText('Program')).toBeInTheDocument()
    expect(screen.getByText('program')).toBeInTheDocument()
    expect(screen.getByText('Program dimension')).toBeInTheDocument()
  })

  it('shows empty description as empty string in table', () => {
    mockDimensionConfigReturn.dimensions = [
      { id: 'dim-2', context_id: 'ctx-1', name: 'Fund', key: 'fund', description: null },
    ]
    render(<DimensionConfigPanel contextId="ctx-1" />, { wrapper })
    const cells = screen.getAllByRole('cell')
    expect(cells.some((c) => c.textContent === '')).toBe(true)
  })

  it('shows defineError in alert', () => {
    mockDimensionConfigReturn.defineError = new Error('Define failed')
    render(<DimensionConfigPanel contextId="ctx-1" />, { wrapper })
    expect(screen.getAllByRole('alert').some((el) => el.textContent === 'Define failed')).toBe(true)
  })

  it('shows error in alert when list error set', () => {
    mockDimensionConfigReturn.error = new Error('Load failed')
    render(<DimensionConfigPanel contextId="ctx-1" />, { wrapper })
    expect(screen.getAllByRole('alert').some((el) => el.textContent === 'Load failed')).toBe(true)
  })

  it('shows loading dimensions message when isLoading', () => {
    mockDimensionConfigReturn.isLoading = true
    render(<DimensionConfigPanel contextId="ctx-1" />, { wrapper })
    expect(screen.getByText('Loading dimensions…')).toBeInTheDocument()
  })

  it('shows no dimensions message when not loading and empty', () => {
    render(<DimensionConfigPanel contextId="ctx-1" />, { wrapper })
    expect(screen.getAllByTestId('dimensions-datatable').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/No dimensions defined yet/).length).toBeGreaterThanOrEqual(1)
  })
})

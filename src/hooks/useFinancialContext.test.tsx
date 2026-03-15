import { type ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as contextServices from '@/services/mint/contexts'
import { useFinancialContext } from './useFinancialContext'

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useFinancialContext', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null data when contextId is empty', () => {
    const { result } = renderHook(() => useFinancialContext(''), { wrapper })
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('returns context when id exists', async () => {
    const created = await contextServices.createFinancialContext({
      context_type: 'event',
      context_id: 'ev-1',
      organisation_id: 'org-1',
      lifecycle_status: 'draft',
      base_currency: 'AUD',
    })
    if (!created.ok) return
    const { result } = renderHook(() => useFinancialContext(created.data.id), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.id).toBe(created.data.id)
  })

  it('returns error when getFinancialContext fails', async () => {
    vi.spyOn(contextServices, 'getFinancialContext').mockResolvedValueOnce({
      ok: false,
      error: { code: 'ERR', message: 'Not found' },
    })
    const { result } = renderHook(() => useFinancialContext('ctx-1'), { wrapper })
    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.error?.message).toBe('Not found')
    expect(result.current.data).toBeNull()
  })
})

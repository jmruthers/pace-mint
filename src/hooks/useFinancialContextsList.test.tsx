import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as contextServices from '@/services/mint/contexts'
import { useFinancialContextsList } from './useFinancialContextsList'

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useFinancialContextsList', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns list shape', async () => {
    const { result } = renderHook(() => useFinancialContextsList(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(Array.isArray(result.current.data)).toBe(true)
  })

  it('returns error when listFinancialContexts fails', async () => {
    vi.spyOn(contextServices, 'listFinancialContexts').mockResolvedValueOnce({
      ok: false,
      error: { code: 'ERR', message: 'List failed' },
    })
    const { result } = renderHook(() => useFinancialContextsList(), { wrapper })
    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.error?.message).toBe('List failed')
    expect(result.current.data).toEqual([])
  })
})

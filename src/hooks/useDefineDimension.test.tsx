import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDefineDimension } from './useDefineDimension'
import * as contexts from '@/services/mint/contexts'

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useDefineDimension', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('defineDimension returns ok with new dimension', async () => {
    const created = await contexts.createFinancialContext({
      context_type: 'event',
      context_id: 'ev-1',
      organisation_id: 'org-1',
      lifecycle_status: 'draft',
      base_currency: 'AUD',
    })
    if (!created.ok) return
    const { result } = renderHook(() => useDefineDimension(), { wrapper })
    const apiResult = await result.current.defineDimension({
      context_id: created.data.id,
      name: 'Fund',
      key: 'fund',
    })
    expect(apiResult.ok).toBe(true)
    if (apiResult.ok) expect(apiResult.data.name).toBe('Fund')
  })

  it('defineDimension returns ok: false when service fails', async () => {
    vi.spyOn(contexts, 'defineDimension').mockResolvedValueOnce({
      ok: false,
      error: { code: 'ERR', message: 'Define failed' },
    })
    const { result } = renderHook(() => useDefineDimension(), { wrapper })
    const apiResult = await result.current.defineDimension({
      context_id: 'ctx-1',
      name: 'X',
      key: 'x',
    })
    expect(apiResult.ok).toBe(false)
    if (!apiResult.ok) expect(apiResult.error.message).toBe('Define failed')
  })

  it('defineDimension returns ok: false when mutation throws non-Error', async () => {
    vi.spyOn(contexts, 'defineDimension').mockRejectedValueOnce('string throw')
    const { result } = renderHook(() => useDefineDimension(), { wrapper })
    const apiResult = await result.current.defineDimension({
      context_id: 'ctx-1',
      name: 'X',
      key: 'x',
    })
    expect(apiResult.ok).toBe(false)
    if (!apiResult.ok) expect(apiResult.error.message).toBe('Failed')
  })
})

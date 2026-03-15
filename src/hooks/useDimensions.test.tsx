import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as contextsRead from '@/services/mint/contexts-read'
import { useDimensions } from './useDimensions'
import * as contexts from '@/services/mint/contexts'

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useDimensions', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty array when contextId is undefined', () => {
    const { result } = renderHook(() => useDimensions(undefined), { wrapper })
    expect(result.current.data).toEqual([])
  })

  it('returns dimensions for context', async () => {
    const created = await contexts.createFinancialContext({
      context_type: 'event',
      context_id: 'ev-1',
      organisation_id: 'org-1',
      lifecycle_status: 'draft',
      base_currency: 'AUD',
    })
    if (!created.ok) return
    await contexts.defineDimension({
      context_id: created.data.id,
      name: 'Program',
      key: 'program',
    })
    const { result } = renderHook(() => useDimensions(created.data.id), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data.length).toBeGreaterThanOrEqual(1)
  })

  it('returns error when getDimensionsForContext fails', async () => {
    vi.spyOn(contextsRead, 'getDimensionsForContext').mockResolvedValueOnce({
      ok: false,
      error: { code: 'ERR', message: 'Load failed' },
    })
    const { result } = renderHook(() => useDimensions('ctx-1'), { wrapper })
    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.error?.message).toBe('Load failed')
    expect(result.current.data).toEqual([])
  })

  it('returns null error when query throws non-Error', async () => {
    vi.spyOn(contextsRead, 'getDimensionsForContext').mockRejectedValueOnce('oops')
    const { result } = renderHook(() => useDimensions('ctx-1'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.data).toEqual([])
  })
})

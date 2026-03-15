import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as contextsRead from '@/services/mint/contexts-read'
import { useResolvedEventContextId } from './useResolvedEventContextId'
import * as contexts from '@/services/mint/contexts'

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useResolvedEventContextId', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null when eventId is null', () => {
    const { result } = renderHook(() => useResolvedEventContextId(null), { wrapper })
    expect(result.current.contextId).toBeNull()
  })

  it('returns context id when event has context', async () => {
    const created = await contexts.createFinancialContext({
      context_type: 'event',
      context_id: 'ev-42',
      organisation_id: 'org-1',
      lifecycle_status: 'draft',
      base_currency: 'AUD',
    })
    if (!created.ok) return
    const { result } = renderHook(() => useResolvedEventContextId('ev-42'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.contextId).toBe(created.data.id)
  })

  it('returns error when resolveEventToContextId fails', async () => {
    vi.spyOn(contextsRead, 'resolveEventToContextId').mockResolvedValueOnce({
      ok: false,
      error: { code: 'ERR', message: 'Resolve failed' },
    })
    const { result } = renderHook(() => useResolvedEventContextId('ev-99'), { wrapper })
    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.error?.message).toBe('Resolve failed')
    expect(result.current.contextId).toBeNull()
  })

  it('returns null error when query throws non-Error', async () => {
    vi.spyOn(contextsRead, 'resolveEventToContextId').mockRejectedValueOnce('string throw')
    const { result } = renderHook(() => useResolvedEventContextId('ev-99'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.contextId).toBeNull()
  })
})

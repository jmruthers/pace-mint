import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as contextServices from '@/services/mint/contexts'
import { usePersistFinancialContext } from './usePersistFinancialContext'

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('usePersistFinancialContext', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('create returns ok with new context', async () => {
    const { result } = renderHook(() => usePersistFinancialContext(), { wrapper })
    const apiResult = await result.current.create({
      context_type: 'membership_program',
      context_id: 'mp-1',
      organisation_id: 'org-1',
      lifecycle_status: 'draft',
      base_currency: 'AUD',
    })
    expect(apiResult.ok).toBe(true)
    if (apiResult.ok) expect(apiResult.data.context_type).toBe('membership_program')
  })

  it('update returns ok when id exists', async () => {
    const { result } = renderHook(() => usePersistFinancialContext(), { wrapper })
    const created = await result.current.create({
      context_type: 'event',
      context_id: 'ev-1',
      organisation_id: 'org-1',
      lifecycle_status: 'draft',
      base_currency: 'AUD',
    })
    if (!created.ok) return
    const updated = await result.current.update({
      id: created.data.id,
      lifecycle_status: 'active',
    })
    expect(updated.ok).toBe(true)
    if (updated.ok) expect(updated.data.lifecycle_status).toBe('active')
  })

  it('create returns ok: false when service fails', async () => {
    vi.spyOn(contextServices, 'createFinancialContext').mockResolvedValueOnce({
      ok: false,
      error: { code: 'ERR', message: 'Create failed' },
    })
    const { result } = renderHook(() => usePersistFinancialContext(), { wrapper })
    const apiResult = await result.current.create({
      context_type: 'event',
      context_id: 'ev-1',
      organisation_id: 'org-1',
      lifecycle_status: 'draft',
      base_currency: 'AUD',
    })
    expect(apiResult.ok).toBe(false)
    if (!apiResult.ok) expect(apiResult.error.message).toBe('Create failed')
  })

  it('update returns ok: false when service fails', async () => {
    const { result } = renderHook(() => usePersistFinancialContext(), { wrapper })
    const created = await result.current.create({
      context_type: 'event',
      context_id: 'ev-1',
      organisation_id: 'org-1',
      lifecycle_status: 'draft',
      base_currency: 'AUD',
    })
    if (!created.ok) return
    vi.spyOn(contextServices, 'updateFinancialContext').mockResolvedValueOnce({
      ok: false,
      error: { code: 'ERR', message: 'Update failed' },
    })
    const apiResult = await result.current.update({
      id: created.data.id,
      lifecycle_status: 'closed',
    })
    expect(apiResult.ok).toBe(false)
    if (!apiResult.ok) expect(apiResult.error.message).toBe('Update failed')
  })

  it('create returns ok: false when mutation throws non-Error', async () => {
    vi.spyOn(contextServices, 'createFinancialContext').mockRejectedValueOnce('oops')
    const { result } = renderHook(() => usePersistFinancialContext(), { wrapper })
    const apiResult = await result.current.create({
      context_type: 'event',
      context_id: 'ev-1',
      organisation_id: 'org-1',
      lifecycle_status: 'draft',
      base_currency: 'AUD',
    })
    expect(apiResult.ok).toBe(false)
    if (!apiResult.ok) expect(apiResult.error.message).toBe('Failed to create')
  })
})

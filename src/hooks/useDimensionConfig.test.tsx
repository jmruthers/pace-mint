import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDimensionConfig } from './useDimensionConfig'
import * as contexts from '@/services/mint/contexts'

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useDimensionConfig', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns dimensions and defineDimension', async () => {
    const created = await contexts.createFinancialContext({
      context_type: 'event',
      context_id: 'ev-1',
      organisation_id: 'org-1',
      lifecycle_status: 'draft',
      base_currency: 'AUD',
    })
    if (!created.ok) return
    const { result } = renderHook(() => useDimensionConfig(created.data.id), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(Array.isArray(result.current.dimensions)).toBe(true)
    expect(typeof result.current.defineDimension).toBe('function')
  })

  it('returns empty dimensions when contextId is null', () => {
    const { result } = renderHook(() => useDimensionConfig(null), { wrapper })
    expect(result.current.dimensions).toEqual([])
  })

  it('defineDimension on success resets form and refetches', async () => {
    const created = await contexts.createFinancialContext({
      context_type: 'event',
      context_id: 'ev-1',
      organisation_id: 'org-1',
      lifecycle_status: 'draft',
      base_currency: 'AUD',
    })
    if (!created.ok) return
    const { result } = renderHook(() => useDimensionConfig(created.data.id), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    const firstKey = result.current.formKey
    const apiResult = await result.current.defineDimension({
      context_id: created.data.id,
      name: 'Region',
      key: 'region',
    })
    expect(apiResult.ok).toBe(true)
    await waitFor(() => expect(result.current.formKey).toBe(firstKey + 1))
    expect(result.current.dimensions.some((d) => d.key === 'region')).toBe(true)
  })

  it('defineDimension on failure returns ok: false and does not reset form', async () => {
    vi.spyOn(contexts, 'defineDimension').mockResolvedValueOnce({
      ok: false,
      error: { code: 'ERR', message: 'Define failed' },
    })
    const { result } = renderHook(() => useDimensionConfig('ctx-1'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    const firstKey = result.current.formKey
    const apiResult = await result.current.defineDimension({
      context_id: 'ctx-1',
      name: 'X',
      key: 'x',
    })
    expect(apiResult.ok).toBe(false)
    expect(result.current.formKey).toBe(firstKey)
  })

  it('resetForm increments formKey', async () => {
    const { result } = renderHook(() => useDimensionConfig('ctx-1'), { wrapper })
    const firstKey = result.current.formKey
    result.current.resetForm()
    await waitFor(() => expect(result.current.formKey).toBe(firstKey + 1))
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import {
  listFinancialContexts,
  getFinancialContext,
  createFinancialContext,
  updateFinancialContext,
  setContextCurrencies,
  setContextVariables,
  defineDimension,
} from './contexts'
import {
  getContextCurrencies,
  getContextVariables,
  getDimensionsForContext,
  resolveEventToContextId,
} from './contexts-read'
import * as store from './context-store'

describe('contexts service', () => {
  beforeEach(() => {
    store.contextStore.clear()
    store.contextCurrenciesStore.clear()
    store.contextVariablesStore.clear()
    store.dimensionDefinitionsStore.clear()
  })

  it('creates and lists financial contexts', async () => {
    const created = await createFinancialContext({
      context_type: 'event',
      context_id: 'ev-1',
      organisation_id: 'org-1',
      lifecycle_status: 'draft',
      base_currency: 'AUD',
    })
    expect(created.ok).toBe(true)
    if (created.ok) {
      expect(created.data.id).toBeDefined()
      expect(created.data.context_type).toBe('event')
      expect(created.data.context_id).toBe('ev-1')
    }
    const list = await listFinancialContexts()
    expect(list.ok).toBe(true)
    if (list.ok) expect(list.data).toHaveLength(1)
  })

  it('getFinancialContext returns NOT_FOUND for missing id', async () => {
    const got = await getFinancialContext('missing')
    expect(got.ok).toBe(false)
    if (!got.ok) expect(got.error.code).toBe('NOT_FOUND')
  })

  it('updates financial context', async () => {
    const created = await createFinancialContext({
      context_type: 'event',
      context_id: 'ev-1',
      organisation_id: 'org-1',
      lifecycle_status: 'draft',
      base_currency: 'AUD',
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const updated = await updateFinancialContext({
      id: created.data.id,
      lifecycle_status: 'active',
    })
    expect(updated.ok).toBe(true)
    if (updated.ok) expect(updated.data.lifecycle_status).toBe('active')
  })

  it('setContextVariables and getContextVariables', async () => {
    const created = await createFinancialContext({
      context_type: 'organisation',
      context_id: 'org-1',
      organisation_id: 'org-1',
      lifecycle_status: 'active',
      base_currency: 'AUD',
    })
    if (!created.ok) return
    const set = await setContextVariables({
      context_id: created.data.id,
      variables: [{ key: 'revenue', label: 'Revenue' }],
    })
    expect(set.ok).toBe(true)
    const got = await getContextVariables(created.data.id)
    expect(got.ok).toBe(true)
    if (got.ok) expect(got.data).toHaveLength(1)
  })

  it('setContextCurrencies and getContextCurrencies', async () => {
    const created = await createFinancialContext({
      context_type: 'organisation',
      context_id: 'org-1',
      organisation_id: 'org-1',
      lifecycle_status: 'active',
      base_currency: 'AUD',
    })
    if (!created.ok) return
    const set = await setContextCurrencies({
      context_id: created.data.id,
      currencies: [{ currency_code: 'AUD', is_default: true }],
    })
    expect(set.ok).toBe(true)
    const got = await getContextCurrencies(created.data.id)
    expect(got.ok).toBe(true)
    if (got.ok) expect(got.data).toHaveLength(1)
  })

  it('defineDimension and getDimensionsForContext', async () => {
    const created = await createFinancialContext({
      context_type: 'event',
      context_id: 'ev-1',
      organisation_id: 'org-1',
      lifecycle_status: 'draft',
      base_currency: 'AUD',
    })
    if (!created.ok) return
    const def = await defineDimension({
      context_id: created.data.id,
      name: 'Program',
      key: 'program',
    })
    expect(def.ok).toBe(true)
    const list = await getDimensionsForContext(created.data.id)
    expect(list.ok).toBe(true)
    if (list.ok) expect(list.data).toHaveLength(1)
  })

  it('resolveEventToContextId returns context id when event has context', async () => {
    const created = await createFinancialContext({
      context_type: 'event',
      context_id: 'ev-99',
      organisation_id: 'org-1',
      lifecycle_status: 'active',
      base_currency: 'AUD',
    })
    if (!created.ok) return
    const resolved = await resolveEventToContextId('ev-99')
    expect(resolved.ok).toBe(true)
    if (resolved.ok) expect(resolved.data).toBe(created.data.id)
  })

  it('resolveEventToContextId returns null when event has no context', async () => {
    const resolved = await resolveEventToContextId('ev-missing')
    expect(resolved.ok).toBe(true)
    if (resolved.ok) expect(resolved.data).toBeNull()
  })
})

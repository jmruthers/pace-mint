import type { ApiResult } from '@/types/api'
import type {
  FinancialDimensionDefinition,
  ContextCurrencySetting,
  ContextVariableDefinition,
} from '@/types/finance'
import {
  contextStore,
  contextCurrenciesStore,
  contextVariablesStore,
  dimensionDefinitionsStore,
} from './context-store'

export async function getContextCurrencies(contextId: string): Promise<ApiResult<ContextCurrencySetting[]>> {
  const list = contextCurrenciesStore.get(contextId) ?? []
  return { ok: true, data: list }
}

export async function getContextVariables(contextId: string): Promise<ApiResult<ContextVariableDefinition[]>> {
  const list = contextVariablesStore.get(contextId) ?? []
  return { ok: true, data: list }
}

export async function getDimensionsForContext(contextId: string): Promise<ApiResult<FinancialDimensionDefinition[]>> {
  const list = dimensionDefinitionsStore.get(contextId) ?? []
  return { ok: true, data: list }
}

/** Resolve event id to financial context id (context_type === 'event' && context_id === eventId). */
export async function resolveEventToContextId(eventId: string): Promise<ApiResult<string | null>> {
  const list = Array.from(contextStore.values())
  const ctx = list.find((c) => c.context_type === 'event' && c.context_id === eventId)
  return { ok: true, data: ctx?.id ?? null }
}

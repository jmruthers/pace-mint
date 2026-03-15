import type { ApiResult } from '@/types/api'
import type {
  FinancialContext,
  FinancialDimensionDefinition,
  ContextCurrencySetting,
  ContextVariableDefinition,
} from '@/types/finance'
import type {
  CreateFinancialContextInput,
  UpdateFinancialContextInput,
  SetContextCurrenciesInput,
  SetContextVariablesInput,
  DefineDimensionInput,
} from '@/types/finance-inputs'
import {
  contextStore,
  contextCurrenciesStore,
  contextVariablesStore,
  dimensionDefinitionsStore,
} from './context-store'

function nextId(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

export async function listFinancialContexts(): Promise<ApiResult<FinancialContext[]>> {
  try {
    const list = Array.from(contextStore.values())
    return { ok: true, data: list }
  } catch (e) {
    return {
      ok: false,
      error: { code: 'LIST_FAILED', message: e instanceof Error ? e.message : 'Failed to list contexts' },
    }
  }
}

export async function getFinancialContext(id: string): Promise<ApiResult<FinancialContext>> {
  const ctx = contextStore.get(id)
  if (!ctx) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Financial context not found' } }
  }
  return { ok: true, data: ctx }
}

export async function createFinancialContext(
  input: CreateFinancialContextInput
): Promise<ApiResult<FinancialContext>> {
  try {
    const id = nextId()
    const ctx: FinancialContext = {
      id,
      context_type: input.context_type,
      context_id: input.context_id,
      organisation_id: input.organisation_id,
      parent_context_id: input.parent_context_id ?? null,
      lifecycle_status: input.lifecycle_status,
      base_currency: input.base_currency,
      created_at: now(),
      updated_at: now(),
    }
    contextStore.set(id, ctx)
    return { ok: true, data: ctx }
  } catch (e) {
    return {
      ok: false,
      error: { code: 'CREATE_FAILED', message: e instanceof Error ? e.message : 'Failed to create context' },
    }
  }
}

export async function updateFinancialContext(
  input: UpdateFinancialContextInput
): Promise<ApiResult<FinancialContext>> {
  const existing = contextStore.get(input.id)
  if (!existing) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Financial context not found' } }
  }
  try {
    const updated: FinancialContext = {
      ...existing,
      ...(input.context_type != null && { context_type: input.context_type }),
      ...(input.context_id != null && { context_id: input.context_id }),
      ...(input.organisation_id != null && { organisation_id: input.organisation_id }),
      ...(input.parent_context_id !== undefined && { parent_context_id: input.parent_context_id }),
      ...(input.lifecycle_status != null && { lifecycle_status: input.lifecycle_status }),
      ...(input.base_currency != null && { base_currency: input.base_currency }),
      updated_at: now(),
    }
    contextStore.set(input.id, updated)
    return { ok: true, data: updated }
  } catch (e) {
    return {
      ok: false,
      error: { code: 'UPDATE_FAILED', message: e instanceof Error ? e.message : 'Failed to update context' },
    }
  }
}

export async function setContextCurrencies(
  input: SetContextCurrenciesInput
): Promise<ApiResult<ContextCurrencySetting[]>> {
  const ctx = Array.from(contextStore.values()).find((c) => c.id === input.context_id)
  if (!ctx) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Financial context not found' } }
  }
  try {
    const settings: ContextCurrencySetting[] = input.currencies.map((c) => ({
      id: nextId(),
      context_id: input.context_id,
      currency_code: c.currency_code,
      is_default: c.is_default,
      exchange_rate_to_default: c.exchange_rate_to_default,
    }))
    contextCurrenciesStore.set(input.context_id, settings)
    return { ok: true, data: settings }
  } catch (e) {
    return {
      ok: false,
      error: { code: 'SET_CURRENCIES_FAILED', message: e instanceof Error ? e.message : 'Failed to set currencies' },
    }
  }
}

export async function setContextVariables(
  input: SetContextVariablesInput
): Promise<ApiResult<ContextVariableDefinition[]>> {
  const ctx = Array.from(contextStore.values()).find((c) => c.id === input.context_id)
  if (!ctx) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Financial context not found' } }
  }
  try {
    const defs: ContextVariableDefinition[] = input.variables.map((v) => ({
      id: nextId(),
      context_id: input.context_id,
      key: v.key,
      label: v.label,
    }))
    contextVariablesStore.set(input.context_id, defs)
    return { ok: true, data: defs }
  } catch (e) {
    return {
      ok: false,
      error: { code: 'SET_VARIABLES_FAILED', message: e instanceof Error ? e.message : 'Failed to set variables' },
    }
  }
}

export async function defineDimension(input: DefineDimensionInput): Promise<ApiResult<FinancialDimensionDefinition>> {
  const ctx = Array.from(contextStore.values()).find((c) => c.id === input.context_id)
  if (!ctx) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Financial context not found' } }
  }
  try {
    const def: FinancialDimensionDefinition = {
      id: nextId(),
      context_id: input.context_id,
      name: input.name,
      key: input.key,
      description: input.description,
    }
    const list = dimensionDefinitionsStore.get(input.context_id) ?? []
    list.push(def)
    dimensionDefinitionsStore.set(input.context_id, list)
    return { ok: true, data: def }
  } catch (e) {
    return {
      ok: false,
      error: { code: 'DEFINE_DIMENSION_FAILED', message: e instanceof Error ? e.message : 'Failed to define dimension' },
    }
  }
}


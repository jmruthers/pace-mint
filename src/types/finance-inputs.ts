import type { FinancialContextType, LifecycleStatus } from './finance'

/** Input to create a financial context. */
export interface CreateFinancialContextInput {
  context_type: FinancialContextType
  context_id: string
  organisation_id: string
  parent_context_id?: string | null
  lifecycle_status: LifecycleStatus
  base_currency: string
}

/** Input to update a financial context. */
export interface UpdateFinancialContextInput {
  id: string
  context_type?: FinancialContextType
  context_id?: string
  organisation_id?: string
  parent_context_id?: string | null
  lifecycle_status?: LifecycleStatus
  base_currency?: string
}

/** Input to set context currencies. */
export interface SetContextCurrenciesInput {
  context_id: string
  currencies: Array<{ currency_code: string; is_default: boolean; exchange_rate_to_default?: number }>
}

/** Input to set context variables. */
export interface SetContextVariablesInput {
  context_id: string
  variables: Array<{ key: string; label: string }>
}

/** Input to define a dimension for a context. */
export interface DefineDimensionInput {
  context_id: string
  name: string
  key: string
  description?: string
}

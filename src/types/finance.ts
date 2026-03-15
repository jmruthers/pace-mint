/** Financial context type discriminator (event, program, etc.). */
export type FinancialContextType = 'event' | 'membership_program' | 'organisation' | 'project' | 'grant'

/** Lifecycle status for a financial context. */
export type LifecycleStatus = 'draft' | 'active' | 'archived' | 'closed'

/** A financial context: ownership and scope for finance (event, program, org, etc.). */
export interface FinancialContext {
  id: string
  context_type: FinancialContextType
  context_id: string
  organisation_id: string
  parent_context_id: string | null
  lifecycle_status: LifecycleStatus
  base_currency: string
  created_at?: string
  updated_at?: string
}

/** Currency setting for a context (functional currency, rates). */
export interface ContextCurrencySetting {
  id: string
  context_id: string
  currency_code: string
  is_default: boolean
  exchange_rate_to_default?: number
}

/** Variable definition scoped to a context (e.g. budget variables). */
export interface ContextVariableDefinition {
  id: string
  context_id: string
  key: string
  label: string
}

/** Dimension definition: reusable slice (event, program, fund, etc.). */
export interface FinancialDimensionDefinition {
  id: string
  context_id: string
  name: string
  key: string
  description?: string
}

/** A concrete dimension value attached to a record. */
export interface FinancialDimensionValue {
  dimension_id: string
  value: string
  label?: string
}

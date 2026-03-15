import type {
  FinancialContext,
  FinancialDimensionDefinition,
  ContextCurrencySetting,
  ContextVariableDefinition,
} from '@/types/finance'

export const contextStore = new Map<string, FinancialContext>()
export const contextCurrenciesStore = new Map<string, ContextCurrencySetting[]>()
export const contextVariablesStore = new Map<string, ContextVariableDefinition[]>()
export const dimensionDefinitionsStore = new Map<string, FinancialDimensionDefinition[]>()

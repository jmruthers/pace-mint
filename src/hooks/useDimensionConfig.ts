import { useState, useCallback } from 'react'
import { useDimensions } from '@/hooks/useDimensions'
import { useDefineDimension } from '@/hooks/useDefineDimension'
import type { FinancialDimensionDefinition } from '@/types/finance'
import type { DefineDimensionInput } from '@/types/finance-inputs'
import type { ApiResult } from '@/types/api'

/** Encapsulates dimension list and define mutation for DimensionConfigPanel (data fetching in hook per Standard 02). */
export function useDimensionConfig(contextId: string | null): {
  dimensions: FinancialDimensionDefinition[]
  isLoading: boolean
  error: Error | null
  defineDimension: (input: DefineDimensionInput) => Promise<ApiResult<FinancialDimensionDefinition>>
  isPending: boolean
  defineError: Error | null
  formKey: number
  resetForm: () => void
  refetch: () => void
} {
  const { data: dimensions, isLoading, error, refetch } = useDimensions(contextId ?? undefined)
  const { defineDimension: defineFn, isPending, error: defineError } = useDefineDimension()
  const [formKey, setFormKey] = useState(0)

  const resetForm = useCallback(() => {
    setFormKey((k) => k + 1)
  }, [])

  const defineDimension = useCallback(
    async (input: DefineDimensionInput): Promise<ApiResult<FinancialDimensionDefinition>> => {
      const result = await defineFn(input)
      if (result.ok) {
        resetForm()
        refetch()
      }
      return result
    },
    [defineFn, resetForm, refetch]
  )

  return {
    dimensions,
    isLoading,
    error,
    defineDimension,
    isPending,
    defineError,
    formKey,
    resetForm,
    refetch,
  }
}

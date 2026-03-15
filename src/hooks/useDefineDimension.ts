import { useMutation, useQueryClient } from '@tanstack/react-query'
import { defineDimension } from '@/services/mint/contexts'
import type { DefineDimensionInput } from '@/types/finance-inputs'
import type { ApiResult } from '@/types/api'
import type { FinancialDimensionDefinition } from '@/types/finance'

export function useDefineDimension(): {
  defineDimension: (input: DefineDimensionInput) => Promise<ApiResult<FinancialDimensionDefinition>>
  isPending: boolean
  error: Error | null
} {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (input: DefineDimensionInput) => {
      const result = await defineDimension(input)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['dimensions', variables.context_id] })
    },
  })

  const defineDimensionFn = async (
    input: DefineDimensionInput
  ): Promise<ApiResult<FinancialDimensionDefinition>> => {
    try {
      const data = await mutation.mutateAsync(input)
      return { ok: true, data }
    } catch (e) {
      return {
        ok: false,
        error: { code: 'DEFINE_DIMENSION_FAILED', message: e instanceof Error ? e.message : 'Failed' },
      }
    }
  }

  return {
    defineDimension: defineDimensionFn,
    isPending: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error : null,
  }
}

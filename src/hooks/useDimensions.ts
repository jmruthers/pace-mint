import { useQuery } from '@tanstack/react-query'
import { getDimensionsForContext } from '@/services/mint/contexts-read'
import type { FinancialDimensionDefinition } from '@/types/finance'

export function useDimensions(contextId: string | undefined): {
  data: FinancialDimensionDefinition[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
} {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dimensions', contextId],
    queryFn: async () => {
      if (!contextId) return []
      const result = await getDimensionsForContext(contextId)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    enabled: Boolean(contextId),
  })

  return {
    data: data ?? [],
    isLoading,
    error: error instanceof Error ? error : null,
    refetch,
  }
}

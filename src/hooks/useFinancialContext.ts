import { useQuery } from '@tanstack/react-query'
import { getFinancialContext } from '@/services/mint/contexts'
import type { FinancialContext } from '@/types/finance'

export function useFinancialContext(contextId: string): {
  data: FinancialContext | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
} {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['financial-context', contextId],
    queryFn: async () => {
      const result = await getFinancialContext(contextId)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    enabled: Boolean(contextId),
  })

  return {
    data: data ?? null,
    isLoading,
    error: error instanceof Error ? error : null,
    refetch,
  }
}

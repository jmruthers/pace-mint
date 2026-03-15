import { useQuery } from '@tanstack/react-query'
import { listFinancialContexts } from '@/services/mint/contexts'
import type { FinancialContext } from '@/types/finance'

export function useFinancialContextsList(): {
  data: FinancialContext[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
} {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['financial-contexts-list'],
    queryFn: async () => {
      const result = await listFinancialContexts()
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })

  return {
    data: data ?? [],
    isLoading,
    error: error instanceof Error ? error : null,
    refetch,
  }
}

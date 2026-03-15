import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFinancialContext, updateFinancialContext } from '@/services/mint/contexts'
import type { FinancialContext } from '@/types/finance'
import type { CreateFinancialContextInput, UpdateFinancialContextInput } from '@/types/finance-inputs'
import type { ApiResult } from '@/types/api'

export function usePersistFinancialContext(): {
  create: (input: CreateFinancialContextInput) => Promise<ApiResult<FinancialContext>>
  update: (input: UpdateFinancialContextInput) => Promise<ApiResult<FinancialContext>>
  isPending: boolean
  error: Error | null
} {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (input: CreateFinancialContextInput) => {
      const result = await createFinancialContext(input)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['financial-contexts-list'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (input: UpdateFinancialContextInput) => {
      const result = await updateFinancialContext(input)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['financial-contexts-list'] })
      void queryClient.invalidateQueries({ queryKey: ['financial-context', data.id] })
    },
  })

  const create = async (input: CreateFinancialContextInput): Promise<ApiResult<FinancialContext>> => {
    try {
      const data = await createMutation.mutateAsync(input)
      return { ok: true, data }
    } catch (e) {
      return {
        ok: false,
        error: { code: 'CREATE_FAILED', message: e instanceof Error ? e.message : 'Failed to create' },
      }
    }
  }

  const update = async (input: UpdateFinancialContextInput): Promise<ApiResult<FinancialContext>> => {
    try {
      const data = await updateMutation.mutateAsync(input)
      return { ok: true, data }
    } catch (e) {
      return {
        ok: false,
        error: { code: 'UPDATE_FAILED', message: e instanceof Error ? e.message : 'Failed to update' },
      }
    }
  }

  return {
    create,
    update,
    isPending: createMutation.isPending || updateMutation.isPending,
    error: createMutation.error instanceof Error ? createMutation.error : updateMutation.error instanceof Error ? updateMutation.error : null,
  }
}

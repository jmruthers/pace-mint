import { useQuery } from '@tanstack/react-query'
import { resolveEventToContextId } from '@/services/mint/contexts-read'

/** Resolve header-selected event id to financial context id (context_type=event, context_id=eventId). */
export function useResolvedEventContextId(eventId: string | null): {
  contextId: string | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
} {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['event-context-id', eventId],
    queryFn: async () => {
      if (!eventId) return null
      const result = await resolveEventToContextId(eventId)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    enabled: Boolean(eventId),
  })

  return {
    contextId: data ?? null,
    isLoading,
    error: error instanceof Error ? error : null,
    refetch,
  }
}

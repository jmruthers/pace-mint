import { useState } from 'react'
import type { MintContext } from '@/types/mint'

/**
 * Event finance context for MINT (shell: returns empty/loading state).
 * When event context is set (e.g. via provider or route), returns that context.
 */
export function useEventFinanceContext(): {
  eventId: string | null
  context: MintContext | null
  isLoading: boolean
  error: Error | null
} {
  const [context] = useState<MintContext | null>(null)
  const isLoading = false
  const error: Error | null = null
  const eventId = context?.eventId ?? null

  return {
    eventId,
    context,
    isLoading,
    error,
  }
}

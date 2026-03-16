import { useMemo, useEffect } from 'react'
import { useUnifiedAuth } from '@jmruthers/pace-core'
import type { MintContext } from '@/types/mint'

/** Module-level ref so getCurrentEventFinanceContext() can return last known context. */
let lastKnownContext: MintContext | null = null

/**
 * Event finance context for MINT. Derives from pace-core auth/org/event context
 * (useUnifiedAuth: selectedEvent, selectedOrganisation). Available when
 * OrganisationServiceProvider and EventServiceProvider are mounted.
 */
export function useEventFinanceContext(): {
  eventId: string | null
  context: MintContext | null
  isLoading: boolean
  error: Error | null
} {
  const auth = useUnifiedAuth()
  const selectedEvent = auth.selectedEvent ?? null
  const selectedOrganisation = auth.selectedOrganisation ?? null
  const organisationLoading = auth.organisationLoading ?? false
  const eventLoading = auth.eventLoading ?? false
  const error = auth.error ?? null

  const context = useMemo<MintContext | null>(() => {
    const eventId = selectedEvent?.id ?? null
    const organisationId = selectedOrganisation?.id ?? null
    if (!eventId && !organisationId) return null
    return { eventId, organisationId }
  }, [selectedEvent?.id, selectedOrganisation?.id])

  useEffect(() => {
    lastKnownContext = context
  }, [context])

  const isLoading = organisationLoading || eventLoading
  const eventId = context?.eventId ?? null

  return {
    eventId,
    context,
    isLoading,
    error,
  }
}

/**
 * Returns the last known event finance context from the most recent
 * useEventFinanceContext() call in the tree. Use in non-React code that
 * cannot call hooks; returns null if no component has set context yet.
 */
export function getCurrentEventFinanceContext(): MintContext | null {
  return lastKnownContext
}

/**
 * Resets the module-level context ref. For test isolation only.
 * @internal
 */
export function __resetLastKnownContextForTesting(): void {
  lastKnownContext = null
}

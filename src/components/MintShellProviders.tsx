import type { ReactNode } from 'react'
import {
  OrganisationServiceProvider,
  EventServiceProvider,
  useUnifiedAuth,
} from '@jmruthers/pace-core'
import { supabaseClient } from '@/lib/supabase'

interface MintShellProvidersProps {
  children: ReactNode
}

function MintShellProvidersInner({ children }: MintShellProvidersProps) {
  const { user, session } = useUnifiedAuth()
  return (
    <OrganisationServiceProvider
      supabaseClient={supabaseClient}
      user={user}
      session={session}
    >
      <EventServiceProvider supabaseClient={supabaseClient}>
        {children}
      </EventServiceProvider>
    </OrganisationServiceProvider>
  )
}

/**
 * Wraps app content with OrganisationServiceProvider and EventServiceProvider
 * so organisation and event context (useOrganisations, useEvents) are available.
 * Provider order (inner to outer): EventServiceProvider → OrganisationServiceProvider → content (M01c).
 * Must be used inside UnifiedAuthProvider.
 */
export function MintShellProviders({ children }: MintShellProvidersProps) {
  return <MintShellProvidersInner>{children}</MintShellProvidersInner>
}

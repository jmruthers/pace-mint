import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UnifiedAuthProvider, InactivityWarningModal } from '@jmruthers/pace-core'
import { setupRBAC } from '@jmruthers/pace-core/rbac'
import './app.css'
import App from './App.tsx'
import { supabaseClient } from './lib/supabase'

setupRBAC(supabaseClient)

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <UnifiedAuthProvider
          supabaseClient={supabaseClient}
          appName="pace-mint"
          idleTimeoutMs={15 * 60 * 1000}
          warnBeforeMs={60 * 1000}
          onIdleLogout={() => {}}
          renderInactivityWarning={({ timeRemaining, onStaySignedIn, onSignOutNow }) => (
            <InactivityWarningModal
              isOpen
              timeRemaining={timeRemaining}
              onStaySignedIn={onStaySignedIn}
              onSignOutNow={onSignOutNow}
            />
          )}
        >
          <App />
        </UnifiedAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)

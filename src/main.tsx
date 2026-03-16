import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UnifiedAuthProvider, InactivityWarningModal, QueryRetryHandler, queryErrorHandler } from '@jmruthers/pace-core'
import { setupRBAC } from '@jmruthers/pace-core/rbac'
import './app.css'
import App from './App.tsx'
import { MintShellProviders } from '@/components/MintShellProviders'
import { supabaseClient } from './lib/supabase'
import { APP_NAME } from '@/lib/constants/app-name'

setupRBAC(supabaseClient, { appName: APP_NAME })

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: QueryRetryHandler,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      meta: {
        onError: (error: unknown) => queryErrorHandler(error, 'Query'),
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <UnifiedAuthProvider
        supabaseClient={supabaseClient}
        appName={APP_NAME}
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
        <MintShellProviders>
          <StrictMode>
            <App />
          </StrictMode>
        </MintShellProviders>
      </UnifiedAuthProvider>
    </BrowserRouter>
  </QueryClientProvider>,
)

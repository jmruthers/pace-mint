import { useLocation } from 'react-router-dom'
import {
  useUnifiedAuth,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  LoadingSpinner,
  OrganisationServiceProvider,
} from '@jmruthers/pace-core'
import { supabaseClient } from '@/lib/supabase'

const LOGIN_PATH = '/login'

interface AppContentProps {
  children: React.ReactNode
}

export function AppContent({ children }: AppContentProps) {
  const { pathname } = useLocation()
  const auth = useUnifiedAuth()
  const isLoginRoute = pathname === LOGIN_PATH

  if (auth.isLoading && !isLoginRoute) {
    return (
      <main className="grid min-h-screen place-items-center">
        <section className="grid place-items-center gap-4">
          <LoadingSpinner />
          <p>Loading session…</p>
        </section>
      </main>
    )
  }

  const authError = auth.sessionRestoration?.error ?? null
  if (authError && !isLoginRoute) {
    return (
      <main className="grid min-h-screen place-items-center">
        <Card>
          <CardHeader>
            <CardTitle>Authentication error</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p>{authError.message}</p>
            <Button
              type="button"
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <OrganisationServiceProvider
      supabaseClient={supabaseClient}
      user={auth.user}
      session={auth.session}
    >
      {children}
    </OrganisationServiceProvider>
  )
}

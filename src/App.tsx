import { ToastProvider } from '@jmruthers/pace-core'
import { AppContent } from '@/components/AppContent'
import { AppRoutes } from '@/AppRoutes'

function App() {
  return (
    <ToastProvider>
      <AppContent>
        <AppRoutes />
      </AppContent>
    </ToastProvider>
  )
}

export default App

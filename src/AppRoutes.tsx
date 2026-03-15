import { Routes, Route, Navigate } from 'react-router-dom'
import { PaceLoginPage, ProtectedRoute } from '@jmruthers/pace-core'
import { APP_NAME } from '@/lib/constants/app-name'
import { MintLayout } from '@/components/mint/MintLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { UsersPage } from '@/pages/UsersPage'
import { LoginHistoryPage } from '@/pages/LoginHistoryPage'
import { ApplicationsAndPagesPage } from '@/pages/ApplicationsAndPagesPage'
import { FinancialContextPage } from '@/pages/FinancialContextPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PaceLoginPage
            appName={APP_NAME}
            onSuccessRedirectPath="/"
            requireAppAccess={false}
          />
        }
      />
      <Route
        path="/"
        element={<ProtectedRoute loginPath="/login" requireEvent={false} />}
      >
        <Route element={<MintLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="financial-context" element={<FinancialContextPage />} />
          <Route path="event-finance-config" element={<Navigate to="/financial-context" replace />} />
          <Route path="login-history" element={<LoginHistoryPage />} />
          <Route path="applications-and-pages" element={<ApplicationsAndPagesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

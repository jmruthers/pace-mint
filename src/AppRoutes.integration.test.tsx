import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter, useLocation, Navigate, Outlet } from 'react-router-dom'
import { AppContent } from '@/components/AppContent'
import { AppRoutes } from '@/AppRoutes'

const mockUseUnifiedAuth = vi.fn()
vi.mock('@jmruthers/pace-core', async (importOriginal) => {
  const mod = await importOriginal<
    typeof import('@jmruthers/pace-core')
  >()
  function MockProtectedRoute({
    loginPath,
  }: {
    loginPath: string
    children?: React.ReactNode
    requireEvent?: boolean
  }) {
    const auth = mockUseUnifiedAuth()
    if (!auth.user) return <Navigate to={loginPath} replace />
    return <Outlet />
  }
  const PaceLoginPageMock = () => <div data-testid="login-page">Login</div>
  function PaceAppLayoutMock({
    appName,
    navItems,
    children,
  }: {
    appName: string
    navItems: { id: string; label: string; href: string }[]
    children: React.ReactNode
  }) {
    return (
      <main data-testid="pace-app-layout" data-app-name={appName}>
        <nav>
          {navItems.map((item) => (
            <a key={item.id} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        {children}
      </main>
    )
  }
  return {
    ...mod,
    useUnifiedAuth: () => mockUseUnifiedAuth(),
    ProtectedRoute: MockProtectedRoute,
    PaceLoginPage: PaceLoginPageMock,
    PaceAppLayout: PaceAppLayoutMock,
  }
})

const mockUsePermissionLevel = vi.fn()
vi.mock('@jmruthers/pace-core/rbac', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@jmruthers/pace-core/rbac')>()
  const PagePermissionGuardMock = ({
    children,
  }: {
    children: React.ReactNode
    pageName?: string
    operation?: string
  }) => <>{children}</>
  return {
    ...mod,
    usePermissionLevel: (...args: unknown[]) => mockUsePermissionLevel(...args),
    PagePermissionGuard: PagePermissionGuardMock,
  }
})

function LocationDisplay() {
  const { pathname } = useLocation()
  return <span data-testid="location" data-pathname={pathname} />
}

function renderApp(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocationDisplay />
      <AppContent>
        <AppRoutes />
      </AppContent>
    </MemoryRouter>
  )
}

vi.mock('@/components/AppContent', () => ({
  AppContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('AppRoutes (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
    mockUsePermissionLevel.mockReturnValue({
      permissionLevel: 'member',
      isLoading: false,
    })
  })

  describe('ProtectedRoute', () => {
    it('redirects to /login when unauthenticated user visits protected path', () => {
      mockUseUnifiedAuth.mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        sessionRestoration: { error: null },
      })
      renderApp('/')
      const locations = screen.getAllByTestId('location')
      expect(locations.some((el) => el.getAttribute('data-pathname') === '/login')).toBe(true)
      expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument()
    })

    it('renders children when authenticated', () => {
      mockUseUnifiedAuth.mockReturnValue({
        user: { id: 'u1' },
        session: {},
        isLoading: false,
        sessionRestoration: { error: null },
      })
      renderApp('/')
      const locations = screen.getAllByTestId('location')
      expect(locations.some((el) => el.getAttribute('data-pathname') === '/')).toBe(true)
      expect(screen.getAllByRole('link', { name: 'Dashboard' })[0]).toBeInTheDocument()
      expect(screen.getAllByRole('link', { name: 'Users' })[0]).toBeInTheDocument()
    })
  })

  describe('authenticated shell access', () => {
    it('shows layout and dashboard when authenticated at /', () => {
      mockUseUnifiedAuth.mockReturnValue({
        user: { id: 'u1' },
        session: {},
        isLoading: false,
        sessionRestoration: { error: null },
      })
      renderApp('/')
      const dashboardLinks = screen.getAllByRole('link', { name: 'Dashboard' })
      const usersLinks = screen.getAllByRole('link', { name: 'Users' })
      expect(dashboardLinks[0]).toHaveAttribute('href', '/')
      expect(usersLinks[0]).toHaveAttribute('href', '/users')
      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    })
  })

  describe('PaceAppLayout navItems', () => {
    it('shows base nav (Dashboard, Users) for non–super-admin', () => {
      mockUseUnifiedAuth.mockReturnValue({
        user: { id: 'u1' },
        session: {},
        isLoading: false,
        sessionRestoration: { error: null },
      })
      mockUsePermissionLevel.mockReturnValue({
        permissionLevel: 'member',
        isLoading: false,
      })
      renderApp('/')
      const dashboardLinks = screen.getAllByRole('link', { name: 'Dashboard' })
      const usersLinks = screen.getAllByRole('link', { name: 'Users' })
      expect(dashboardLinks[0]).toHaveAttribute('href', '/')
      expect(usersLinks[0]).toHaveAttribute('href', '/users')
      expect(screen.queryByRole('link', { name: 'Login History' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Applications & Pages' })).not.toBeInTheDocument()
    })

    it('shows super-admin nav items when isSuperAdmin', () => {
      mockUseUnifiedAuth.mockReturnValue({
        user: { id: 'u1' },
        session: {},
        isLoading: false,
        sessionRestoration: { error: null },
      })
      mockUsePermissionLevel.mockReturnValue({
        permissionLevel: 'super_admin',
        isLoading: false,
      })
      renderApp('/')
      const dashboardLinks = screen.getAllByRole('link', { name: 'Dashboard' })
      const usersLinks = screen.getAllByRole('link', { name: 'Users' })
      expect(dashboardLinks[0]).toHaveAttribute('href', '/')
      expect(usersLinks[0]).toHaveAttribute('href', '/users')
      expect(screen.getByRole('link', { name: 'Login History' })).toHaveAttribute(
        'href',
        '/login-history'
      )
      expect(screen.getByRole('link', { name: 'Applications & Pages' })).toHaveAttribute(
        'href',
        '/applications-and-pages'
      )
    })
  })
})

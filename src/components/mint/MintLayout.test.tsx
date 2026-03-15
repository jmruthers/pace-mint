import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { MintLayout } from './MintLayout'

vi.mock('@jmruthers/pace-core', () => ({
  PaceAppLayout: ({
    appName,
    navItems,
    enforcePermissions,
    children,
  }: {
    appName: string
    navItems: { id: string; label: string; href: string }[]
    enforcePermissions: boolean
    children: React.ReactNode
  }) => (
    <main data-testid="pace-app-layout">
      <span data-testid="app-name">{appName}</span>
      <span data-testid="enforce-permissions">{String(enforcePermissions)}</span>
      <nav>
        {navItems.map((item) => (
          <a key={item.id} href={item.href} data-testid={`nav-${item.id}`}>
            {item.label}
          </a>
        ))}
      </nav>
      {children}
    </main>
  ),
}))

const mockUsePermissionLevel = vi.fn()
vi.mock('@jmruthers/pace-core/rbac', () => ({
  usePermissionLevel: (...args: unknown[]) => mockUsePermissionLevel(...args),
}))

describe('MintLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders PaceAppLayout with app name and Outlet', () => {
    mockUsePermissionLevel.mockReturnValue({ permissionLevel: 'member', isLoading: false })
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<MintLayout />}>
            <Route index element={<span>Child</span>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    const layout = screen.getAllByTestId('pace-app-layout')[0]
    expect(layout).toBeInTheDocument()
    expect(within(layout).getByTestId('app-name')).toHaveTextContent('MINT')
    expect(within(layout).getByTestId('enforce-permissions')).toHaveTextContent('false')
  })

  it('includes Dashboard and Users in nav items', () => {
    mockUsePermissionLevel.mockReturnValue({ permissionLevel: 'member', isLoading: false })
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<MintLayout />}>
            <Route index element={null} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    const layout = screen.getAllByTestId('pace-app-layout')[0]
    const navDashboard = within(layout).getByTestId('nav-dashboard')
    const navUsers = within(layout).getByTestId('nav-users')
    expect(navDashboard).toHaveTextContent('Dashboard')
    expect(navDashboard).toHaveAttribute('href', '/')
    expect(navUsers).toHaveTextContent('Users')
    expect(navUsers).toHaveAttribute('href', '/users')
  })

  it('includes super-admin nav items when isSuperAdmin is true', () => {
    mockUsePermissionLevel.mockReturnValue({ permissionLevel: 'super_admin', isLoading: false })
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<MintLayout />}>
            <Route index element={null} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    const loginHistoryLink = screen.getByRole('link', { name: 'Login History' })
    const layoutWithSuperAdmin = loginHistoryLink.closest('main')
    expect(layoutWithSuperAdmin).toBeInTheDocument()
    const withinLayout = within(layoutWithSuperAdmin as HTMLElement)
    expect(withinLayout.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/')
    expect(withinLayout.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/users')
    expect(loginHistoryLink).toHaveAttribute('href', '/login-history')
    expect(withinLayout.getByRole('link', { name: 'Applications & Pages' })).toHaveAttribute(
      'href',
      '/applications-and-pages'
    )
  })
})

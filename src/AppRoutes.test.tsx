import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet } from 'react-router-dom'
import { AppRoutes } from './AppRoutes'

vi.mock('@jmruthers/pace-core', () => ({
  PaceLoginPage: () => <div data-testid="login-page">Login</div>,
  ProtectedRoute: ({
    loginPath,
  }: {
    children?: React.ReactNode
    loginPath: string
    requireEvent?: boolean
  }) => (
    <section data-testid="protected-route" data-login-path={loginPath}>
      <Outlet />
    </section>
  ),
}))

vi.mock('@/components/mint/MintLayout', () => ({
  MintLayout: () => (
    <main data-testid="mint-layout">
      <span>Layout</span>
    </main>
  ),
}))

describe('AppRoutes', () => {
  it('renders PaceLoginPage at /login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AppRoutes />
      </MemoryRouter>
    )
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('renders ProtectedRoute and MintLayout at /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    )
    expect(screen.getByTestId('protected-route')).toBeInTheDocument()
    expect(screen.getByTestId('mint-layout')).toBeInTheDocument()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('@jmruthers/pace-core', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="toast-provider">{children}</div>
  ),
}))

vi.mock('@/components/AppContent', () => ({
  AppContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-content">{children}</div>
  ),
}))

vi.mock('@/AppRoutes', () => ({
  AppRoutes: () => <div data-testid="app-routes">Routes</div>,
}))

describe('App', () => {
  it('renders ToastProvider wrapping AppContent and AppRoutes', () => {
    render(<App />)
    expect(screen.getByTestId('toast-provider')).toBeInTheDocument()
    expect(screen.getByTestId('app-content')).toBeInTheDocument()
    expect(screen.getByTestId('app-routes')).toBeInTheDocument()
  })
})

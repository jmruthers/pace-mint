import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppContent } from './AppContent'

const mockUseUnifiedAuth = vi.fn()
vi.mock('@jmruthers/pace-core', async (importOriginal) => {
  const actual = await importOriginal() as { Button: React.ComponentType<{ children: React.ReactNode; type?: string; onClick?: () => void }> }
  return {
    ...actual,
    useUnifiedAuth: () => mockUseUnifiedAuth(),
    Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
    CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CardHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
    CardTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
    LoadingSpinner: () => <div data-testid="loading-spinner">Loading</div>,
  }
})

function renderWithRouter(initialPath: string, ui: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      {ui}
    </MemoryRouter>
  )
}

describe('AppContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('shows loading UI when isLoading and not on login route', () => {
    mockUseUnifiedAuth.mockReturnValue({
      isLoading: true,
      sessionRestoration: { error: null },
      user: null,
      session: null,
    })
    renderWithRouter('/', <AppContent><span>Child</span></AppContent>)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.getByText('Loading session…')).toBeInTheDocument()
    expect(screen.queryByText('Child')).not.toBeInTheDocument()
  })

  it('does not show loading UI when on login route', () => {
    mockUseUnifiedAuth.mockReturnValue({
      isLoading: true,
      sessionRestoration: { error: null },
      user: null,
      session: null,
    })
    renderWithRouter('/login', <AppContent><span>Child</span></AppContent>)
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    expect(screen.getByText('Child')).toBeInTheDocument()
  })

  it('shows error UI when sessionRestoration.error is set and not on login route', () => {
    mockUseUnifiedAuth.mockReturnValue({
      isLoading: false,
      sessionRestoration: { error: new Error('Session failed') },
      user: null,
      session: null,
    })
    renderWithRouter('/', <AppContent><span>Child</span></AppContent>)
    expect(screen.getByTestId('card')).toBeInTheDocument()
    expect(screen.getByText('Authentication error')).toBeInTheDocument()
    expect(screen.getByText('Session failed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument()
  })

  it('renders children when not loading and no error', () => {
    mockUseUnifiedAuth.mockReturnValue({
      isLoading: false,
      sessionRestoration: { error: null },
      user: { id: 'u1' },
      session: {},
    })
    renderWithRouter(
      '/',
      <AppContent><span>Child content</span></AppContent>
    )
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })
})

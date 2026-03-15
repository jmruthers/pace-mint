import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardPage } from './DashboardPage'

vi.mock('@jmruthers/pace-core/rbac', () => ({
  PagePermissionGuard: ({
    children,
  }: {
    children: React.ReactNode
    pageName: string
    operation: string
  }) => <>{children}</>,
}))

describe('DashboardPage', () => {
  it('renders dashboard heading and placeholder', () => {
    render(<DashboardPage />)
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('MINT dashboard placeholder.')).toBeInTheDocument()
  })
})

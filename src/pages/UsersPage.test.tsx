import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UsersPage } from './UsersPage'

vi.mock('@jmruthers/pace-core/rbac', () => ({
  PagePermissionGuard: ({
    children,
  }: {
    children: React.ReactNode
    pageName: string
    operation: string
  }) => <>{children}</>,
}))

describe('UsersPage', () => {
  it('renders users heading and placeholder', () => {
    render(<UsersPage />)
    expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument()
    expect(screen.getByText('Users placeholder.')).toBeInTheDocument()
  })
})

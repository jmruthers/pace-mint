import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ApplicationsAndPagesPage } from './ApplicationsAndPagesPage'

vi.mock('@jmruthers/pace-core/rbac', () => ({
  PagePermissionGuard: ({
    children,
  }: {
    children: React.ReactNode
    pageName: string
    operation: string
  }) => <>{children}</>,
}))

describe('ApplicationsAndPagesPage', () => {
  it('renders applications and pages heading and placeholder', () => {
    render(<ApplicationsAndPagesPage />)
    expect(
      screen.getByRole('heading', { name: 'Applications & Pages' })
    ).toBeInTheDocument()
    expect(screen.getByText('Applications and pages placeholder.')).toBeInTheDocument()
  })
})

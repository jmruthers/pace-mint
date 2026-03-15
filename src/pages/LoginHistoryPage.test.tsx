import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoginHistoryPage } from './LoginHistoryPage'

describe('LoginHistoryPage', () => {
  it('renders login history heading and placeholder', () => {
    render(<LoginHistoryPage />)
    expect(screen.getByRole('heading', { name: 'Login History' })).toBeInTheDocument()
    expect(screen.getByText('Login history placeholder.')).toBeInTheDocument()
  })
})

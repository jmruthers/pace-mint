import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NotFoundPage } from './NotFoundPage'

describe('NotFoundPage', () => {
  it('renders not found heading and message', () => {
    render(<NotFoundPage />)
    expect(screen.getByRole('heading', { name: 'Not found' })).toBeInTheDocument()
    expect(screen.getByText('This page does not exist.')).toBeInTheDocument()
  })
})

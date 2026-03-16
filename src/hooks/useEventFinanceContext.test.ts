import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useEventFinanceContext } from './useEventFinanceContext'

const mockUseUnifiedAuth = vi.fn()
vi.mock('@jmruthers/pace-core', () => ({
  useUnifiedAuth: () => mockUseUnifiedAuth(),
}))

describe('useEventFinanceContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseUnifiedAuth.mockReturnValue({
      selectedEvent: null,
      selectedOrganisation: null,
      organisationLoading: false,
      eventLoading: false,
      error: null,
    })
  })

  it('returns expected shape with eventId, context, isLoading, error', () => {
    const { result } = renderHook(() => useEventFinanceContext())
    expect(result.current).toMatchObject({
      eventId: null,
      context: null,
      isLoading: false,
      error: null,
    })
    expect(result.current).toHaveProperty('eventId')
    expect(result.current).toHaveProperty('context')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('error')
  })

  it('returns context when selectedEvent and selectedOrganisation are set', () => {
    mockUseUnifiedAuth.mockReturnValue({
      selectedEvent: { id: 'e1' },
      selectedOrganisation: { id: 'o1' },
      organisationLoading: false,
      eventLoading: false,
      error: null,
    })
    const { result } = renderHook(() => useEventFinanceContext())
    expect(result.current.context).toEqual({ eventId: 'e1', organisationId: 'o1' })
    expect(result.current.eventId).toBe('e1')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('returns isLoading true when organisation or event is loading', () => {
    mockUseUnifiedAuth.mockReturnValue({
      selectedEvent: null,
      selectedOrganisation: null,
      organisationLoading: true,
      eventLoading: false,
      error: null,
    })
    const { result } = renderHook(() => useEventFinanceContext())
    expect(result.current.isLoading).toBe(true)
  })

  it('returns error when auth has error', () => {
    const err = new Error('Org load failed')
    mockUseUnifiedAuth.mockReturnValue({
      selectedEvent: null,
      selectedOrganisation: null,
      organisationLoading: false,
      eventLoading: false,
      error: err,
    })
    const { result } = renderHook(() => useEventFinanceContext())
    expect(result.current.error).toBe(err)
  })
})

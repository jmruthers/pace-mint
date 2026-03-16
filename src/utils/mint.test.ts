import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { getCurrentEventFinanceContext } from './mint'
import {
  useEventFinanceContext,
  __resetLastKnownContextForTesting,
} from '@/hooks/useEventFinanceContext'

const mockUseUnifiedAuth = vi.fn()
vi.mock('@jmruthers/pace-core', () => ({
  useUnifiedAuth: () => mockUseUnifiedAuth(),
}))

describe('getCurrentEventFinanceContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __resetLastKnownContextForTesting()
  })

  it('returns MintContext | null (null or object with eventId and organisationId)', () => {
    const result = getCurrentEventFinanceContext()
    if (result === null) {
      expect(result).toBeNull()
      return
    }
    expect(typeof result).toBe('object')
    expect(result).toHaveProperty('eventId')
    expect(result).toHaveProperty('organisationId')
    expect([null, 'string']).toContain(typeof result.eventId)
    expect([null, 'string']).toContain(typeof result.organisationId)
  })

  it('returns same context as useEventFinanceContext after hook runs with event and org set', () => {
    mockUseUnifiedAuth.mockReturnValue({
      selectedEvent: { id: 'e1' },
      selectedOrganisation: { id: 'o1' },
      organisationLoading: false,
      eventLoading: false,
      error: null,
    })
    const { result } = renderHook(() => useEventFinanceContext())
    expect(result.current.context).toEqual({
      eventId: 'e1',
      organisationId: 'o1',
    })
    expect(getCurrentEventFinanceContext()).toEqual({
      eventId: 'e1',
      organisationId: 'o1',
    })
  })
})

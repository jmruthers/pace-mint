import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useEventFinanceContext } from './useEventFinanceContext'

describe('useEventFinanceContext', () => {
  it('returns expected shape with eventId, context, isLoading, error', () => {
    const { result } = renderHook(() => useEventFinanceContext())
    expect(result.current).toMatchObject({
      eventId: null,
      context: null,
      isLoading: false,
      error: null,
    })
  })

  it('returns context when set', () => {
    const { result } = renderHook(() => useEventFinanceContext())
    expect(result.current.context).toBeNull()
    expect(result.current.eventId).toBeNull()
  })
})

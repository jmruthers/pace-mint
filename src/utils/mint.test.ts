import { describe, it, expect } from 'vitest'
import { getCurrentEventFinanceContext } from './mint'

describe('getCurrentEventFinanceContext', () => {
  it('returns null (shell contract)', () => {
    expect(getCurrentEventFinanceContext()).toBeNull()
  })
})

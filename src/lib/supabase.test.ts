import { describe, it, expect } from 'vitest'
import { supabaseClient } from './supabase'

describe('supabase', () => {
  it('exports supabaseClient (placeholder when env unset, or createClient result)', () => {
    expect(supabaseClient).toBeDefined()
    expect(typeof supabaseClient).toBe('object')
  })

  it('client has from method when config is set, or is empty object otherwise', () => {
    const hasFrom = typeof (supabaseClient as { from?: unknown }).from === 'function'
    const isEmpty = Object.keys(supabaseClient as object).length === 0
    expect(hasFrom || isEmpty).toBe(true)
  })
})

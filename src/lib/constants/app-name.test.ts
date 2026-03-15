import { describe, it, expect } from 'vitest'
import { APP_NAME } from './app-name'

describe('app-name', () => {
  it('exports APP_NAME as MINT', () => {
    expect(APP_NAME).toBe('MINT')
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMintPermissions } from './useMintPermissions'

const mockUseResourcePermissions = vi.fn()
vi.mock('@jmruthers/pace-core/rbac', () => ({
  useResourcePermissions: (resource: string, options?: unknown) =>
    mockUseResourcePermissions(resource, options),
}))

describe('useMintPermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseResourcePermissions.mockReturnValue({
      canRead: true,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canExport: false,
      isLoading: false,
    })
  })

  it('returns expected shape with canView, canEdit, canCreate, canDelete', () => {
    const { result } = renderHook(() => useMintPermissions())
    expect(result.current).toMatchObject({
      canView: true,
      canEdit: false,
      canCreate: false,
      canDelete: false,
    })
    expect(typeof result.current.isLoading).toBe('boolean')
  })

  it('calls useResourcePermissions with mint resource', () => {
    renderHook(() => useMintPermissions())
    expect(mockUseResourcePermissions).toHaveBeenCalledWith('mint', undefined)
  })
})

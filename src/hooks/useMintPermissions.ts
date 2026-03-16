import { useResourcePermissions } from '@jmruthers/pace-core/rbac'
import type { MintPermission } from '@/types/mint'

const MINT_RESOURCE = 'mint'

/**
 * MINT permission flags from pace-core RBAC.
 * Permissions are defined in pace-admin and stored in DB.
 */
export function useMintPermissions(): MintPermission & { isLoading: boolean } {
  const { canRead, canCreate, canUpdate, canDelete, isLoading } =
    useResourcePermissions(MINT_RESOURCE)

  return {
    canView: canRead,
    canEdit: canUpdate,
    canCreate,
    canDelete,
    isLoading,
  }
}

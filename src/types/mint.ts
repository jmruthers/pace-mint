/** MINT permission flags (derived from pace-core RBAC). */
export interface MintPermission {
  canView: boolean
  canEdit: boolean
  canCreate: boolean
  canDelete: boolean
}

/** Event finance context for MINT (shell placeholder). */
export interface MintContext {
  eventId: string | null
  organisationId: string | null
}

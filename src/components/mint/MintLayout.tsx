import { useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import { PaceAppLayout } from '@jmruthers/pace-core'
import { usePermissionLevel } from '@jmruthers/pace-core/rbac'
import { APP_NAME } from '@/lib/constants/app-name'

/**
 * MINT shell layout contract (M01c/M01d): wraps PaceAppLayout with appName,
 * navItems from usePermissionLevel (base: Dashboard, Users; super-admin: Login History,
 * Applications & Pages), enforcePermissions false, context selector props;
 * renders Outlet for nested routes.
 */
const baseNavItems: { id: string; label: string; href: string; permissions?: unknown }[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/', permissions: ['read:page.dashboard'] },
  { id: 'users', label: 'Users', href: '/users', permissions: ['read:page.users'] },
]

const superAdminNavItems: { id: string; label: string; href: string; permissions?: unknown }[] = [
  { id: 'login-history', label: 'Login History', href: '/login-history', permissions: [] },
  { id: 'applications-and-pages', label: 'Applications & Pages', href: '/applications-and-pages', permissions: [] },
]

export function MintLayout() {
  const { permissionLevel } = usePermissionLevel()
  const isSuperAdmin = permissionLevel === 'super_admin'
  const navItems = useMemo(() => {
    if (isSuperAdmin) {
      return [...baseNavItems, ...superAdminNavItems]
    }
    return baseNavItems
  }, [isSuperAdmin])

  return (
    <PaceAppLayout
      appName={APP_NAME}
      navItems={navItems}
      enforcePermissions={false}
      showContextSelector
      showOrganisations
      showEvents
    >
      <Outlet />
    </PaceAppLayout>
  )
}

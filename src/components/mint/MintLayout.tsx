import { useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import { PaceAppLayout } from '@jmruthers/pace-core'
import { usePermissionLevel } from '@jmruthers/pace-core/rbac'
import { APP_NAME } from '@/lib/constants/app-name'
import { MINT_PAGE_NAMES } from '@/lib/constants/pages'

const baseNavItems: { id: string; label: string; href: string; permissions?: unknown }[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/', permissions: ['read:page.dashboard'] },
  {
    id: MINT_PAGE_NAMES.FINANCIAL_CONTEXT,
    label: 'Financial context',
    href: '/financial-context',
    permissions: [`read:page.${MINT_PAGE_NAMES.FINANCIAL_CONTEXT}`],
  },
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
    >
      <Outlet />
    </PaceAppLayout>
  )
}

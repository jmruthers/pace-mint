import { type ReactNode } from 'react'
import { PagePermissionGuard } from '@jmruthers/pace-core/rbac'

export function UsersPage(): ReactNode {
  return (
    <PagePermissionGuard pageName="users" operation="read">
      <main>
        <section>
          <h1>Users</h1>
          <p>Users placeholder.</p>
        </section>
      </main>
    </PagePermissionGuard>
  )
}

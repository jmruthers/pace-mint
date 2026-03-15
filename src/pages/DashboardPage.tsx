import { type ReactNode } from 'react'
import { PagePermissionGuard } from '@jmruthers/pace-core/rbac'

export function DashboardPage(): ReactNode {
  return (
    <PagePermissionGuard pageName="dashboard" operation="read">
      <main>
        <section>
          <h1>Dashboard</h1>
          <p>MINT dashboard placeholder.</p>
        </section>
      </main>
    </PagePermissionGuard>
  )
}

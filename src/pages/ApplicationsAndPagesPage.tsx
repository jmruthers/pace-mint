import { type ReactNode } from 'react'
import { PagePermissionGuard } from '@jmruthers/pace-core/rbac'

export function ApplicationsAndPagesPage(): ReactNode {
  return (
    <PagePermissionGuard pageName="applications-and-pages" operation="read">
      <main>
        <section>
          <h1>Applications &amp; Pages</h1>
          <p>Applications and pages placeholder.</p>
        </section>
      </main>
    </PagePermissionGuard>
  )
}

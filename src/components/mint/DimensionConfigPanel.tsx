import { type ReactNode, useMemo } from 'react'
import { z } from '@jmruthers/pace-core/utils'
import { Button, Card, CardContent, CardHeader, CardTitle, DataTable, Form, FormField, createTextColumn } from '@jmruthers/pace-core'
import { useDimensionConfig } from '@/hooks/useDimensionConfig'
import { MINT_PAGE_NAMES } from '@/lib/constants/pages'
import type { FinancialDimensionDefinition } from '@/types/finance'

/** DataTable requires RowRecord (Record<string, unknown>). */
type DimensionRow = FinancialDimensionDefinition & Record<string, unknown>

export interface DimensionConfigPanelProps {
  contextId: string | null
}

const dimensionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  key: z.string().min(1, 'Key is required'),
  description: z.string().optional(),
})

type DimensionFormValues = z.infer<typeof dimensionSchema>

export function DimensionConfigPanel({ contextId }: DimensionConfigPanelProps): ReactNode {
  const {
    dimensions,
    isLoading,
    error,
    defineDimension,
    isPending,
    defineError,
    formKey,
  } = useDimensionConfig(contextId)

  async function handleAdd(data: DimensionFormValues) {
    if (!contextId) return
    await defineDimension({
      context_id: contextId,
      name: data.name.trim(),
      key: data.key.trim(),
      description: data.description?.trim() || undefined,
    })
  }

  if (!contextId) {
    return null
  }

  const dimensionColumns = useMemo(
    () => [
      createTextColumn<DimensionRow>({ accessorKey: 'name', header: 'Name' }),
      createTextColumn<DimensionRow>({ accessorKey: 'key', header: 'Key' }),
      createTextColumn<DimensionRow>({ accessorKey: 'description', header: 'Description' }),
    ],
    []
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dimensions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <section>
          <Form<DimensionFormValues>
            key={formKey}
            schema={dimensionSchema}
            defaultValues={{ name: '', key: '', description: '' }}
            onSubmit={handleAdd}
          >
            <fieldset className="grid gap-4 grid-cols-[1fr_1fr_1fr_auto] items-end" aria-label="Add dimension">
              <FormField<DimensionFormValues> name="name" label="Name" required />
              <FormField<DimensionFormValues> name="key" label="Key" required />
              <FormField<DimensionFormValues> name="description" label="Description (optional)" />
              <Button type="submit" disabled={isPending}>
                Add dimension
              </Button>
            </fieldset>
          </Form>
        </section>
        {(defineError ?? error) && (
          <p role="alert">
            {(defineError ?? error)?.message}
          </p>
        )}
        <section>
          {isLoading ? (
            <p>Loading dimensions…</p>
          ) : (
            <DataTable<DimensionRow>
              data={dimensions as DimensionRow[]}
              columns={dimensionColumns}
              rbac={{ pageName: MINT_PAGE_NAMES.FINANCIAL_CONTEXT }}
              getRowId={(row) => row.id}
              isLoading={false}
              emptyState={{
                title: 'No dimensions defined yet',
                description: 'Add one above.',
              }}
              features={{
                search: false,
                pagination: dimensions.length > 10,
                sorting: true,
                filtering: false,
                import: false,
                export: false,
                selection: false,
                creation: false,
                editing: false,
                deletion: false,
                deleteSelected: false,
                grouping: false,
                columnVisibility: false,
                columnReordering: false,
                hierarchical: false,
              }}
            />
          )}
        </section>
      </CardContent>
    </Card>
  )
}

import { type ReactNode } from 'react'
import { z } from '@jmruthers/pace-core/utils'
import { Button, Card, CardContent, CardHeader, CardTitle, Form, FormField, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@jmruthers/pace-core'
import { usePersistFinancialContext } from '@/hooks/usePersistFinancialContext'
import type { FinancialContext } from '@/types/finance'
import type { FinancialContextType, LifecycleStatus } from '@/types/finance'

const CONTEXT_TYPES: FinancialContextType[] = ['event', 'membership_program', 'organisation', 'project', 'grant']
const LIFECYCLE_STATUSES: LifecycleStatus[] = ['draft', 'active', 'archived', 'closed']

const financialContextSchema = z.object({
  context_type: z.enum(['event', 'membership_program', 'organisation', 'project', 'grant']),
  context_id: z.string().min(1, 'Context ID is required'),
  organisation_id: z.string().min(1, 'Organisation ID is required'),
  parent_context_id: z.string().optional(),
  lifecycle_status: z.enum(['draft', 'active', 'archived', 'closed']),
  base_currency: z.string().min(1, 'Base currency is required'),
})

type FinancialContextFormValues = z.infer<typeof financialContextSchema>

export interface FinancialContextFormProps {
  /** When editing, the existing context to update. */
  existing?: FinancialContext | null
  /** When true, organisation ID is read-only (e.g. pre-filled from event). */
  organisationIdReadOnly?: boolean
  /** Pre-filled organisation ID when creating from event. */
  defaultOrganisationId?: string
  /** Pre-filled context ID when creating from event (e.g. event id). */
  defaultContextId?: string
  onSuccess?: (context: FinancialContext) => void
  onCancel?: () => void
}

export function FinancialContextForm({
  existing,
  organisationIdReadOnly = false,
  defaultOrganisationId = '',
  defaultContextId = '',
  onSuccess,
  onCancel,
}: FinancialContextFormProps): ReactNode {
  const { create, update, isPending, error } = usePersistFinancialContext()
  const isEdit = Boolean(existing?.id)

  const defaultValues: FinancialContextFormValues = {
    context_type: existing?.context_type ?? 'event',
    context_id: existing?.context_id ?? defaultContextId,
    organisation_id: existing?.organisation_id ?? defaultOrganisationId,
    parent_context_id: existing?.parent_context_id ?? '',
    lifecycle_status: existing?.lifecycle_status ?? 'draft',
    base_currency: existing?.base_currency ?? 'AUD',
  }

  async function handleSubmit(data: FinancialContextFormValues) {
    if (isEdit && existing) {
      const result = await update({
        id: existing.id,
        context_type: data.context_type,
        context_id: data.context_id,
        organisation_id: data.organisation_id,
        parent_context_id: data.parent_context_id || null,
        lifecycle_status: data.lifecycle_status,
        base_currency: data.base_currency,
      })
      if (result.ok) onSuccess?.(result.data)
    } else {
      const result = await create({
        context_type: data.context_type,
        context_id: data.context_id,
        organisation_id: data.organisation_id,
        parent_context_id: data.parent_context_id || null,
        lifecycle_status: data.lifecycle_status,
        base_currency: data.base_currency,
      })
      if (result.ok) onSuccess?.(result.data)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit financial context' : 'Create financial context'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form<FinancialContextFormValues>
          schema={financialContextSchema}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
        >
          <section className="grid gap-4">
            <FormField<FinancialContextFormValues>
              name="context_type"
              label="Context type"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v ?? 'event')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTEXT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FormField<FinancialContextFormValues> name="context_id" label="Context ID" required />
            <FormField<FinancialContextFormValues>
              name="organisation_id"
              label="Organisation ID"
              required
              render={({ field }) => (
                <Input
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  readOnly={organisationIdReadOnly}
                />
              )}
            />
            <FormField<FinancialContextFormValues>
              name="parent_context_id"
              label="Parent context ID (optional)"
            />
            <FormField<FinancialContextFormValues>
              name="lifecycle_status"
              label="Lifecycle status"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v ?? 'draft')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {LIFECYCLE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FormField<FinancialContextFormValues> name="base_currency" label="Base currency" required />
            {error && (
              <p role="alert">
                {error.message}
              </p>
            )}
            <nav className="grid grid-cols-2 gap-2" aria-label="Form actions">
              <Button type="submit" disabled={isPending}>
                {isEdit ? 'Update' : 'Create'}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </nav>
          </section>
        </Form>
      </CardContent>
    </Card>
  )
}

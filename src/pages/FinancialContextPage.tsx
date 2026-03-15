import { type ReactNode, useState, useEffect } from 'react'
import { PagePermissionGuard } from '@jmruthers/pace-core/rbac'
import { MINT_PAGE_NAMES } from '@/lib/constants/pages'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@jmruthers/pace-core'
import { useEventFinanceContext } from '@/hooks/useEventFinanceContext'
import { useResolvedEventContextId } from '@/hooks/useResolvedEventContextId'
import { useFinancialContextsList } from '@/hooks/useFinancialContextsList'
import { useFinancialContext } from '@/hooks/useFinancialContext'
import { FinancialContextForm } from '@/components/mint/FinancialContextForm'
import { DimensionConfigPanel } from '@/components/mint/DimensionConfigPanel'
import type { FinancialContext } from '@/types/finance'
import { setContextCurrencies, setContextVariables } from '@/services/mint/contexts'
import { getContextCurrencies, getContextVariables } from '@/services/mint/contexts-read'

function NonEventCurrenciesVariablesCard({
  contextId,
  contextType,
  contextIdDisplay,
}: {
  contextId: string
  contextType: string
  contextIdDisplay: string
}) {
  const [currencies, setCurrencies] = useState<Array<{ id: string; currency_code: string; is_default: boolean }>>([])
  const [variables, setVariables] = useState<Array<{ key: string; label: string }>>([])
  const [newCurrency, setNewCurrency] = useState('')
  const [varKey, setVarKey] = useState('')
  const [varLabel, setVarLabel] = useState('')

  useEffect(() => {
    getContextCurrencies(contextId).then((r) => {
      if (r.ok) setCurrencies(r.data.map((c) => ({ id: c.id, currency_code: c.currency_code, is_default: c.is_default })))
    })
    getContextVariables(contextId).then((r) => {
      if (r.ok) setVariables(r.data.map((v) => ({ key: v.key, label: v.label })))
    })
  }, [contextId])

  async function addCurrency() {
    if (!newCurrency.trim()) return
    const result = await setContextCurrencies({
      context_id: contextId,
      currencies: [...currencies.map((c) => ({ currency_code: c.currency_code, is_default: c.is_default })), { currency_code: newCurrency.trim(), is_default: currencies.length === 0 }],
    })
    if (result.ok) {
      setCurrencies(result.data.map((c) => ({ id: c.id, currency_code: c.currency_code, is_default: c.is_default })))
      setNewCurrency('')
    }
  }

  async function addVariable() {
    if (!varKey.trim() || !varLabel.trim()) return
    const result = await setContextVariables({
      context_id: contextId,
      variables: [...variables.map((v) => ({ key: v.key, label: v.label })), { key: varKey.trim(), label: varLabel.trim() }],
    })
    if (result.ok) {
      setVariables(result.data.map((v) => ({ key: v.key, label: v.label })))
      setVarKey('')
      setVarLabel('')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Currencies and variables</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <p>Context: {contextType} / {contextIdDisplay}</p>
        <section className="grid gap-2">
          <h3>Functional currency</h3>
          <fieldset className="grid grid-cols-[1fr_auto] gap-2 items-end" aria-label="Add currency">
            <section className="grid gap-2">
              <Label htmlFor="new-currency">Currency code</Label>
              <Input
                id="new-currency"
                value={newCurrency}
                onChange={(v) => setNewCurrency(v)}
                placeholder="e.g. AUD"
              />
            </section>
            <Button type="button" onClick={addCurrency}>
              Add currency
            </Button>
          </fieldset>
          {currencies.length > 0 && (
            <ul>
              {currencies.map((c) => (
                <li key={c.id}>{c.currency_code}{c.is_default ? ' (default)' : ''}</li>
              ))}
            </ul>
          )}
        </section>
        <section className="grid gap-2">
          <h3>Variables</h3>
          <fieldset className="grid gap-2 grid-cols-[1fr_1fr_auto] items-end" aria-label="Add variable">
            <section className="grid gap-2">
              <Label htmlFor="var-key">Key</Label>
              <Input id="var-key" value={varKey} onChange={(v) => setVarKey(v)} />
            </section>
            <section className="grid gap-2">
              <Label htmlFor="var-label">Label</Label>
              <Input id="var-label" value={varLabel} onChange={(v) => setVarLabel(v)} />
            </section>
            <Button type="button" onClick={addVariable}>
              Add variable
            </Button>
          </fieldset>
          {variables.length > 0 && (
            <ul>
              {variables.map((v) => (
                <li key={v.key}>{v.key}: {v.label}</li>
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  )
}

export function FinancialContextPage(): ReactNode {
  const { eventId, context: eventContext } = useEventFinanceContext()
  const { contextId: resolvedContextId } = useResolvedEventContextId(eventId)
  const { data: contextsList, isLoading: listLoading, error: listError } = useFinancialContextsList()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingContext, setEditingContext] = useState<FinancialContext | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (resolvedContextId != null) setSelectedId(resolvedContextId)
  }, [resolvedContextId])

  const selectedContext = selectedId
    ? contextsList.find((c) => c.id === selectedId) ?? null
    : null
  const { data: selectedDetail } = useFinancialContext(selectedId ?? '')

  const effectiveSelected = selectedDetail ?? selectedContext
  const isEventType = effectiveSelected?.context_type === 'event'
  const isFromEvent = Boolean(eventId && resolvedContextId === selectedId)

  function handleCreateSuccess(ctx: FinancialContext) {
    setSelectedId(ctx.id)
    setCreateOpen(false)
  }

  function handleEditSuccess() {
    setEditingContext(null)
  }

  return (
    <PagePermissionGuard pageName={MINT_PAGE_NAMES.FINANCIAL_CONTEXT} operation="read">
      <main className="grid gap-6">
        <section>
          <h1>Financial context</h1>
          <p>
            A financial context defines who owns a piece of finance (e.g. an event, a program, an organisation).
            You can attach dimensions to planning, transactions, and ledger records so the same concepts work
            across budgeting, actuals, and reporting.
          </p>
          <ol>
            <li>Create a financial context (choose type and IDs, set lifecycle, then create).</li>
            <li>Select the context to add currencies, variables, and dimensions.</li>
            {eventId && (
              <li>When an event is selected in the header, organisation and context ID can be pre-filled.</li>
            )}
          </ol>
        </section>

        <section>
          <details open={createOpen} onToggle={(e) => setCreateOpen(Boolean((e.target as HTMLDetailsElement)?.open))}>
            <summary>Create financial context</summary>
            <FinancialContextForm
              defaultContextId={eventId ?? ''}
              defaultOrganisationId={eventContext?.organisationId ?? ''}
              organisationIdReadOnly={Boolean(eventId)}
              onSuccess={handleCreateSuccess}
              onCancel={() => setCreateOpen(false)}
            />
          </details>
        </section>

        <section>
          <h2>Contexts</h2>
          {listError && <p role="alert">{listError.message}</p>}
          {listLoading && <p>Loading contexts…</p>}
          {!listLoading && contextsList.length === 0 && (
            <p>No financial contexts yet. Create one above.</p>
          )}
          {!listLoading && contextsList.length > 0 && (
            <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {contextsList.map((ctx) => (
                <li
                  key={ctx.id}
                  className={selectedId === ctx.id ? 'ring-2 ring-main-500 rounded-md' : undefined}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>{ctx.context_type} / {ctx.context_id}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                      <p>Base currency: {ctx.base_currency}</p>
                      <nav className="flex gap-2" aria-label="Context actions">
                        <Button
                          type="button"
                          variant={selectedId === ctx.id ? 'default' : 'outline'}
                          onClick={() => setSelectedId(ctx.id)}
                        >
                          Select
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingContext(ctx)
                            setCreateOpen(false)
                          }}
                        >
                          Edit
                        </Button>
                      </nav>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        {editingContext && (
          <section>
            <FinancialContextForm
              existing={editingContext}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingContext(null)}
            />
          </section>
        )}

        {selectedId && effectiveSelected && (
          <>
            {isFromEvent && (
              <p>Configuring financial context for selected event.</p>
            )}
            <section className="grid gap-6">
              {isEventType ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Currencies and variables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Context: {effectiveSelected.context_type} / {effectiveSelected.context_id}</p>
                    <p>Event-type context: use VariableConfigPanel and CurrencyConfigPanel (M03).</p>
                  </CardContent>
                </Card>
              ) : (
                <NonEventCurrenciesVariablesCard
                  contextId={selectedId}
                  contextType={effectiveSelected.context_type}
                  contextIdDisplay={effectiveSelected.context_id}
                />
              )}
            </section>
            <section>
              <DimensionConfigPanel contextId={selectedId} />
            </section>
          </>
        )}

        {eventId && !resolvedContextId && !listLoading && (
          <p>No financial context for this event yet. Create one below.</p>
        )}
      </main>
    </PagePermissionGuard>
  )
}
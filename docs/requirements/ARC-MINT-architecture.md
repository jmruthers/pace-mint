# MINT Financial Architecture

This document defines the shared architectural foundation for MINT (pace-mint) as the finance engine for the PACE suite. It is intentionally generic so it can support event budgeting and forecasting, actual transaction import and reconciliation, member payments and invoices, merchandise and fee sales, credits and refunds, organisation-level budgets and reporting, and grant and restricted-fund tracking. This doc stands on its own as the main architectural reference for pace-mint.

---

## How this relates to the current schema

The existing schema contains useful MINT foundations (e.g. `mint_budget_variables`, `mint_budgets`, `mint_audit_log`, `mint_security_log`, invoicing, credits, payment methods, webhooks). This architecture proposes the target structure that can absorb these with minimal throwaway work. See § 8 for migration classifications.

---

## Design principles

- Build **generic financial primitives** first, then compose event-specific workflows on top.
- Keep **planning** (budgets/forecasts) separate from the **book of record** (ledger).
- Model finance around **contexts** and **dimensions**, not around one app or one entity type.
- Treat invoices, payment methods, imports, and allocations as bounded contexts that eventually feed a shared ledger.
- Make auditability and RBAC first-class, aligned to the PACE standards framework.

---

## Table of contents

- [§ 1 Core financial architecture](#-1-core-financial-architecture)
- [§ 2 Financial context & dimensions](#-2-financial-context--dimensions)
- [§ 3 Chart of accounts & ledger](#-3-chart-of-accounts--ledger)
- [§ 4 Planning engine: budgets, forecasts & scenarios](#-4-planning-engine-budgets-forecasts--scenarios)
- [§ 5 Actuals ingestion, allocation & reconciliation](#-5-actuals-ingestion-allocation--reconciliation)
- [§ 6 Billing, receivables & money movement](#-6-billing-receivables--money-movement)
- [§ 7 Reporting, audit & controls](#-7-reporting-audit--controls)
- [§ 8 Platform integration & migration](#-8-platform-integration--migration)

---

## § 1 Core financial architecture

### Overview

- Purpose and scope: define the shared architectural foundation for MINT as the finance engine for all PACE apps, not just event budgeting.
- Dependencies: none.
- Standards: 01 Project Structure, 02 Architecture, 03 Security & RBAC, 04 API & Tech Stack, 05 pace-core Compliance, 06 Code Quality, 08 Testing & Documentation, 09 Operations.

### Acceptance criteria

- [ ] MINT is defined as a **platform finance app** with bounded contexts rather than a single feature area.
- [ ] The architecture distinguishes three layers of financial truth: **planning**, **operational transactions**, and **ledger/reporting**.
- [ ] Every financial capability in PACE is mapped to one of the following bounded contexts: Planning, Ledger, Billing, Payments, Actuals Ingestion, Allocation, Reporting, Audit.
- [ ] App-specific workflows from BASE, TEAM, MEDI, and future apps can create finance events without owning the finance model.
- [ ] A single generic model exists for financial ownership based on **context** and **dimensions**, rather than hard-coding `event_id` into every future finance table.
- [ ] The architecture preserves compatibility with the current MINT schema where sensible, but does not treat it as the final target model.
- [ ] All service boundaries follow Standard 02: no business rules embedded in page components, and no UI-only contracts leaking into persistence models.

### API / Contract

- Public exports: `FinancialContext`, `FinancialDimension`, `LedgerAccount`, `LedgerEntry`, `BudgetPlan`, `BudgetVersion`, `ActualImportBatch`, `ActualTransaction`, `TransactionAllocation`, `Invoice`, `Payment`, `CreditBalance`, `FinancialReportRequest`.
- Public service contracts:
  - `createFinancialContext(input): ApiResult<FinancialContext>`
  - `postLedgerEntry(input): ApiResult<LedgerEntry>`
  - `createBudgetVersion(input): ApiResult<BudgetVersion>`
  - `importActualTransactions(input): ApiResult<ActualImportBatch>`
  - `allocateTransaction(input): ApiResult<TransactionAllocation[]>`
  - `issueInvoice(input): ApiResult<Invoice>`
  - `recordPayment(input): ApiResult<Payment>`
  - `runFinancialReport(input): ApiResult<FinancialReportResult>`
- File paths under the app (Standard 01): `src/services/finance/contexts/*`, `src/services/finance/ledger/*`, `src/services/finance/planning/*`, `src/services/finance/billing/*`, `src/services/finance/imports/*`, `src/services/finance/reporting/*`, `src/types/finance/*`.
- No implementation detail; only contract.

### Verification

- Provide a page or flow that explains the MINT architecture and shows one example lifecycle: create financial context, define dimensions, create budget, import actuals, allocate actuals, post ledger impact, render report.
- The user can inspect a finance object and see which bounded context owns it.

### Testing requirements

- Unit tests for service contracts and type guards.
- Integration tests proving the architecture supports at least two different business flows: event budgeting flow, member billing flow.
- Contract tests that enforce ApiResult shape per Standard 02 and Standard 04.
- Tests proving no direct dependency from UI components into persistence functions.

### Do not

- Do not design MINT as "the event budget app".
- Do not bake `event_id` into every primary finance concept.
- Do not let invoice/payment tables become the implicit ledger.
- Do not merge planning data and actual/ledger data into the same table.

### References

- Standards 00–09. Existing schema objects: `mint_budgets`, `mint_budget_variables`, `mint_invoice`, `mint_line_item`, `mint_credit_balance`, `mint_payment_method`, `mint_action_log`, `mint_audit_log`, `mint_security_log`, `mint_webhook_log`.

---

## § 2 Financial context & dimensions

### Overview

- Purpose and scope: define the generic ownership and slicing model for all finance in MINT.
- Dependencies: § 1 Core Financial Architecture.
- Standards: 01, 02, 03, 04, 05, 08.

### Acceptance criteria

- [ ] MINT supports a generic `financial_context` concept that can represent an event, organisation program, merchandise program, grant, membership cycle, or future finance-bearing entity.
- [ ] Each financial context has a `context_type`, `context_id`, organisation ownership, optional parent context, lifecycle status, and base currency.
- [ ] MINT supports reusable **dimensions** that can be attached to planning, transactions, and ledger records. Initial supported dimensions include event, program, unit, member, supplier, customer, fund, project, and source app.
- [ ] The same transaction can carry multiple dimensions without schema redesign.
- [ ] Event-specific setup from the first MINT phase becomes one specialisation of a generic context model, not a one-off design.
- [ ] Multi-currency rules are set at context level, with one functional currency per context and optional transaction currencies.
- [ ] RBAC can be evaluated at context level using pace-core permissions, consistent with Standard 03.

### API / Contract

- Public exports: `FinancialContext`, `FinancialContextType`, `FinancialDimensionDefinition`, `FinancialDimensionValue`, `ContextCurrencySetting`, `ContextVariableDefinition`.
- Public service contracts:
  - `createFinancialContext(input): ApiResult<FinancialContext>`
  - `updateFinancialContext(input): ApiResult<FinancialContext>`
  - `defineDimension(input): ApiResult<FinancialDimensionDefinition>`
  - `setContextCurrencies(input): ApiResult<ContextCurrencySetting[]>`
  - `setContextVariables(input): ApiResult<ContextVariableDefinition[]>`
- Proposed core tables: `mint_financial_context`, `mint_financial_context_link`, `mint_dimension_definition`, `mint_dimension_value`, `mint_record_dimension`, `mint_context_currency`, `mint_context_variable`.
- No implementation detail; only contract.

### Verification

- Page or flow for creating a financial context of type `event` and another of type `membership_program`.
- Flow for adding currencies, variables, and dimensions to a context.
- Inspection view showing how the same dimension model can be reused by budgets, imports, invoices, and ledger entries.

### Testing requirements

- Unit tests for context validation and dimension assignment.
- Integration tests for context-scoped RBAC.
- Tests that a context can be nested or linked without circular reference issues.
- Tests that dimension assignments remain valid across multiple finance modules.

### Do not

- Do not encode "event" as the only finance owner.
- Do not create separate dimension schemes per submodule.
- Do not duplicate currency and variable logic in multiple places.

### References

- Existing event-oriented budget fields in `mint_budget_variables` and `mint_budgets` should be absorbed into a more generic context model over time.

---

## § 3 Chart of accounts & ledger

### Overview

- Purpose and scope: define the long-term book of record for MINT.
- Dependencies: § 1 Core Financial Architecture, § 2 Financial Context & Dimensions.
- Standards: 01, 02, 03, 04, 06, 08, 09.

### Acceptance criteria

- [ ] MINT defines a generic chart of accounts that supports assets, liabilities, equity/funds, income, and expenses.
- [ ] The chart of accounts can be organisation-wide, with optional context-specific visibility or restrictions.
- [ ] MINT supports balanced journal-style ledger entries with one header and two or more lines.
- [ ] Ledger lines can carry dimensions so reports can be sliced by event, fund, member, project, or source app.
- [ ] Planning records, actual imports, invoices, payments, credits, and adjustments can all resolve to ledger entries through explicit posting rules.
- [ ] The ledger stores both transaction currency amounts and functional/base currency amounts where relevant.
- [ ] The ledger is append-oriented: corrections happen via reversals and adjusting entries, not destructive edits.

### API / Contract

- Public exports: `LedgerAccount`, `LedgerAccountType`, `LedgerEntry`, `LedgerEntryLine`, `PostingRule`, `PostingSourceReference`.
- Public service contracts:
  - `createLedgerAccount(input): ApiResult<LedgerAccount>`
  - `postLedgerEntry(input): ApiResult<LedgerEntry>`
  - `reverseLedgerEntry(input): ApiResult<LedgerEntry>`
  - `getTrialBalance(input): ApiResult<TrialBalance>`
  - `getLedgerMovements(input): ApiResult<LedgerEntryLine[]>`
- Proposed core tables: `mint_ledger_account`, `mint_ledger_entry`, `mint_ledger_entry_line`, `mint_posting_rule`, `mint_source_posting`.
- No implementation detail; only contract.

### Verification

- Flow for creating a small chart of accounts.
- Flow that posts: an invoice issuance entry, a payment receipt entry, an imported expense entry.
- Report showing trial balance and account movements.

### Testing requirements

- Unit tests for balancing rules, debit/credit validation, and posting rule resolution.
- Integration tests proving that billing and actual import flows can both post to the same ledger.
- Tests for reversals, currency conversion, and dimensional reporting.
- Regression tests to ensure ledger entries are immutable after posting.

### Do not

- Do not treat invoice tables as the ledger.
- Do not allow unbalanced ledger entries.
- Do not overwrite posted financial history in place.
- Do not embed report logic directly in UI pages.

### References

- Existing operational schema objects such as `mint_invoice`, `mint_line_item`, `mint_credit_balance`, and import/allocation objects should become posting sources, not substitutes for ledger accounting.

---

## § 4 Planning engine: budgets, forecasts & scenarios

### Overview

- Purpose and scope: define the planning layer for budgets, forecasts, and future scenarios without conflating it with actuals or ledger truth.
- Dependencies: § 1 Core Financial Architecture, § 2 Financial Context & Dimensions.
- Standards: 01, 02, 03, 04, 05, 07, 08.

### Acceptance criteria

- [ ] MINT supports a generic planning model with **plan**, **version**, **line hierarchy**, and **scenario** concepts.
- [ ] Event budgeting is implemented as one context-specific plan type within the generic planning engine.
- [ ] Plans support unlimited hierarchical depth with a single root for each plan version.
- [ ] Human-readable system-generated codes express hierarchy without using UUIDs.
- [ ] Each leaf line can store planning metadata including income/expense classification, description, timing granularity, variable reference, currency, confidence, notes, and attachments.
- [ ] Timing supports exact date and month/year-only modes.
- [ ] Parent lines are roll-up nodes and cannot be directly edited for amount-bearing values.
- [ ] Forecast UI shows the current forecast value, while forecast history is retained as audit/version data.
- [ ] Baseline locking is version-based: once a version is approved, planners can create a new working forecast version without mutating the approved baseline.
- [ ] Variable drivers and currency settings are inherited from the financial context where appropriate.

### API / Contract

- Public exports: `BudgetPlan`, `BudgetVersion`, `BudgetLine`, `BudgetLineTiming`, `ForecastSnapshot`, `PlanScenario`, `PlanAttachment`.
- Public service contracts:
  - `createPlan(input): ApiResult<BudgetPlan>`
  - `createPlanVersion(input): ApiResult<BudgetVersion>`
  - `addBudgetLine(input): ApiResult<BudgetLine>`
  - `updateBudgetLine(input): ApiResult<BudgetLine>`
  - `approvePlanVersion(input): ApiResult<BudgetVersion>`
  - `createForecastSnapshot(input): ApiResult<ForecastSnapshot>`
- Proposed core tables: `mint_plan`, `mint_plan_version`, `mint_plan_line`, `mint_plan_line_attachment`, `mint_plan_forecast_history`.
- Mapping note: existing `mint_budgets` and `mint_budget_variables` can seed this module, but should evolve into versioned planning entities.
- No implementation detail; only contract.

### Verification

- Page for an event budget plan with hierarchical editing, currencies, variables, and forecast updates.
- Page for a non-event plan, such as an annual membership revenue forecast.
- Approval flow showing baseline vs working forecast version.

### Testing requirements

- Unit tests for hierarchy code generation, roll-up calculation, timing rules, variable-driven calculations, and currency conversion.
- Integration tests for version approval, forecast history, and attachment behaviour.
- Tests proving parent lines are non-editable for direct amount entry.
- Tests proving a baseline version remains immutable once approved.

### Do not

- Do not store approved baseline and live forecast in the same mutable record.
- Do not couple budgets to event-only concepts.
- Do not allow direct editing of roll-up node amount fields.
- Do not rely on soft business rules in the UI only.

### References

- Existing schema objects: `mint_budgets`, `mint_budget_variables`, `mint_audit_log`.

---

## § 5 Actuals ingestion, allocation & reconciliation

### Overview

- Purpose and scope: define how external and internal financial activity enters MINT and is matched to plans, contexts, and ledger outcomes.
- Dependencies: § 1 Core Financial Architecture, § 2 Financial Context & Dimensions, § 3 Chart of Accounts & Ledger, § 4 Planning Engine.
- Standards: 01, 02, 03, 04, 06, 08, 09.

### Acceptance criteria

- [ ] MINT supports import batches for external actuals sources such as Xero, Weel, OLEMS, and future providers.
- [ ] Each imported transaction stores source metadata, transaction metadata, raw mapping traceability, processing status, and reconciliation status.
- [ ] Raw source files do not need to remain the long-term source of truth, but import lineage must remain traceable.
- [ ] Transactions can be allocated to one or many planning lines, ledger accounts, or dimensions, depending on workflow.
- [ ] Split allocations must total the imported transaction amount before they can be finalised.
- [ ] Unallocated or partially allocated actuals remain visible as controlled exceptions.
- [ ] Users can drill from a planning line into contributing actual transactions and allocations.
- [ ] Reconciliation status supports at least unmatched, proposed, matched, partially matched, and excluded states.
- [ ] Imports can optionally create or propose ledger postings based on posting rules.

### API / Contract

- Public exports: `ActualImportBatch`, `ActualTransaction`, `ActualTransactionSource`, `TransactionAllocation`, `ReconciliationState`, `AllocationTargetReference`.
- Public service contracts:
  - `importActualTransactions(input): ApiResult<ActualImportBatch>`
  - `validateImportBatch(input): ApiResult<ImportValidationResult>`
  - `allocateTransaction(input): ApiResult<TransactionAllocation[]>`
  - `reconcileTransaction(input): ApiResult<ReconciliationResult>`
  - `getActualsForPlanLine(input): ApiResult<ActualTransaction[]>`
- Proposed core tables: `mint_actual_import_batch`, `mint_actual_transaction`, `mint_actual_transaction_attachment`, `mint_transaction_allocation`, `mint_reconciliation_record`.
- No implementation detail; only contract.

### Verification

- CSV import page for actual transactions.
- Allocation page supporting split allocation to multiple budget lines.
- Drilldown from a budget/forecast line into linked actual transactions.
- Exception widget showing unallocated actuals.

### Testing requirements

- Unit tests for import parsing, amount balancing, allocation validation, and reconciliation transitions.
- Integration tests for import-to-allocation-to-ledger workflows.
- Tests for partial allocation behaviour and exception reporting.
- Performance tests for large import batches.

### Do not

- Do not make planning line totals editable proxies for imported actuals.
- Do not discard source lineage after import.
- Do not permit allocation totals that differ from the source transaction amount.
- Do not hide unallocated actuals.

### References

- Existing MINT budgeting should consume this module for actual-vs-budget visibility.

---

## § 6 Billing, receivables & money movement

### Overview

- Purpose and scope: define the operational billing and payment model that supports member payments, event fees, merchandise, refunds, credits, and future receivables workflows.
- Dependencies: § 1 Core Financial Architecture, § 2 Financial Context & Dimensions, § 3 Chart of Accounts & Ledger.
- Standards: 01, 02, 03, 04, 05, 06, 08, 09.

### Acceptance criteria

- [ ] MINT supports billing documents and line items as operational receivables objects, separate from ledger entries.
- [ ] Billing supports source app attribution so BASE, TEAM, and future apps can create charges through a shared contract.
- [ ] Payment methods and payment events are generic enough to support cards, direct debit, and future methods.
- [ ] Credits, refunds, voids, and payment adjustments are modelled as first-class finance events with audit traceability.
- [ ] Billing documents, payments, credits, and refunds can all post to the shared ledger via posting rules.
- [ ] Attachments and supporting evidence can be associated with invoices, payments, and transactional records where needed.
- [ ] Existing MINT invoice/payment tables can be preserved initially, but the public contract is expressed in generic terms so the schema can evolve without breaking consuming apps.

### API / Contract

- Public exports: `Invoice`, `InvoiceLine`, `Receivable`, `Payment`, `PaymentMethod`, `Refund`, `CreditBalance`, `BillingSourceReference`.
- Public service contracts:
  - `issueInvoice(input): ApiResult<Invoice>`
  - `addInvoiceLine(input): ApiResult<InvoiceLine>`
  - `recordPayment(input): ApiResult<Payment>`
  - `refundPayment(input): ApiResult<Refund>`
  - `applyCredit(input): ApiResult<CreditBalance>`
  - `attachBillingEvidence(input): ApiResult<AttachmentReference>`
- Proposed target tables: `mint_billing_document`, `mint_billing_line`, `mint_payment`, `mint_payment_event`, `mint_payment_method`, `mint_credit_balance`, `mint_refund`.
- Mapping note: current `mint_invoice`, `mint_line_item`, `mint_payment_method`, `mint_credit_balance`, `mint_action_log`, `mint_webhook_log`, and mandate/consent logs are strong starting assets.
- No implementation detail; only contract.

### Verification

- Member fee invoice flow.
- Event fee billing flow from BASE into MINT.
- Refund and credit application flow.
- Operational view showing invoice/payment status vs posted ledger impact.

### Testing requirements

- Unit tests for billing state transitions, refund rules, and credit application logic.
- Integration tests for source app initiated billing.
- Tests for payment-event idempotency and webhook handling.
- Tests proving operational billing records and ledger postings stay consistent but separate.

### Do not

- Do not let consuming apps create bespoke invoice tables.
- Do not hard-code one payment gateway into the public finance model.
- Do not use invoice status changes as a substitute for ledger posting.
- Do not lose audit history for refunds, voids, or payment-method consent events.

### References

- Existing schema objects: `mint_invoice`, `mint_line_item`, `mint_payment_method`, `mint_credit_balance`, `mint_action_log`, `mint_dd_mandate_log`, `mint_mit_consent_log`, `mint_webhook_log`, `mint_idempotency`.

---

## § 7 Reporting, audit & controls

### Overview

- Purpose and scope: define how MINT surfaces trustworthy finance information and enforces control disciplines.
- Dependencies: § 1 Core Financial Architecture, § 3 Chart of Accounts & Ledger, § 4 Planning Engine, § 5 Actuals Ingestion, § 6 Billing, Receivables & Money Movement.
- Standards: 02, 03, 04, 06, 08, 09.

### Acceptance criteria

- [ ] Reporting is driven primarily from ledger and dimensional data, with planning and operational overlays where relevant.
- [ ] MINT supports at least these report families: budget vs actual, receivables, cash movements, trial balance, context summary, and exception reports.
- [ ] Dashboards can aggregate by top-level planning line, account, confidence level, source, context, or dimension.
- [ ] Unallocated actuals, failed postings, stale forecasts, and reconciliation gaps are exposed as exceptions rather than hidden.
- [ ] Audit logging distinguishes operational audit, financial audit, and security-sensitive audit events.
- [ ] Sensitive finance actions are permission-gated and traceable to user, timestamp, source, and before/after values where applicable.
- [ ] The control model supports maker/checker style approvals for selected actions in future phases, even if not all are enabled on day one.

### API / Contract

- Public exports: `FinancialReportRequest`, `FinancialReportResult`, `DashboardMetric`, `ExceptionItem`, `AuditEvent`, `ApprovalState`.
- Public service contracts:
  - `runFinancialReport(input): ApiResult<FinancialReportResult>`
  - `getDashboardMetrics(input): ApiResult<DashboardMetric[]>`
  - `getFinanceExceptions(input): ApiResult<ExceptionItem[]>`
  - `recordAuditEvent(input): ApiResult<AuditEvent>`
  - `approveFinancialAction(input): ApiResult<ApprovalDecision>`
- Proposed core tables: `mint_report_snapshot` (optional), `mint_exception_queue`, `mint_financial_approval`; reuse and expand `mint_audit_log` and `mint_security_log`.
- No implementation detail; only contract.

### Verification

- Dashboard page with budget vs actual, confidence mix, and unallocated actuals.
- Finance exceptions page.
- Audit viewer page showing operational vs security events.
- Approval workflow for one controlled financial action.

### Testing requirements

- Unit tests for report aggregation and exception generation.
- Integration tests for dashboard correctness using realistic seeded data.
- Permission tests for finance-sensitive audit visibility.
- Tests proving all critical finance mutations generate auditable events.

### Do not

- Do not build dashboards directly from ad hoc UI queries.
- Do not hide financial exceptions because they are inconvenient.
- Do not mix security logging and financial audit semantics without clear typing.
- Do not make approvals optional for actions explicitly marked as controlled.

### References

- Existing schema objects: `mint_audit_log`, `mint_security_log`.

---

## § 8 Platform integration & migration

### Overview

- Purpose and scope: define how MINT becomes the shared finance platform for PACE without forcing a disruptive rewrite.
- Dependencies: § 1 through § 7.
- Standards: 01, 02, 04, 05, 08, 09.

### Acceptance criteria

- [ ] MINT exposes shared finance contracts that consuming apps can adopt incrementally.
- [ ] BASE, TEAM, and future apps integrate with MINT through finance services/contracts rather than direct table ownership.
- [ ] Existing MINT schema assets are classified into: keep as-is for now, adapt behind service contracts, or replace over time.
- [ ] A migration path exists from event-first budgeting to generic context-based planning.
- [ ] A migration path exists from current invoice/payment tables to a more generic billing and ledger posting model without breaking existing production behaviour.
- [ ] pace-core candidates are explicitly identified whenever a component or hook becomes reusable across apps.
- [ ] Operational rollout can be phased behind feature flags and validation tooling in line with Standard 09.

### API / Contract

- Public exports: `FinanceIntegrationEvent`, `FinanceSourceApp`, `FinanceFeatureFlag`, `MigrationClassification`, `PostingPreview`.
- Public service contracts:
  - `previewPostingImpact(input): ApiResult<PostingPreview>`
  - `registerFinanceSource(input): ApiResult<FinanceSourceRegistration>`
  - `classifyLegacyObject(input): ApiResult<MigrationClassification>`
  - `enableFinanceFeature(input): ApiResult<FeatureFlagState>`
- Initial migration classifications: `mint_budget_variables` → adapt into context variables; `mint_budgets` → adapt into plan/version/line structures; `mint_invoice` and `mint_line_item` → keep operationally, wrap behind billing services; `mint_payment_method`, consent logs, mandate logs, webhook log, idempotency → keep and wrap behind payments services; `mint_audit_log` and `mint_security_log` → keep and extend.
- No implementation detail; only contract.

### Verification

- Integration page showing how a consuming app would submit a finance event to MINT.
- Migration dashboard listing legacy-to-target classifications.
- Feature-flagged rollout of one finance capability.

### Testing requirements

- Contract tests for source app integrations.
- Migration tests showing legacy records can be read and surfaced via new service contracts.
- Tests for feature-flagged coexistence of old and new flows.
- Operational tests aligned to Standard 09 rollout expectations.

### Do not

- Do not force every consuming app to wait for the full target architecture before integrating.
- Do not expose raw table structure as the integration contract.
- Do not rewrite working operational payment flows without an explicit migration path.
- Do not create one-off finance adapters per app if a shared contract can solve the problem.

### References

- Existing MINT schema as uploaded. pace-core reuse rules from Standard 05.
- [M01 – MINT Shell & Foundations](implemented/M01-mint-shell-foundations.md) (§ Supabase and RBAC setup): required RPCs in the pace-mint Supabase project and app bootstrap (setupRBAC, UnifiedAuthProvider, OrganisationServiceProvider, EventServiceProvider) so RBAC and context loading work.

---

## Prompt to use with Cursor

Implement the feature described in this document. Follow the standards and guardrails provided. Add or update tests and verification flows as specified in "Testing requirements" and "Verification". Run validate and fix any issues until it passes.

---

**Checklist before running Cursor:** intro doc + guardrails doc + Cursor rules + ESLint config + this architecture doc.

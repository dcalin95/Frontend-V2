# BITS Investigator - Target Architecture

## Principles

1. Evidence collection is deterministic and server-side.
2. Missing provider capability produces an explicit partial or failed state, never synthetic data.
3. Every case and mutation is tenant-scoped.
4. AI explains evidence but does not create blockchain facts.
5. Every expensive operation has a server-enforced budget.

## Runtime components

- React workspace: navigation, forms, paginated views, filters, selection, and ephemeral layout state.
- Express Investigator API: validation, authorization, orchestration, pagination, exports, and audit events.
- PostgreSQL: cases, subjects, observations, findings, evidence, notes, jobs, snapshots, and AI runs.
- Provider adapters: Etherscan V2 plus chain RPC behind one capability interface.
- Analysis worker: bounded collection, normalization, detectors, evidence linkage, and summary generation.
- AI adapter: structured evidence-only prompt, schema-validated response, citations, and disabled mode.

## Request flow

1. Authenticated user creates a case.
2. User adds one or more validated subjects.
3. API records an idempotent analysis job and immutable scope.
4. Worker collects provider observations with provenance.
5. Normalizer produces transactions, transfers, contracts, entities, and relationships.
6. Versioned detectors create findings referencing evidence IDs.
7. Optional AI produces an interpretation referencing existing evidence IDs.
8. UI incrementally loads summary, findings, flows, timeline, and context details.

## UI shell

- Collapsible left case navigation.
- Main content with compact subject composer and tabbed investigation views.
- Collapsible right evidence/entity/assistant inspector.
- No decorative telemetry or giant empty metrics.
- Back action returns to Futures Ops for the deep-linked route.

## Delivery sequence

The first production slice is: authenticated case creation, multi-subject validation, Etherscan/RPC collection, persisted evidence, deterministic findings, case reopen, and paginated rendering. Graph traversal, contract static analysis, holder analytics, and collaboration follow as capability increments.

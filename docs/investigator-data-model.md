# BITS Investigator - Data Model

Use a dedicated `investigator` schema or consistently prefixed public tables. Do not overload OTA trading analysis tables.

## Core tables

- `investigations`: tenant, owner, title, objective, status, priority, scope, versions, timestamps.
- `investigation_subjects`: case, type, chain, identifier, label, role, provenance, confidence, status.
- `investigation_entities`: normalized entity and metadata observed in a case.
- `investigation_relationships`: typed, evidence-backed entity edges.
- `investigation_transactions`: normalized transaction headers.
- `investigation_transfers`: native, internal, and token movements.
- `investigation_contracts`: creation, code, ABI, proxy, ownership, and capability facts.
- `investigation_findings`: detector output, severity, confidence, status, interpretation, limitations.
- `investigation_evidence`: immutable observation reference, provider provenance, content hash.
- `investigation_hypotheses`: investigator or AI hypothesis with alternatives and evidence links.
- `investigation_notes`, `investigation_tasks`, `investigation_bookmarks`.
- `investigation_jobs`: idempotency key, scope, progress, stage, error, retries.
- `investigation_snapshots`: reproducible case and graph state.
- `investigation_audit_events`: actor, action, target, request correlation, timestamp.
- `provider_observations`, `detector_executions`, `ai_analysis_runs`.

## Required invariants

- Tenant and investigation foreign keys are present on every mutable or sensitive row.
- Subject identifiers are normalized and unique within a case where appropriate.
- Findings reference evidence through a join table.
- Evidence payloads have a stable content hash and collection timestamp.
- Detector and analysis versions are immutable for one execution.
- Provider errors and scope limits are stored, not discarded.
- AI rows cannot be marked as primary blockchain evidence.

## Migration policy

Use additive migrations only. Add indexes for tenant/case/time, subject lookup, transaction hash, address, finding status, evidence hash, and job status. Apply row ownership in repository queries even when database-level row security is not enabled.

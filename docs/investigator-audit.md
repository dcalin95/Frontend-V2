# BITS Investigator - Production Audit

Date: 2026-07-30

## 1. Existing architecture

The production UI is React and is rendered by `InvestigatorWorkspace.jsx`. The target deep link is interpreted by `OTAShortOpsPage.jsx`; a separate `/investigator` React route also renders the same workspace. Data is assembled by `investigatorService.js` from the Express backend, public browser RPC endpoints, and a BSC large-transfer endpoint. The Express backend exposes `GET /api/investigator/analyse/:address` and `GET /api/investigator/report/:address.pdf`.

There is also a separate FastAPI MVP under `integrations/crypto-investigator-mvp`. It is not the production architecture and duplicates the Express analysis.

## 2. Current route behavior

`/dex-edu/ota/short-ops?tab=long#/investigator` previously treated `investigator` as an anchor and rendered the workspace below Futures Ops. The current local change detects the hash and renders the Investigator alone with a back action. `/investigator` remains a separate standalone route.

## 3. Existing implemented functionality

- EVM address and transaction-hash validation.
- Ethereum, BNB Chain, and Base chain selection.
- Native balance and bytecode presence through public JSON-RPC.
- A limited list of tracked BNB Chain token balances.
- Recent ERC-20 transfers through Etherscan V2 when configured.
- Deterministic heuristics for fan-in, fan-out, pass-through, repeated amounts, and large nominal transfers.
- Normalized overview, findings, evidence rows, flow rows, and timeline rows.
- JSON export and backend PDF export.
- Local notes, local history, local reopen, and a context-shaped AI prompt.
- Bounded frontend limits for evidence and flow rows.

## 4. Missing functionality

Persistent multi-subject cases, server-side authorization, tenant isolation, async jobs, native/internal transactions, receipts, traces, complete token holdings, verified source and ABI analysis, holder analysis, liquidity analysis, bridge/exchange labels, historical USD normalization, multi-hop flow traversal, an interactive graph, finding review persistence, hypotheses, tasks, audit log, case versioning, server-side reporting, and grounded AI evidence enforcement are missing.

## 5. Placeholder functionality

The hero telemetry and command-center presentation are decorative. The backend and FastAPI MVP generate synthetic transfers when `ETHERSCAN_API_KEY` is missing. Some overview fields are derived from incomplete samples and must not be presented as complete chain history.

## 6. Hardcoded or mocked data

- `routes/investigator.js` contains hardcoded sample transfers.
- `integrations/crypto-investigator-mvp/app/providers.py` contains a second synthetic sample.
- Public RPC URLs are hardcoded in the browser.
- The browser checks only a short hardcoded token list on BNB Chain.
- Tests use mocked investigation objects, which is appropriate for unit tests but does not prove production integration.

## 7. Frontend-only functionality

Cases, drafts, notes, history, and snapshots are stored in `localStorage`. The scope key is not an authorization boundary. The browser performs RPC calls and deterministic normalization. The AI assistant uses the current UI context but does not receive backend-issued evidence citations with server enforcement.

## 8. Backend functionality

The Express route validates one address and one of three chain IDs, calls Etherscan for ERC-20 transfers, runs four simple heuristics, and streams a PDF. It has global API rate limiting and common Helmet/CORS middleware, but the Investigator route has no route-specific authentication or ownership enforcement.

## 9. Persistence functionality

There is no Investigator database persistence. Existing `ota.analysis_requests`, `ota.analysis_results`, and `ota.agent_sessions` are trading-oriented and cannot safely represent cases without incompatible semantics. They may provide conventions for IDs, timestamps, JSONB metadata, and user scoping.

## 10. Blockchain provider functionality

Etherscan V2 token transfers are the only server-side Investigator provider capability. Browser RPC supplies balances, bytecode, blocks, receipts, logs, and limited token calls. Provenance is incomplete and provider failures produce partial frontend results. No provider capability matrix or server-side fallback policy exists.

## 11. AI functionality

The UI can ask the existing AI chat service to summarize current data. There is no Investigator-specific server endpoint, schema validation, citation enforcement, prompt-injection boundary, persisted AI run, token/cost audit, or AI-disabled contract.

## 12. Security problems

- Synthetic data can be returned for a real address.
- Investigator endpoints are not protected by Investigator-specific auth or tenant checks.
- Browser RPC/provider use bypasses server policy, caching, redaction, and audit.
- Local storage is mutable and is not authoritative persistence.
- No IDOR controls exist because cases do not exist server-side.
- AI evidence is not treated as untrusted structured data at a server boundary.
- No graph/query-depth or request-body controls exist for future complex operations.

## 13. UX problems

The current workspace is a long card stack with oversized empty panels, decorative telemetry, duplicated status, weak navigation, and limited data density. It does not provide collapsible case navigation or a contextual inspector. The prior embedded route caused overlap with Futures Ops and global widgets.

## 14. Performance risks

Browser RPC fan-out, unpaginated local snapshots, large JSON serialization, non-virtualized tables, repeated provider reads, and no server cache/job queue will not scale. Multi-hop graph expansion is not implemented and therefore has no enforceable server budget.

## 15. Data-quality risks

Nominal amounts from different tokens are summed or compared without USD normalization. Etherscan results are a bounded recent page, not full history. First/last seen values can describe only the sample. Labels and entity roles are absent. Synthetic mode is the highest-severity data integrity defect.

## 16. Technical debt

Investigator logic is duplicated across React, Express, and FastAPI. Presentation and normalization live in one large frontend service. The large workspace component combines case state, analysis, rendering, notes, assistant, history, and export.

## 17. Reusable components

Reuse the existing Express server, PostgreSQL pool and migration runner, OTA wallet authentication middleware conventions, API rate limiting, provider timeout patterns, AI proxy/billing conventions, PDFKit, shared address utilities, and the current normalized evidence/findings UI as an incremental migration path.

## 18. Components to remove

Remove synthetic production fallbacks, the duplicate FastAPI production path, decorative telemetry, command-center wording, browser-owned authoritative persistence, and direct browser provider calls once equivalent server capabilities exist.

## 19. Recommended target architecture

Use the main Express backend with PostgreSQL case tables, authenticated tenant-scoped APIs, bounded asynchronous analysis jobs, a server-side provider adapter, normalized observations, versioned deterministic detectors, evidence-linked findings, and an optional grounded AI layer. The React workspace should consume paginated APIs and keep only ephemeral UI state locally.

## 20. File-by-file implementation plan

- `backend-server/routes/investigator.js`: replace the single demo endpoint with authenticated case and analysis routes.
- `backend-server/src/investigator/*`: add validation, provider adapters, normalization, detectors, jobs, repositories, and AI grounding.
- `backend-server/src/ota/migrations/110_investigator_cases.sql`: add non-destructive Investigator tables.
- `frontend/.../services/investigatorService.js`: replace browser-owned analysis and local persistence with authenticated APIs.
- `frontend/.../InvestigatorWorkspace.jsx`: split shell, case sidebar, subject form, result views, and context panel.
- `frontend/.../investigator-workspace.css`: replace dashboard styling with a compact Investigator token system.
- `frontend/.../__tests__`: add route, multi-subject, evidence, partial-data, and authorization tests.
- `docs/investigator-*.md`: maintain architecture, model, provider, security, and verification contracts.

## Audit verdict

The current implementation is a useful prototype vertical slice, not a completed professional investigation platform. Real ERC-20 data can work when Etherscan is configured, but the application is not production-safe while synthetic fallback, unauthenticated access, browser persistence, and incomplete provenance remain.

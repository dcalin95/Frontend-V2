# BITS Investigator - Security Contract

## Authorization

All case routes require the established wallet/session authentication mechanism. Repository queries must include both investigation ID and authenticated tenant/user ID. Never authorize from a request-supplied wallet address alone.

## Input and resource controls

- Strict EVM address, transaction hash, chain, date, pagination, and enum validation.
- Request-size, subject-count, date-range, provider-record, graph-node, graph-edge, and hop limits.
- Idempotency keys for create/run/resume operations.
- Rate limits for create, run, graph expansion, AI, and exports.

## Output and browser safety

Render external metadata as text. Sanitize any Markdown. Construct explorer URLs from allowlisted chain bases and validated identifiers. Use safe download names and explicit content types. Do not expose provider payloads containing secrets.

## AI boundary

Token metadata, source code, transaction input, labels, notes, and uploads are untrusted evidence. They are delimited as data, never inserted as system instructions. AI output is schema validated and may cite only evidence IDs available to the authenticated case.

## Audit and privacy

Record case mutations, finding decisions, exports, AI runs, and authorization failures. Redact API keys, cookies, authorization headers, private keys, and unnecessary full prompts. Uploaded content requires MIME, size, malware, and storage policy before uploads are enabled.

## Current critical gaps

Synthetic fallback, unauthenticated Investigator endpoints, browser-owned persistence, and browser provider calls must be removed before production-complete status.

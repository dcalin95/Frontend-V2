# Repository and deployment map

**Updated:** 2026-07-26

| Concern | Source of truth | Production |
| --- | --- | --- |
| Browser UI | `C:\Users\bits\Desktop\frontend` | S3 `bits-ai.io` + CloudFront |
| API and workers | `C:\Users\bits\Desktop\backend-server` | Render `backend-server-eu` |
| Database schema | Backend OTA/DEX migrations | Render PostgreSQL |
| Frontend public config | frontend `.env.local` or build environment | compiled browser bundle |
| Backend secrets and runtime config | Render Environment dashboard | Render runtime |

## Ownership rules

1. Frontend code calls the backend through
   `https://backend-server-eu.onrender.com`.
2. Values prefixed with `REACT_APP_` are public. They must never contain
   passwords, API secrets, private keys, or operator credentials.
3. Render variables remain in Render. Repository files may document required
   variable names, validation, and safe non-secret defaults, but never copy live
   secret values.
4. S3 contains only the compiled frontend build.
5. Backend releases come from the `main` branch of
   `dcalin95/backend-server`; frontend releases come from the `main` branch of
   `dcalin95/Frontend`.

## OTA route ownership

- User interface: `src/components/DEX_edu_reference/frontend/`
- Frontend OTA context and client contracts:
  `src/components/DEX_edu_reference/ota/`
- Execution, risk enforcement, migrations, accounting, and exchange adapters:
  backend `src/ota/`

The UI can display or request a risk setting, but only the backend can persist
and enforce it.

## Workspace hygiene

- Temporary deploy worktrees must be removed after a verified release.
- Unrelated applications belong beside `frontend`, not inside it.
- Dirty experimental clones are never merged or deleted as part of cleanup.
- Generated output and local diagnostics must be ignored or stored in a
  dedicated archive, not at repository root.

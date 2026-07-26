# BitSwapDEX AI frontend

This repository contains the browser application served at
[`https://bits-ai.io`](https://bits-ai.io).

## Repository boundaries

- Frontend source: `C:\Users\bits\Desktop\frontend`
- Backend source: `C:\Users\bits\Desktop\backend-server`
- Frontend production: `https://bits-ai.io`
- Backend production: `https://backend-server-eu.onrender.com`
- Backend API root: `https://backend-server-eu.onrender.com/api`

Backend code, Render secrets, database migrations, and private trading credentials
do not belong in this repository. Unrelated applications must live beside this
repository, never inside it.

## Start here

1. [`DOCUMENTATION_INDEX.md`](DOCUMENTATION_INDEX.md)
2. [`docs/REPOSITORY_MAP.md`](docs/REPOSITORY_MAP.md)
3. [`src/components/DEX_edu_reference/ota/docs/CURRENT_OPERATIONAL_TRUTH.md`](src/components/DEX_edu_reference/ota/docs/CURRENT_OPERATIONAL_TRUTH.md)

Documents named `FINAL`, `COMPLETE`, old incident reports, and dated rollout
notes are historical evidence unless the documentation index explicitly marks
them as current.

## Local development

Create an untracked `.env.local`:

```env
REACT_APP_BACKEND_URL=https://backend-server-eu.onrender.com
```

Then run:

```bash
npm ci --ignore-scripts
npm start
```

Verification:

```bash
npm test -- --watchAll=false --runInBand
npm run build
```

## Deployment

The production build is uploaded to the S3 bucket `bits-ai.io` and served
through CloudFront. The supported manual command is:

```bash
npm run deploy:s3
```

Never upload source files, `.env` files, or backend configuration to S3.

## Security and product truth

- Every `REACT_APP_*` value is public in the browser bundle.
- Render environment values are managed in Render. Documentation contains names
  and contracts only, never secret values.
- The frontend cannot grant administrative or trading authority; the backend
  must authenticate and authorize every privileged request.
- OTA cannot guarantee profit or eliminate trading losses.

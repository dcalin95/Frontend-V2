# Sky Control Refactor Plan

1. Fix production API routing by removing the unproven `bits-ai.io` same-origin override and using the existing authenticated backend runtime resolver.
2. Preserve current `/dex-edu/sky-control` route, header buttons, feature flag, and existing tabs.
3. Reframe Overview as a QMC Command Center using existing backend health, overview, runtime, bot fleet, payments, admin, discovery, and provider data.
4. Add targeted backend read-only QMC endpoints for command-center aggregates, targets/checks, keywords, support, events, and safe data explorer.
5. Add frontend areas for Command Center, Global Investigation Search, Targets & Checks, Keywords, Support/Admin, Runtime & Events, Response Console, and Data Sources/Security.
6. Keep existing Forensics and Wallet Intelligence; integrate links and summaries without inventing ownership or blockchain facts.
7. Keep Response Console default READ ONLY; expose no state-changing action unless backend permission allows it.
8. Reuse existing repository SELECT-only guard, redaction, runtime provider, wallet intelligence, and forensics helpers.
9. Add targeted Sky Control backend tests and frontend tests for API routing and the new command-center/area rendering.
10. Run targeted Sky Control/QMC tests and frontend production build only.
11. Stage only relevant Sky Control files and this plan.
12. Commit/push backend if changed; verify Render deployment/health.
13. Commit/push frontend if changed; build and deploy exact build to S3 `bits-ai.io`; invalidate CloudFront.
14. Live-verify `https://bits-ai.io/#/dex-edu/sky-control` for data rendering, auth, buttons, tabs, response console state, and secret redaction.

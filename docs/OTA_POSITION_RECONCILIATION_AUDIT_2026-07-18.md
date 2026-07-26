# OTA Position Reconciliation Audit - 2026-07-18

## Executive diagnosis

The XRP contradiction is caused by two independent position pipelines:

1. `getOpenPositionsResult()` loads spot cost-basis positions into `positions`, loads `ota.long_positions` into `longPositions`, and returns both in `allPositions`.
2. The same function builds `trackedPositionsForRecon` from `positions` only. `longPositions` are deliberately omitted.
3. `runReconciliation()` therefore receives no XRP tracked amount and classifies the XRP vault balance as `residual_inventory_without_position`.
4. The long standalone monitor reads `ota.long_positions` directly and reports the persistent XRP row as open.
5. Analytics uses `OtaAnalyticsService.getOpenPositionsCostBasis()`, which derives spot positions from `ota.execution_history` and does not represent a futures row in `ota.long_positions`.

This produces the observed combination:

| Value | Actual source | Meaning in the current code |
| --- | --- | --- |
| `openCount: 1` | `ota.long_positions` / standalone monitor | one open long futures row |
| `positionsReturned: 1` | `allPositions = positions + longPositions + shortPositions` | one row returned to the agent |
| `trackedCount: 0` | `runReconciliation(trackedPositionsForRecon)` | only spot/direct-entry/imported rows were supplied |
| analytics `positionCount: 0` | `getOpenPositionsCostBasis()` | no open spot BUY in `execution_history` |
| `CYCLE_OPEN_POSITIONS_BUILT positionCount: 1` | agent result count | the long row was returned, independently of reconciliation |

The bug is a source-selection defect, not an XRP symbol problem and not evidence that the vault balance should be converted into a new position.

## Required structural fix

Implement one backend resolver, `resolveCanonicalOpenPositions(userId, options)`, in the backend repository. It must return canonical records with at least:

- `canonicalState`: `tracked_open_long`, `tracked_open_short`, `tracked_open_spot`, `external_inventory`, `closed_with_residual`, `quote_output`, `dust`, or `inconsistent_position_state`;
- `positionId`, `positionSide`, `token`, `quoteToken`, `entryPrice`, `trackedQuantity`, `sourceOfTruth`;
- `vaultQuantity`, `quantityDelta`, `managementAllowed`, `newOpenAllowed`, `warnings`.

Source precedence:

1. valid persistent open long/short row;
2. valid direct-entry open row;
3. execution-history BUY without a matching later SELL/CLOSE;
4. vault balance for quantity validation only;
5. balance without position evidence is external/residual inventory and must not be auto-sold.

The resolver must canonicalize wallet case, `XRP`/`XRPUSDT` symbols, and `BNB`/`WBNB`. It must aggregate partial closes before calculating the remaining quantity and invalidate stale cache entries after every open/close mutation.

## Exact backend patch locations

The first correctness patch belongs in `src/ota/tools/agentTools.js`:

```js
const trackedPositionsForRecon = [
  ...positions,
  ...longPositions,
  ...shortPositions,
].map((p) => ({
  token: p.token,
  amount: p.amount,
  source: p.source,
  positionSide: p.positionSide,
  positionId: p.positionId,
  entryPrice: p.entryPrice,
}));
```

However, this is only the immediate contradiction fix. Long/short rows currently have `amount: null`, so the full resolver must use the position's actual quantity or a clearly documented notional-to-quantity conversion. Passing a null amount would still make the reconciliation unable to validate the XRP quantity.

The second patch belongs in the same function's return path: `positionsReturned`, `count`, `reconciliationSummary.trackedCount`, and analytics must be derived from the resolver's canonical collection, not independently from `allPositions` and `execution_history`.

The third patch belongs in `OtaAnalyticsService.getOpenPositionsAnalytics()` and `getOpenPositionsCostBasis()`: include canonical futures records, preserve `positionSide`, and expose a source label rather than reporting zero when only `ota.long_positions` contains the open position.

The fourth patch belongs in the standalone monitor and executor bootstrap: consume the resolver, while keeping defensive management enabled for `tracked_open_long` and `inconsistent_position_state` when there is sufficient persistent evidence.

## XRP decision rule

For the reported XRP row, the resolver must inspect:

- `ota.long_positions`: `status=open`, entry approximately `1.1590454545`, position id and quantity/notional;
- `ota.execution_history`: matching open/close records, if any;
- `ota.direct_entry_positions`: matching open row, if any;
- vault XRP quantity, expected around `23.905662`;
- close history and cache freshness.

If the persistent long row is open and its quantity is compatible within fee/rounding tolerance, the canonical result is `tracked_open_long`, `managementAllowed=true`, `newOpenAllowed=false`. If the persistent row is closed, the monitor must stop reporting it and any remaining vault amount is `external_inventory` or `closed_with_residual`, never an automatic sell candidate.

## Quote-token and confidence checks

Every analysis cycle must carry one normalized `quoteToken` from context through market data, sizing, execution, and logs. A `BNB` executor context must not silently become `USDT` in `OTA_FLOW`.

Confidence logs must record the complete calculation, for example:

`base + regimeDelta + riskDelta + engineOnlyDelta + calibrationDelta + overrides = finalMinConfidence`

The `0.65` to `0.90` jump in the supplied BTC log cannot be called correct until the active override (conservative profile, engine-only mode, calibration, or production policy) is identified in code and included in the emitted calculation.

The current executor inspection shows an important detail: `_floorOpenConfidenceProfile()` applies `productionLiveMinConfidence` as a hard floor when `productionLiveProfileEnabled` is true, and `_resolveAdaptiveConfidenceThreshold()` also applies risk, regime, calibration, BTC propagation, and BTC-bias adjustments. The current logs do not emit one complete additive breakdown. The requested log must be added at the final return point, including the production floor separately from additive deltas, so a `0.90` result is auditable instead of appearing as an unexplained override.

## Tests required before deployment

Add backend unit/integration coverage for the 15 cases in the attached audit request, especially:

- persistent long row with incomplete execution history;
- monitor-visible but reconciliation-invisible position;
- duplicate position rows;
- partial close and fee tolerance;
- `XRP` versus `XRPUSDT` and mixed-case wallets;
- cache after close and restart rehydration;
- vault-only residual inventory that must remain non-actionable.

The existing test `src/ota/services/__tests__/ImportedTrackedPositionsService.test.js` currently asserts the defective behavior for a long futures row: it expects XRP not to be in `reconciliationTrackedPositions` and to remain untracked. That expectation must be replaced once the backend patch is applied.

## Deployment status

This audit was completed from the frontend workspace with read-only inspection of `C:\Users\bits\Desktop\backend-server`. The backend resolver and route/service changes are not deployed by this workspace-only pass. Do not claim the production contradiction is fixed until the backend patch, migrations if needed, focused tests, and a production probe are completed.

/**
 * Tabel poziții Spot sau CFD — demo: TP/SL simulate; live: date din contract (V2: TP/SL on-chain dacă sunt setate).
 */
import React from 'react';
import { ethers } from 'ethers';
import { CFD_TP_SL_ONCHAIN_SUPPORTED } from '../../utils/leverageUtils';
import { computeCfdPositionPnlAmount } from '../../utils/leverageCfdPnl';

function formatNum(n, decimals = 2) {
  if (n == null || Number.isNaN(n)) return '—';
  return Number(n).toFixed(decimals);
}

export default function LeveragePositionsTable({
  mode,
  positions,
  cfdPositions,
  cfdPricesByAsset = {},
  loading,
  BPS_DENOMINATOR,
  getTokenDecimals,
  onClose,
  onCloseCFD,
  txPending,
  isDemoMode = false,
  liveTradingBlocked = false,
  chainGatePending = false,
  showSpotCollateralUi = false,
  onManageSpotCollateral,
}) {
  if (loading) return <p className="leverage-placeholder">Loading…</p>;

  if (mode === 'spot') {
    if (positions.length === 0) return null;
    return (
      <div className="leverage-table-wrap">
        {isDemoMode && <p className="leverage-positions-demo-badge" aria-label="Demo mode">Demo – simulated positions</p>}
        <table className="leverage-table" role="grid" aria-label="Spot positions">
          <thead>
            <tr>
              <th scope="col">Id</th>
              <th scope="col">Collateral</th>
              <th scope="col">Borrowed</th>
              <th scope="col">Leverage</th>
              <th scope="col" className="leverage-table-num">Entry / Liq.</th>
              <th scope="col">Collateral</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => {
              const collDec = getTokenDecimals?.(p.collateralToken) ?? 18;
              const borrowedDec = getTokenDecimals?.(p.borrowedToken) ?? 18;
              const leverageX = (Number(p.leverageRatio) / BPS_DENOMINATOR).toFixed(1);
              const entry = ethers.utils.formatUnits(p.entryPrice || '0', 18);
              const liq = ethers.utils.formatUnits(p.liquidationPrice || '0', 18);
              return (
                <tr key={p.positionId}>
                  <td>{typeof p.positionId === 'string' && p.positionId.length > 16 ? p.positionId.slice(-8) : p.positionId}</td>
                  <td className="leverage-table-num">{ethers.utils.formatUnits(p.collateralAmount || '0', collDec)}</td>
                  <td className="leverage-table-num">{ethers.utils.formatUnits(p.borrowedAmount || '0', borrowedDec)}</td>
                  <td className="leverage-table-num">{leverageX}x</td>
                  <td className="leverage-table-num">{entry} / {liq}</td>
                <td>
                  {showSpotCollateralUi ? (
                    <button
                      type="button"
                      className="leverage-btn leverage-btn-outline leverage-btn-sm"
                      onClick={() => onManageSpotCollateral?.(p)}
                      disabled={txPending || liveTradingBlocked}
                      title="Add or remove collateral from UserVault"
                    >
                      {liveTradingBlocked ? (chainGatePending ? '…' : 'BSC') : 'Manage'}
                    </button>
                  ) : (
                    <span className="leverage-na" title="Collateral adjust is for live spot positions only">
                      —
                    </span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => onClose(p.positionId)}
                    disabled={txPending || liveTradingBlocked}
                    className="leverage-btn leverage-btn-outline leverage-btn-sm"
                    title={liveTradingBlocked ? (chainGatePending ? 'Checking network…' : 'Switch to BSC to close') : undefined}
                  >
                    {liveTradingBlocked ? (chainGatePending ? '…' : 'BSC only') : 'Close'}
                  </button>
                </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (cfdPositions.length === 0) return null;
  const liveCfd = !isDemoMode;
  return (
    <div className="leverage-table-wrap">
      {isDemoMode && <p className="leverage-positions-demo-badge" aria-label="Demo mode">Demo – simulated positions</p>}
      {liveCfd && (
        <p className="leverage-cfd-live-hint" role="note">
          Live CFD: data from BSC contract.{' '}
          {CFD_TP_SL_ONCHAIN_SUPPORTED
            ? 'V2 stores optional TP/SL on-chain; hitting them still requires someone to send triggerCFDCloseIfTPSL (not automated by Bits).'
            : 'No on-chain TP/SL in this build — liquidation when shown is contract-derived. Close manually.'}
        </p>
      )}
      <table className="leverage-table" role="grid" aria-label="CFD positions">
        <thead>
          <tr>
            <th scope="col">Id</th>
            <th scope="col">Asset</th>
            <th scope="col" className="leverage-table-num">Margin</th>
            <th scope="col" className="leverage-table-num">Leverage</th>
            <th scope="col">Direction</th>
            <th scope="col" className="leverage-table-num">Entry</th>
            {isDemoMode ? (
              <>
                <th scope="col" className="leverage-table-num">
                  TP <span className="leverage-th-sim">(sim., not auto)</span>
                </th>
                <th scope="col" className="leverage-table-num">
                  SL <span className="leverage-th-sim">(sim., not auto)</span>
                </th>
              </>
            ) : CFD_TP_SL_ONCHAIN_SUPPORTED ? (
              <>
                <th scope="col" className="leverage-table-num">Liq. (on-chain)</th>
                <th scope="col" className="leverage-table-num">TP (on-chain)</th>
                <th scope="col" className="leverage-table-num">SL (on-chain)</th>
              </>
            ) : (
              <th scope="col" className="leverage-table-num">Liquidation (on-chain)</th>
            )}
            <th scope="col" className="leverage-table-num">PnL</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {cfdPositions.map((p) => {
            const marginDec = getTokenDecimals?.(p.settlementToken) ?? 18;
            const leverageX = (Number(p.leverageRatio ?? p.leverageBps) / BPS_DENOMINATOR).toFixed(1);
            const entryHuman = p.entryPriceHuman != null ? Number(p.entryPriceHuman) : parseFloat(ethers.utils.formatUnits(p.entryPrice || '0', 18));
            const marginNum = parseFloat(ethers.utils.formatUnits(p.marginAmount || '0', marginDec));
            const currentPrice = cfdPricesByAsset[p.asset] != null ? cfdPricesByAsset[p.asset] : null;
            const pnlPct = entryHuman > 0 && currentPrice != null
              ? (p.isLong ? (currentPrice - entryHuman) / entryHuman : (entryHuman - currentPrice) / entryHuman)
              : null;
            const pnlAmount = computeCfdPositionPnlAmount(p, currentPrice, { getTokenDecimals, BPS_DENOMINATOR });
            const pnlPctOnMargin = pnlAmount != null && marginNum > 0 ? (pnlAmount / marginNum) * 100 : null;
            const pnlClass = pnlAmount != null ? (pnlAmount >= 0 ? 'leverage-pnl-profit' : 'leverage-pnl-loss') : '';
            const idShort = typeof p.positionId === 'string' && p.positionId.length > 12 ? p.positionId.slice(-8) : p.positionId;
            const liqHuman =
              p.liquidationPriceHuman != null && Number.isFinite(Number(p.liquidationPriceHuman))
                ? Number(p.liquidationPriceHuman)
                : parseFloat(ethers.utils.formatUnits(p.liquidationPrice || '0', 18));
            return (
              <tr key={p.positionId}>
                <td title={p.positionId}>{idShort}</td>
                <td>{p.assetLabel ?? p.asset}</td>
                <td className="leverage-table-num">{ethers.utils.formatUnits(p.marginAmount || '0', marginDec)}</td>
                <td className="leverage-table-num">{leverageX}x</td>
                <td>{p.isLong ? 'Long' : 'Short'}</td>
                <td className="leverage-table-num">{formatNum(entryHuman)}</td>
                {isDemoMode ? (
                  <>
                    <td className="leverage-table-num leverage-tp">{formatNum(p.takeProfitHuman)}</td>
                    <td className="leverage-table-num leverage-sl">{formatNum(p.stopLossHuman)}</td>
                  </>
                ) : CFD_TP_SL_ONCHAIN_SUPPORTED ? (
                  <>
                    <td
                      className="leverage-table-num"
                      title="Liquidation threshold when available from position data / preview"
                    >
                      {liqHuman > 0 ? formatNum(liqHuman) : '—'}
                    </td>
                    <td
                      className="leverage-table-num leverage-tp"
                      title="takeProfitPrice from getCFDPosition (1e18), if set"
                    >
                      {formatNum(p.takeProfitHuman)}
                    </td>
                    <td
                      className="leverage-table-num leverage-sl"
                      title="stopLossPrice from getCFDPosition (1e18), if set"
                    >
                      {formatNum(p.stopLossHuman)}
                    </td>
                  </>
                ) : (
                  <td className="leverage-table-num" title="Liquidation from contract when available">
                    {liqHuman > 0 ? formatNum(liqHuman) : '—'}
                  </td>
                )}
                <td className={`leverage-table-num leverage-pnl-cell ${pnlClass}`} title={currentPrice == null ? 'No price feed. PnL on close will be calculated when price is available.' : (pnlAmount >= 0 ? `Profit on close: +${formatNum(pnlAmount)} USDT` : `Loss on close: ${formatNum(pnlAmount)} USDT`)}>
                  {pnlAmount != null ? (
                    <span className="leverage-pnl-inner">
                      <span className="leverage-pnl-sum">{pnlAmount >= 0 ? '+' : ''}{formatNum(pnlAmount)} USDT</span>
                      <span className="leverage-pnl-pct">({pnlAmount >= 0 ? '+' : ''}{formatNum(pnlPctOnMargin != null ? pnlPctOnMargin : (pnlPct ?? 0) * 100)}%)</span>
                    </span>
                  ) : (
                    <span className="leverage-pnl-no-feed">— <span className="leverage-pnl-no-feed-hint">(no feed)</span></span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => onCloseCFD(p.positionId)}
                    disabled={txPending || liveTradingBlocked}
                    className="leverage-btn leverage-btn-outline leverage-btn-sm"
                    title={liveTradingBlocked ? (chainGatePending ? 'Checking network…' : 'Switch to BSC to close') : undefined}
                  >
                    {liveTradingBlocked ? (chainGatePending ? '…' : 'BSC only') : 'Close'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

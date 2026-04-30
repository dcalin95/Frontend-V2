import React from 'react';
import { CFD_TP_SL_ONCHAIN_SUPPORTED } from '../../utils/leverageUtils';

/**
 * Product honesty: this page is BSC LeverageTrading + optional demo simulation — not OTA/Binance futures executor.
 */
export default function LeverageProductNotice({ isDemoMode }) {
  return (
    <details className="leverage-product-notice-details">
      <summary className="leverage-product-notice-summary">Informații produs (scope pagină)</summary>
      <aside className="leverage-product-notice" role="region" aria-label="Product scope">
      <ul className="leverage-product-notice__list">
        <li>
          <strong>Real (live):</strong> positions and vault balances come from the <strong>BSC</strong> LeverageTrading
          contract and UserVault — read via RPC in your browser. There is <strong>no Bits backend executor</strong>{' '}
          opening or closing trades for you.
        </li>
        <li>
          <strong>Demo:</strong> charts and CFD open/close use the <strong>same live market price feeds</strong> as Real
          (public/OTA price APIs — not a separate “fake” ticker). Margin and P&amp;L are simulated: balances and
          positions are stored in the <strong>demo API</strong> when you are signed in, or in <strong>local storage</strong>{' '}
          if the session cannot reach the API — <strong>not</strong> on-chain.
        </li>
        <li>
          <strong>Not included here:</strong> OTA AI trading, Binance futures, or short/long ops — those live under{' '}
          <strong>/dex-edu/ota</strong> flows, not this page.
        </li>
        <li>
          <strong>Automation:</strong> the app does <strong>not</strong> monitor your live positions server-side.
          Refresh uses moderate polling and wallet/RPC reads; you close positions yourself on-chain.
        </li>
        <li>
          <strong>Data freshness (live):</strong> lists update after transactions, when the tab regains focus, on
          visibility change, and on a timed interval — <strong>not</strong> streaming. Use <strong>Last synced</strong>{' '}
          as a guide; chain state can still change between refreshes.
        </li>
        {!isDemoMode && (
          <li>
            {CFD_TP_SL_ONCHAIN_SUPPORTED ? (
              <>
                <strong>CFD TP/SL (LeverageTradingV2):</strong> the contract stores optional{' '}
                <strong>take-profit / stop-loss prices</strong> on each position and exposes{' '}
                <code>triggerCFDCloseIfTPSL</code> (permissionless). Bits does <strong>not</strong> submit that transaction
                for you — a user, keeper, or script must broadcast it when conditions are met. The <strong>open form on
                this page</strong> calls <code>openCFDPosition</code> <strong>without</strong> TP/SL fields; use{' '}
                <code>openCFDPositionWithTPSL</code> / <code>setCFDTakeProfitStopLoss</code> from the contract if you
                need on-chain TP/SL. The positions table shows on-chain TP/SL and liquidation columns when data is
                available.
              </>
            ) : (
              <>
                <strong>CFD take-profit / stop-loss:</strong> this deployment does <strong>not</strong> expose on-chain
                TP/SL in the ABI the UI uses. Live rows show <strong>liquidation</strong> when available — close
                manually.
              </>
            )}
          </li>
        )}
        {isDemoMode && (
          <li>
            <strong>CFD TP/SL (demo):</strong> the UI may show TP/SL lines using the same <strong>live</strong> price feed
            for display; automatic TP/SL execution is <strong>not</strong> simulated in demo — close positions yourself, as
            in live mode if you are not using on-chain TP/SL triggers.
          </li>
        )}
      </ul>
    </aside>
    </details>
  );
}

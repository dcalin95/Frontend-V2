/**
 * Wallet & account: identity strip → hero financial cards → operations / diagnostics.
 */

import React, { useMemo } from 'react';
import { Info, Wallet } from 'lucide-react';
import { buildDashboardWalletSnapshot } from '../../utils/buildDashboardWalletSnapshot';
import { buildDashboardHeroFinancialCards } from '../../utils/buildDashboardHeroFinancialCards';

function shortAddr(addr) {
  if (!addr || typeof addr !== 'string') return '—';
  const s = addr.trim();
  if (s.length <= 14) return s;
  return `${s.slice(0, 8)}…${s.slice(-6)}`;
}

function shortApiId(id) {
  if (!id || typeof id !== 'string') return '—';
  const s = id.trim();
  if (s.length <= 20) return s;
  return `${s.slice(0, 10)}…${s.slice(-8)}`;
}

function badgeVariant(b) {
  if (!b) return 'default';
  if (b.includes('partial')) return 'partial';
  if (b.includes('est')) return 'est';
  if (b.includes('summary')) return 'summary';
  return 'default';
}

function FinCard({ kind, state, badge, title, children, footer, footerProvenance, titleAttr, valueAccent }) {
  const bv = badgeVariant(badge);
  const showFooterRow = Boolean(footer || footerProvenance);
  const iconOnly = !footer && footerProvenance;
  const accent = valueAccent && String(valueAccent).trim() !== '' ? String(valueAccent) : 'neutral';
  return (
    <article
      className={`dash-fin-card dash-fin-card--${kind} dash-fin-card--state-${state}`}
      title={titleAttr || undefined}
      data-state={state}
      data-value-accent={accent}
    >
      <div className="dash-fin-card__top">
        <span className="dash-fin-card__title">{title}</span>
        {badge ? (
          <span className="dash-fin-card__badge" data-variant={bv}>
            {badge}
          </span>
        ) : null}
      </div>
      <div className="dash-fin-card__body">{children}</div>
      {showFooterRow ? (
        <div
          className={`dash-fin-card__footer-row${iconOnly ? ' dash-fin-card__footer-row--icon-only' : ''}`}
        >
          {footer ? <p className="dash-fin-card__footer">{footer}</p> : null}
          {footerProvenance ? (
            <button
              type="button"
              className="dash-fin-card__provenance-btn"
              title={footerProvenance}
              aria-label="Data source details"
            >
              <Info size={13} strokeWidth={2} aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function DashboardWalletSnapshot({
  loading,
  isRefreshing = false,
  dashboardUserId,
  walletAddress,
  isWalletConnected,
  network,
  chainId,
  walletType,
  nativeBalanceFormatted,
  nativeSymbol,
  bundle,
  vaultAccountAligned,
}) {
  const cards = useMemo(
    () =>
      buildDashboardHeroFinancialCards({
        bundle,
        loading,
        isWalletConnected,
        network,
        chainId,
        walletType,
        nativeBalanceFormatted,
        nativeSymbol,
        walletAddress,
        dashboardUserId,
        vaultAccountAligned,
      }),
    [
      bundle,
      loading,
      isWalletConnected,
      network,
      chainId,
      walletType,
      nativeBalanceFormatted,
      nativeSymbol,
      walletAddress,
      dashboardUserId,
      vaultAccountAligned,
    ]
  );

  const { rows } = useMemo(
    () =>
      buildDashboardWalletSnapshot({
        loading,
        dashboardUserId,
        walletAddress,
        isWalletConnected,
        network,
        chainId,
        walletType,
        nativeBalanceFormatted,
        nativeSymbol,
        bundle,
        omitVaultPnlHeroDuplicates: true,
        omitIdentityRows: true,
        diagnosticsMode: 'compact',
      }),
    [
      loading,
      dashboardUserId,
      walletAddress,
      isWalletConnected,
      network,
      chainId,
      walletType,
      nativeBalanceFormatted,
      nativeSymbol,
      bundle,
    ]
  );

  const chainLine = [network, walletType === 'EVM' && chainId != null ? `chain ${chainId}` : null, walletType === 'SOLANA' ? 'Solana' : null]
    .filter(Boolean)
    .join(' · ');

  const apiShort = dashboardUserId != null && dashboardUserId !== '' ? shortApiId(String(dashboardUserId)) : '—';

  const aggregateApiKey = bundle?.aggregateMeta?.apiUserId;
  const showAggregateKeyHint =
    aggregateApiKey &&
    dashboardUserId != null &&
    String(dashboardUserId).trim() !== '' &&
    String(aggregateApiKey).toLowerCase() !== String(dashboardUserId).toLowerCase();

  const aggregateKeyShort = showAggregateKeyHint ? shortAddr(String(aggregateApiKey)) : null;

  return (
    <section
      className={`dash-region dash-region--wallet dash-region--wallet-v2 dash-region--summary-primary${
        isRefreshing ? ' dash-region--wallet--refreshing' : ''
      }`}
      aria-label="Wallet and account snapshot"
    >
      <div className="dash-wallet__identity">
        <div className="dash-wallet__identity-top">
          <Wallet className="dash-wallet__identity-ico" size={15} strokeWidth={1.75} aria-hidden />
          <div className="dash-wallet__identity-cluster">
            <h2 className="dash-wallet__identity-title">Wallet &amp; account</h2>
            <p className="dash-wallet__identity-line">
              <span className="dash-wallet__identity-mono">{walletAddress ? shortAddr(walletAddress) : '—'}</span>
              <span className="dash-wallet__identity-sep" aria-hidden>
                ·
              </span>
              <span>{chainLine || '—'}</span>
            </p>
          </div>
        </div>
        <p
          className="dash-wallet__identity-meta dash-wallet__identity-meta--compact"
          title="API scope for this page"
        >
          <span className="dash-wallet__identity-mono">{apiShort}</span>
          {aggregateKeyShort ? (
            <>
              <span className="dash-wallet__identity-sep" aria-hidden>
                {' '}
                ·{' '}
              </span>
              <span className="dash-wallet__identity-mono" title="Aggregate key">
                {aggregateKeyShort}
              </span>
            </>
          ) : null}
        </p>
      </div>

      <div className="dash-wallet__money-now">
        <h3 className="dash-wallet__money-now-title">
          My money now
          <span className="dash-wallet__money-now-k">Wallet, vault, P&amp;L, exposure</span>
        </h3>
      </div>

      {cards.loading ? (
        <div className="dash-wallet__fin-row dash-wallet__fin-row--loading" aria-busy="true">
          <div className="dash-fin-card dash-fin-card--skeleton" />
          <div className="dash-fin-card dash-fin-card--skeleton" />
          <div className="dash-fin-card dash-fin-card--skeleton" />
          <div className="dash-fin-card dash-fin-card--skeleton" />
        </div>
      ) : (
        <div
          className="dash-wallet__fin-row dash-wallet__fin-row--stable"
          role="region"
          aria-label="My money now — balances and P and L"
        >
          <FinCard
            kind="native"
            state={cards.native.state}
            badge={cards.native.badge}
            title={cards.native.title}
            footer={cards.native.footer}
            footerProvenance={cards.native.footerProvenance}
            valueAccent={cards.native.valueAccent}
          >
            <p className="dash-fin-card__value">{cards.native.value}</p>
            <p className="dash-fin-card__sub">{cards.native.sub}</p>
            {cards.native.sub2 ? <p className="dash-fin-card__sub2">{cards.native.sub2}</p> : null}
          </FinCard>

          <FinCard
            kind="vault"
            state={cards.userVault.state}
            badge={cards.userVault.badge}
            title={cards.userVault.title}
            footer={cards.userVault.footer}
            footerProvenance={cards.userVault.footerProvenance}
            titleAttr={bundle?.vaultBalanceComparison?.note || undefined}
            valueAccent={cards.userVault.valueAccent}
          >
            <p className="dash-fin-card__value">{cards.userVault.value}</p>
            <p className="dash-fin-card__sub">{cards.userVault.sub}</p>
            {cards.userVault.sub2 ? <p className="dash-fin-card__sub2">{cards.userVault.sub2}</p> : null}
            {cards.userVault.preview?.length > 0 ? (
              <ul className="dash-fin-card__preview">
                {cards.userVault.preview.map((p) => (
                  <li key={p.sym}>
                    <span>{p.sym}</span> <span className="dash-fin-card__preview-amt">{p.amt}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </FinCard>

          <FinCard
            kind="pnl"
            state={cards.profitLoss.state}
            badge={cards.profitLoss.badge}
            title={cards.profitLoss.title}
            footer={cards.profitLoss.footer}
            footerProvenance={cards.profitLoss.footerProvenance}
            valueAccent={cards.profitLoss.valueAccent}
          >
            <p className="dash-fin-card__value dash-fin-card__value--pnl-hero">{cards.profitLoss.value}</p>
            <p className="dash-fin-card__primary-label dash-fin-card__primary-label--pnl-caption">
              {cards.profitLoss.primaryLabel}
            </p>
            <div className="dash-fin-card__metrics">
              {cards.profitLoss.metrics.map((m) => (
                <div key={m.k} className="dash-fin-card__metric">
                  <span className="dash-fin-card__metric-k">{m.k}</span>
                  <span className="dash-fin-card__metric-v">{m.v}</span>
                </div>
              ))}
            </div>
            {cards.profitLoss.stateNote ? (
              <p className="dash-fin-card__state-note">{cards.profitLoss.stateNote}</p>
            ) : null}
          </FinCard>

          <FinCard
            kind="exposure"
            state={cards.exposure.state}
            title={cards.exposure.title}
            footer={cards.exposure.footer}
            footerProvenance={cards.exposure.footerProvenance}
            valueAccent={cards.exposure.valueAccent}
          >
            <p className="dash-fin-card__value">{cards.exposure.value}</p>
            <p className="dash-fin-card__sub">{cards.exposure.sub}</p>
          </FinCard>
        </div>
      )}

      <details className="dash-wallet__ops-details">
        <summary className="dash-wallet__ops-summary">Operations &amp; diagnostics</summary>
        <div className="dash-wallet__grid dash-wallet__grid--ops" role="list">
          {rows.map((row) => (
            <div key={row.id} className="dash-wallet__cell" role="listitem">
              <span className="dash-wallet__label">{row.label}</span>
              <span className="dash-wallet__value">{row.value}</span>
              <span className="dash-wallet__hint">{row.hint}</span>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

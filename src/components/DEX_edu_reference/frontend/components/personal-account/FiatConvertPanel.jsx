/**
 * FiatConvertPanel – conversie sold fiat (Stripe EUR/USD) → BNB sau USDT (BEP20) pe BSC.
 * Quote/order mapate prin normalizeConvertQuote / normalizeConvertOrderResponse (contract backend).
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  ArrowRightCircle,
  Building2,
  CheckCircle2,
  Cpu,
  Info,
  LineChart,
  Loader2,
  Network,
  Sparkles,
  Wallet,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { FIAT_CONVERT_UI_COPY } from '../../constants/fiatConvertExecutionModel';
import {
  getConvertQuote,
  createConvertOrder,
  getConvertOrders,
  normalizeConvertQuote,
  normalizeConvertOrderResponse,
} from '../../services/fiatConvertService';
import {
  getFiatConvertPendingDetailMessage,
  sortFiatConvertOrdersNewestFirst,
} from '../../utils/fiatConvertOrderUi';
import { BITS_FIAT_BALANCE_REFRESH } from '../../utils/fiatBalanceEvents';
import '../../styles/components/fiat-convert-panel.css';

function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `fiat-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function FiatConvertPanel({
  stripeBalanceEur = 0,
  stripeBalanceUsd = 0,
  walletAddress,
  isConnected,
  connectWallet,
  onSuccess,
}) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('eur');
  const [tokenOut, setTokenOut] = useState('bnb');
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertError, setConvertError] = useState(null);
  const [orders, setOrders] = useState([]);
  const convertIdempotencyKeyRef = useRef(null);

  const available = currency === 'eur' ? stripeBalanceEur : stripeBalanceUsd;
  const symbol = currency === 'eur' ? '€' : '$';
  const minAmount = 10;

  const loadOrders = async () => {
    try {
      const { orders: list } = await getConvertOrders();
      setOrders(list || []);
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const onRefresh = () => {
      loadOrders();
    };
    window.addEventListener(BITS_FIAT_BALANCE_REFRESH, onRefresh);
    return () => window.removeEventListener(BITS_FIAT_BALANCE_REFRESH, onRefresh);
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      loadOrders();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt < minAmount) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    setQuoteLoading(true);
    setQuote(null);
    getConvertQuote({ amountFiat: amt, currency, tokenOut })
      .then((data) => {
        if (!cancelled) setQuote(normalizeConvertQuote(data));
      })
      .catch(() => {
        if (!cancelled) setQuote(null);
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });
    return () => { cancelled = true; };
  }, [amount, currency, tokenOut]);

  const handleConvert = async () => {
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt < minAmount) {
      setConvertError(`Minimum ${symbol}${minAmount}`);
      return;
    }
    if (quote && quote.executionAvailable === false) {
      setConvertError(quote.executionUnavailableReason || 'This output token is not available yet.');
      return;
    }
    if (amt > available) {
      setConvertError('Insufficient balance');
      return;
    }
    if (!isConnected || !walletAddress) {
      setConvertError('Connect your wallet first');
      return;
    }
    if (!convertIdempotencyKeyRef.current) {
      convertIdempotencyKeyRef.current = newIdempotencyKey();
    }
    setConvertError(null);
    setConvertLoading(true);
    try {
      const raw = await createConvertOrder({
        amountFiat: amt,
        currency,
        tokenOut,
        walletAddress,
        idempotencyKey: convertIdempotencyKeyRef.current,
      });
      const order = normalizeConvertOrderResponse(raw);
      if (order.idempotentReplay) {
        toast.info(order.message || 'This conversion was already submitted.');
        loadOrders();
        onSuccess?.();
        return;
      }
      toast.info(
        tokenOut === 'usdt' ? FIAT_CONVERT_UI_COPY.submitSuccessToastUsdt : FIAT_CONVERT_UI_COPY.submitSuccessToast,
      );
      convertIdempotencyKeyRef.current = null;
      setAmount('');
      setQuote(null);
      loadOrders();
      onSuccess?.();
    } catch (e) {
      setConvertError(e?.message || 'Conversion failed');
    } finally {
      setConvertLoading(false);
    }
  };

  const sortedOrders = useMemo(() => sortFiatConvertOrdersNewestFirst(orders), [orders]);
  const completedBnbOrders = sortedOrders.filter(
    (o) => String(o.status).toLowerCase() === 'completed' && String(o.token_out).toLowerCase() === 'bnb',
  );
  const completedUsdtOrders = sortedOrders.filter(
    (o) => String(o.status).toLowerCase() === 'completed' && String(o.token_out).toLowerCase() === 'usdt',
  );
  const hasCompletedBnb = completedBnbOrders.length > 0;
  const hasCompletedUsdt = completedUsdtOrders.length > 0;
  const pendingOrders = sortedOrders.filter((o) => String(o.status).toLowerCase() === 'pending');
  const failedOrders = sortedOrders.filter((o) => String(o.status).toLowerCase() === 'failed');

  const curSym = quote?.inputCurrency === 'usd' ? '$' : '€';

  const panelHeader = (
    <header className="fiat-convert-panel__header fiat-convert-panel__header--compact">
      <div className="fiat-convert-panel__title-row">
        <h2 className="personal-account-section-title fiat-convert-panel__title">
          <span className="fiat-convert-panel__title-ico" aria-hidden>
            <ArrowLeftRight size={20} strokeWidth={1.75} />
          </span>
          Convert → BNB / USDT
        </h2>
        <span className="fiat-convert-panel__title-chip" title="Delivery on BNB Smart Chain">
          <Network size={12} strokeWidth={1.75} aria-hidden />
          BSC
        </span>
        <span className="fiat-convert-panel__title-sparkle" aria-hidden>
          <Sparkles size={14} strokeWidth={1.75} />
        </span>
      </div>
      <p className="fiat-convert-panel__subtitle fiat-convert-panel__subtitle--compact">
        Debits the <strong>ledger above</strong>. Payout to your <strong>connected wallet</strong> on BSC — not into <strong>UserVault</strong>.
      </p>
    </header>
  );

  const panelCallout = (
    <div className="fiat-convert-panel__callout fiat-convert-panel__callout--compact fiat-convert-panel__callout--scan" role="note">
      <div className="fiat-convert-panel__callout-scan">
        <div className="fiat-convert-panel__callout-line">
          <Wallet size={14} strokeWidth={1.75} className="fiat-convert-panel__callout-line-ico" aria-hidden />
          <span>
            Sent to your <strong>BSC wallet</strong> (relayer). <strong>Not</strong> auto-deposited to UserVault.
          </span>
        </div>
        <div className="fiat-convert-panel__callout-line">
          <Building2 size={14} strokeWidth={1.75} className="fiat-convert-panel__callout-line-ico" aria-hidden />
          <span>
            Need vault margin? Use <strong>Deposit from wallet</strong>.
          </span>
        </div>
      </div>
    </div>
  );

  const estimateAside = (
    <aside className="fiat-convert-panel__estimate-aside" aria-label="Quote estimate">
      {quoteLoading && (
        <div className="fiat-convert-panel__estimate-placeholder fiat-convert-panel__estimate-placeholder--loading">
          <Loader2 size={18} className="fiat-convert-panel__spin" strokeWidth={1.75} aria-hidden />
          <span>Calculating quote…</span>
        </div>
      )}
      {!quoteLoading && quote && (
        <div className="fiat-convert-panel-quote fiat-convert-panel-quote--aside" role="status">
          <div className="fiat-convert-panel-quote__head">
            <LineChart size={15} strokeWidth={1.75} className="fiat-convert-panel-quote__head-ico" aria-hidden />
            <span className="fiat-convert-panel-quote__head-label">Estimate</span>
            <Sparkles size={12} strokeWidth={1.75} className="fiat-convert-panel-quote__head-sparkle" aria-hidden />
          </div>
          <div className="fiat-convert-panel-quote__primary">
            {quote.inputAmount != null ? `${curSym}${Number(quote.inputAmount).toFixed(2)} ${String(quote.inputCurrency || '').toUpperCase()}` : '—'}
            <span className="fiat-convert-panel-quote__arrow" aria-hidden> → </span>
            ~{quote.estimatedOutputFormatted} {String(quote.targetToken || '').toUpperCase()}
          </div>
          {quote.rateBnbUsd != null && quote.targetToken === 'bnb' && (
            <p className="fiat-convert-panel-quote__line personal-account-page-muted">
              Rate: BNB ≈ ${Number(quote.rateBnbUsd).toFixed(2)} (indicative)
            </p>
          )}
          {quote.targetToken === 'usdt' && quote.executionAvailable && (
            <p className="fiat-convert-panel-quote__line personal-account-page-muted">
              ~1 USDT ≈ 1 USD after spread · BEP20 on BSC
            </p>
          )}
          {quote.spreadMultiplier != null && (
            <p className="fiat-convert-panel-quote__line personal-account-page-muted">
              Spread: ×{Number(quote.spreadMultiplier).toFixed(4)}
              {quote.spreadFeeApproxUsd != null && Number(quote.spreadFeeApproxUsd) > 0
                ? ` (~$${Number(quote.spreadFeeApproxUsd).toFixed(2)} vs. gross USD equivalent)`
                : ''}
            </p>
          )}
          {quote.amountUsdNet != null && (
            <p className="fiat-convert-panel-quote__line personal-account-page-muted">
              USD (net of spread): ~${Number(quote.amountUsdNet).toFixed(2)}
            </p>
          )}
          {quote.executionAvailable === false && (
            <p className="fiat-convert-panel-quote__warn personal-account-page-muted">
              {quote.executionUnavailableReason || 'This pair is not available for conversion yet.'}
            </p>
          )}
          {quote.bnbExecution?.notUserVault && quote.targetToken === 'bnb' && (
            <p className="fiat-convert-panel-quote__delivery personal-account-page-muted">
              <strong>{FIAT_CONVERT_UI_COPY.walletArrivalLine}</strong>{' '}
              {FIAT_CONVERT_UI_COPY.notInVaultYetLine}{' '}
              <Link to={FIAT_CONVERT_UI_COPY.depositCtaPath} className="personal-account-page-link fiat-convert-panel__inline-link">
                {FIAT_CONVERT_UI_COPY.depositCtaLabel}
              </Link>
              {' '}(separate on-chain step).
            </p>
          )}
          {quote.usdtExecution?.notUserVault && quote.targetToken === 'usdt' && quote.executionAvailable && (
            <p className="fiat-convert-panel-quote__delivery personal-account-page-muted">
              <strong>{FIAT_CONVERT_UI_COPY.walletUsdtArrivalLine}</strong> {FIAT_CONVERT_UI_COPY.notInVaultYetLine}
            </p>
          )}
        </div>
      )}
      {!quoteLoading && !quote && (
        <div className="fiat-convert-panel__estimate-placeholder">
          <Cpu size={18} strokeWidth={1.75} className="fiat-convert-panel__estimate-placeholder-ico" aria-hidden />
          <p className="fiat-convert-panel__estimate-placeholder-text">
            Enter amount (min. {symbol}{minAmount}) to preview the estimate here.
          </p>
        </div>
      )}
    </aside>
  );

  return (
    <section
      className="fiat-convert-panel personal-account-section fiat-convert-panel--layout"
      aria-label="Convert fiat balance to BNB or USDT"
    >
      {!isConnected ? (
        <>
          {panelHeader}
          {panelCallout}
          <div className="fiat-convert-panel-connect">
            <p className="personal-account-page-muted">Connect wallet to convert.</p>
            <button type="button" onClick={connectWallet} className="personal-account-page-btn personal-account-page-btn-primary">
              Connect wallet
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="fiat-convert-panel__workspace">
            <div className="fiat-convert-panel__main">
              {panelHeader}
              {panelCallout}
              <div className="fiat-convert-panel__balance-strip" aria-label="Prefill conversion amount from ledger">
                <div className="fiat-convert-panel__balance-label-wrap">
                  <span className="fiat-convert-panel__balance-label">
                    <Wallet size={14} strokeWidth={1.75} className="fiat-convert-panel__balance-label-ico" aria-hidden />
                    Prefill amount
                  </span>
                  <span className="fiat-convert-panel__balance-hint">Tap EUR or USD to set currency and amount</span>
                </div>
                <div className="fiat-convert-panel-balance">
                  <button
                    type="button"
                    aria-pressed={currency === 'eur'}
                    onClick={() => { setCurrency('eur'); setAmount(stripeBalanceEur > 0 ? String(stripeBalanceEur) : ''); }}
                    className={`fiat-convert-panel-balance-btn${currency === 'eur' ? ' fiat-convert-panel-balance-btn--active' : ''}`}
                  >
                    €{Number(stripeBalanceEur).toFixed(2)}
                  </button>
                  <button
                    type="button"
                    aria-pressed={currency === 'usd'}
                    onClick={() => { setCurrency('usd'); setAmount(stripeBalanceUsd > 0 ? String(stripeBalanceUsd) : ''); }}
                    className={`fiat-convert-panel-balance-btn${currency === 'usd' ? ' fiat-convert-panel-balance-btn--active' : ''}`}
                  >
                    ${Number(stripeBalanceUsd).toFixed(2)}
                  </button>
                </div>
              </div>

              <div className="fiat-convert-panel-form">
                <div className="fiat-convert-panel-form__cluster">
                  <div className="fiat-convert-panel__fields">
                    <div className="fiat-convert-panel__field">
                      <label className="fiat-convert-panel__label" htmlFor="fiat-convert-amount">
                        <span className="fiat-convert-panel__label-ico" aria-hidden><Cpu size={13} strokeWidth={1.75} /></span>
                        Amount
                      </label>
                      <div className="fiat-convert-panel__amount-row">
                        <input
                          id="fiat-convert-amount"
                          type="number"
                          min={minAmount}
                          step="1"
                          placeholder={`Min ${symbol}${minAmount}`}
                          value={amount}
                          onChange={(e) => {
                            setAmount(e.target.value);
                            setConvertError(null);
                            convertIdempotencyKeyRef.current = null;
                          }}
                          className="fiat-convert-panel-input"
                        />
                        <select
                          id="fiat-convert-currency"
                          value={currency}
                          onChange={(e) => {
                            setCurrency(e.target.value);
                            setConvertError(null);
                            convertIdempotencyKeyRef.current = null;
                          }}
                          className="fiat-convert-panel-select fiat-convert-panel-select--currency"
                          aria-label="Card currency for this conversion"
                        >
                          <option value="eur">EUR</option>
                          <option value="usd">USD</option>
                        </select>
                      </div>
                      <p className="fiat-convert-panel__helper">
                        Minimum {symbol}{minAmount} · debits the selected card balance only
                      </p>
                    </div>
                    <div className="fiat-convert-panel__field">
                      <label className="fiat-convert-panel__label" htmlFor="fiat-convert-receive">
                        <span className="fiat-convert-panel__label-ico" aria-hidden><ArrowRightCircle size={13} strokeWidth={1.75} /></span>
                        Receive as
                      </label>
                      <select
                        id="fiat-convert-receive"
                        value={tokenOut}
                        onChange={(e) => {
                          setTokenOut(e.target.value);
                          convertIdempotencyKeyRef.current = null;
                        }}
                        className="fiat-convert-panel-select fiat-convert-panel-select--full"
                      >
                        <option value="bnb">BNB (native)</option>
                        <option value="usdt">USDT (BEP20 on BSC)</option>
                      </select>
                    </div>
                  </div>

                  {convertError && <p className="fiat-convert-panel-error" role="alert">{convertError}</p>}
                  <div className="fiat-convert-panel-form__actions">
                    <button
                      type="button"
                      onClick={handleConvert}
                      disabled={
                        convertLoading
                        || !amount
                        || parseFloat(amount) < minAmount
                        || parseFloat(amount) > available
                        || (quote && quote.executionAvailable === false)
                      }
                      className="personal-account-page-btn personal-account-page-btn-primary fiat-convert-panel-submit fiat-convert-panel-submit--cta"
                    >
                      {convertLoading ? (
                        <>
                          <Loader2 size={17} className="fiat-convert-panel__spin" strokeWidth={1.75} aria-hidden />
                          Submitting…
                        </>
                      ) : (
                        <>
                          <Sparkles size={17} strokeWidth={1.75} aria-hidden />
                          Convert
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {estimateAside}
          </div>

          {isConnected && hasCompletedUsdt && (
            <div
              className="fiat-convert-panel-success-callout fiat-convert-panel-next-steps"
              role="status"
              aria-label="USDT in wallet"
            >
              <p className="fiat-convert-panel-success-callout-strong">{FIAT_CONVERT_UI_COPY.walletUsdtArrivalLine}</p>
              <p className="fiat-convert-panel-success-callout-line">{FIAT_CONVERT_UI_COPY.notInVaultYetLine}</p>
            </div>
          )}

          {isConnected && hasCompletedBnb && (
            <div
              className="fiat-convert-panel-success-callout fiat-convert-panel-next-steps"
              role="status"
              aria-label="BNB in wallet — deposit to vault separately"
            >
              <p className="fiat-convert-panel-success-callout-strong">{FIAT_CONVERT_UI_COPY.walletArrivalLine}</p>
              <p className="fiat-convert-panel-success-callout-line">{FIAT_CONVERT_UI_COPY.notInVaultYetLine}</p>
              <p className="fiat-convert-panel-success-cta-wrap">
                <Link
                  to={FIAT_CONVERT_UI_COPY.depositCtaPath}
                  className="personal-account-page-btn personal-account-page-btn-primary fiat-convert-panel-deposit-cta"
                >
                  {FIAT_CONVERT_UI_COPY.depositCtaLabel}
                </Link>
              </p>
              <p className="fiat-convert-panel-next-steps-hint">{FIAT_CONVERT_UI_COPY.completedBnbReminder}</p>
            </div>
          )}

          {pendingOrders.length > 0 && (
            <div className="fiat-convert-panel-orders">
              <h3 className="fiat-convert-panel-orders-title">
                <Loader2 size={14} strokeWidth={1.75} className="fiat-convert-panel__orders-ico fiat-convert-panel__spin-slow" aria-hidden />
                Pending
              </h3>
              <ul className="fiat-convert-panel-orders-list">
                {pendingOrders.map((o) => {
                  const detail = getFiatConvertPendingDetailMessage(o);
                  return (
                    <li key={o.id} className="fiat-convert-panel-order-item">
                      <div>
                        <strong>Pending</strong>
                        {' — '}
                        {(o.currency === 'eur' ? '€' : '$')}
                        {o.amount_fiat} {o.currency?.toUpperCase()} → ~{o.amount_out != null ? Number(o.amount_out).toFixed(6) : '…'}{' '}
                        {o.token_out?.toUpperCase()}
                      </div>
                      <div className="personal-account-page-muted fiat-convert-panel-order-detail">{detail}</div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {failedOrders.length > 0 && (
            <div className="fiat-convert-panel-orders fiat-convert-panel-orders--failed">
              <h3 className="fiat-convert-panel-orders-title">
                <XCircle size={14} strokeWidth={1.75} className="fiat-convert-panel__orders-ico fiat-convert-panel__orders-ico--fail" aria-hidden />
                Failed
              </h3>
              <ul className="fiat-convert-panel-orders-list">
                {failedOrders.map((o) => (
                  <li key={o.id} className="fiat-convert-panel-order-item fiat-convert-panel-order-failed">
                    <div>
                      <strong>Failed</strong>
                      {' — '}
                      {(o.currency === 'eur' ? '€' : '$')}
                      {o.amount_fiat} {o.currency?.toUpperCase()} → {o.token_out?.toUpperCase()}
                    </div>
                    <div className="personal-account-page-muted fiat-convert-panel-order-detail">{FIAT_CONVERT_UI_COPY.failedOrder}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {completedUsdtOrders.length > 0 && (
            <div className="fiat-convert-panel-orders" role="status">
              <h3 className="fiat-convert-panel-orders-title">
                <CheckCircle2 size={14} strokeWidth={1.75} className="fiat-convert-panel__orders-ico fiat-convert-panel__orders-ico--ok" aria-hidden />
                Completed (USDT)
              </h3>
              <ul className="fiat-convert-panel-orders-list">
                {completedUsdtOrders.slice(0, 8).map((o) => (
                  <li key={o.id} className="fiat-convert-panel-order-item">
                    <div>
                      <strong>Completed</strong>
                      {' — '}
                      {(o.currency === 'eur' ? '€' : '$')}
                      {o.amount_fiat} {o.currency?.toUpperCase()} → {o.amount_out != null ? Number(o.amount_out).toFixed(4) : '…'} USDT
                    </div>
                    <div className="personal-account-page-muted fiat-convert-panel-order-detail">
                      {FIAT_CONVERT_UI_COPY.completedUsdtWalletLine}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {completedBnbOrders.length > 0 && (
            <div className="fiat-convert-panel-orders">
              <h3 className="fiat-convert-panel-orders-title">
                <CheckCircle2 size={14} strokeWidth={1.75} className="fiat-convert-panel__orders-ico fiat-convert-panel__orders-ico--ok" aria-hidden />
                Completed (BNB to wallet)
              </h3>
              <ul className="fiat-convert-panel-orders-list">
                {completedBnbOrders.slice(0, 8).map((o) => (
                  <li key={o.id} className="fiat-convert-panel-order-item fiat-convert-panel-order-completed">
                    <div>
                      <strong>Completed</strong>
                      {' — '}
                      {(o.currency === 'eur' ? '€' : '$')}
                      {o.amount_fiat} {o.currency?.toUpperCase()} → {o.amount_out != null ? Number(o.amount_out).toFixed(6) : '…'} BNB (wallet)
                    </div>
                    <div className="personal-account-page-muted fiat-convert-panel-order-detail">
                      {FIAT_CONVERT_UI_COPY.notInVaultYetLine}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="fiat-convert-panel__foot-note personal-account-page-muted">
            <Info size={13} strokeWidth={1.75} className="fiat-convert-panel__foot-ico" aria-hidden />
            <span>
              Quote matches the server formula. Payout: relayer → your wallet (not auto-credited to UserVault).
            </span>
          </p>
        </>
      )}
    </section>
  );
}

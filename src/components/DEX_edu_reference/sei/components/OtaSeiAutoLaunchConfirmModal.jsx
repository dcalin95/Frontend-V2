/**
 * Confirm & execute SEI Auto session — single DRY instance (split + stacked layout).
 * @module OtaSeiAutoLaunchConfirmModal
 */

import React from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { SEI_AUTO_DEFAULT_PAIR } from '../seiTokenConfig';

export default function OtaSeiAutoLaunchConfirmModal({
  onClose,
  settingsValidation,
  canLaunchSession,
  seiAutoSaving,
  onConfirm,
  seiAutoStatus,
  minProfitOverGasPercent,
  stopIfCannotEstimate,
  maxRounds,
}) {
  return (
    <div
      className="ota-sei-micro-profit__modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="launch-modal-title"
      aria-describedby="launch-modal-desc"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => e.key === 'Escape' && (e.preventDefault(), onClose())}
    >
      <div className="ota-sei-micro-profit__modal ota-sei-micro-profit__modal--launch" onClick={(e) => e.stopPropagation()}>
        <div className="ota-sei-micro-profit__modal-header">
          <div className="ota-sei-micro-profit__modal-header-text">
            <h3 id="launch-modal-title" className="ota-sei-micro-profit__modal-title">Confirm &amp; execute – OTA AI session</h3>
            <p id="launch-modal-desc" className="ota-sei-micro-profit__modal-subtitle">Review everything below. This is the confirmation before execution. When you press &quot;Execute session&quot;, the backend will enable the session and OTA AI will run automatic SEI round-trips with these settings.</p>
          </div>
          <button type="button" onClick={onClose} className="ota-sei-micro-profit__modal-close" aria-label="Close">
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="ota-sei-micro-profit__modal-body">
          <section className="ota-sei-micro-profit__modal-section">
            <h4 className="ota-sei-micro-profit__modal-section-title">All settings OK?</h4>
            <ul className="ota-sei-micro-profit__modal-checklist" aria-label="Validation checklist">
              <li className={settingsValidation.hasUser ? 'ota-sei-micro-profit__check--ok' : 'ota-sei-micro-profit__check--missing'}>
                {settingsValidation.hasUser ? <CheckCircle size={14} aria-hidden /> : <XCircle size={14} aria-hidden />}
                {settingsValidation.hasUser ? 'Account connected' : 'Account missing (sign in)'}
              </li>
              <li className={settingsValidation.hasWallet ? 'ota-sei-micro-profit__check--ok' : 'ota-sei-micro-profit__check--missing'}>
                {settingsValidation.hasWallet ? <CheckCircle size={14} aria-hidden /> : <XCircle size={14} aria-hidden />}
                {settingsValidation.hasWallet ? 'SEI wallet connected' : 'SEI wallet not connected'}
              </li>
              <li className={settingsValidation.hasValidMaxAmount ? 'ota-sei-micro-profit__check--ok' : 'ota-sei-micro-profit__check--missing'}>
                {settingsValidation.hasValidMaxAmount ? <CheckCircle size={14} aria-hidden /> : <XCircle size={14} aria-hidden />}
                {settingsValidation.hasValidMaxAmount ? 'Max SEI per trade set' : 'Max SEI per trade missing or invalid'}
              </li>
              <li className={settingsValidation.hasMinProfitPct ? 'ota-sei-micro-profit__check--ok' : 'ota-sei-micro-profit__check--missing'}>
                {settingsValidation.hasMinProfitPct ? <CheckCircle size={14} aria-hidden /> : <XCircle size={14} aria-hidden />}
                {settingsValidation.hasMinProfitPct ? 'Min profit % over gas set' : 'Min profit % missing'}
              </li>
              <li className={settingsValidation.maxRoundsValid ? 'ota-sei-micro-profit__check--ok' : 'ota-sei-micro-profit__check--missing'}>
                {settingsValidation.maxRoundsValid ? <CheckCircle size={14} aria-hidden /> : <XCircle size={14} aria-hidden />}
                {settingsValidation.maxRoundsValid ? 'Max rounds valid (or unlimited)' : 'Max rounds invalid'}
              </li>
            </ul>
            {canLaunchSession && <p className="ota-sei-micro-profit__modal-all-set" role="status">All set. You can execute the session.</p>}
          </section>
          <section className="ota-sei-micro-profit__modal-section">
            <h4 className="ota-sei-micro-profit__modal-section-title">What you set (what will be used)</h4>
            <dl className="ota-sei-micro-profit__modal-dl">
              <dt>Min profit % over gas</dt>
              <dd>{seiAutoStatus?.minProfitOverGasPercent ?? minProfitOverGasPercent ?? 100}%</dd>
              <dt>Max SEI per trade</dt>
              <dd>{seiAutoStatus?.maxAmountPerTrade ?? '10'}</dd>
              <dt>Preferred pair</dt>
              <dd>{seiAutoStatus?.preferredPair ?? SEI_AUTO_DEFAULT_PAIR}</dd>
              <dt>Stop when profit cannot be estimated</dt>
              <dd>{stopIfCannotEstimate ? 'Yes' : 'No'}</dd>
              <dt>Max rounds</dt>
              <dd>{maxRounds.trim() === '' ? 'Unlimited' : maxRounds}</dd>
            </dl>
          </section>
          <section className="ota-sei-micro-profit__modal-section">
            <h4 className="ota-sei-micro-profit__modal-section-title">What will run</h4>
            <p className="ota-sei-micro-profit__modal-text">
              OTA AI will run automatic SEI round-trips with the parameters above. Session runs until: round limit (if set), no profit possible (or waiting for market), or you stop it manually.
            </p>
            <p className="ota-sei-micro-profit__modal-text">
              <strong>Where it is saved:</strong> Settings and session state are saved on the <strong>server</strong> (linked to your account). OTA AI backend reads this to run the session.
            </p>
            <p className="ota-sei-micro-profit__modal-text">
              <strong>How OTA AI knows and executes:</strong> When you execute, the backend marks your session as enabled. The OTA AI worker will then run SEI round-trips according to these settings. You will see status <strong>Active</strong> and new runs in <strong>SEI execution history</strong> (use Refresh to update).
            </p>
          </section>
          <div className="ota-sei-micro-profit__modal-actions">
            <button type="button" onClick={onConfirm} disabled={seiAutoSaving || !canLaunchSession} className="ota-sei-micro-profit__btn-primary">
              {seiAutoSaving ? 'Launching…' : 'Execute session'}
            </button>
            <button type="button" onClick={onClose} className="ota-sei-micro-profit__btn-outline">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

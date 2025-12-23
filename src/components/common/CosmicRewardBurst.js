import React, { useEffect, useMemo, useState } from "react";
import TokenInline from "./TokenInline";
import "./CosmicRewardBurst.css";

export default function CosmicRewardBurst({
  open,
  onClose,
  amount,
  token = "BITS",
  secondaryAmount = null,
  secondaryToken = "USDT",
  title = "Reward detected",
  subtitle = "You have rewards available to claim.",
  autoCloseMs = 5200,
  showUsdtHint = true,
}) {
  const [closing, setClosing] = useState(false);

  const primary = useMemo(() => {
    const a = amount ?? "";
    return { a, token: String(token || "").toUpperCase() };
  }, [amount, token]);

  const secondary = useMemo(() => {
    if (secondaryAmount == null || secondaryAmount === "") return null;
    const t = String(secondaryToken || "").toUpperCase();
    return { a: secondaryAmount, token: t };
  }, [secondaryAmount, secondaryToken]);

  const beginClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 460);
  };

  useEffect(() => {
    if (!open) return;
    setClosing(false);
    const t = setTimeout(() => {
      beginClose();
    }, Math.max(1400, Number(autoCloseMs) || 5200));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoCloseMs]);

  if (!open) return null;

  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className={`cosmic-burst-overlay ${closing ? "closing" : ""}`} onClick={() => beginClose()}>
      <div className="cosmic-burst-sky" />
      <div className={`cosmic-burst-card ${closing ? "closing" : ""}`} onClick={stop} role="dialog" aria-modal="true">
        <div className="cosmic-burst-top">
          <div className="cosmic-burst-title">{title}</div>
          <button className="cosmic-burst-close" type="button" onClick={() => beginClose()}>
            Close
          </button>
        </div>

        <div className="cosmic-burst-body">
          <div className="cosmic-burst-amounts">
            <div className="cosmic-burst-row">
              <div className="cosmic-burst-number">{String(primary.a)}</div>
              <TokenInline token={primary.token} dollar={primary.token === "BITS"} size={18} />
            </div>
            {secondary ? (
              <div className="cosmic-burst-row secondary">
                <div className="cosmic-burst-number-sm">≈ {String(secondary.a)}</div>
                <TokenInline token={secondary.token} dollar={secondary.token === "BITS"} size={16} />
              </div>
            ) : null}
          </div>
          <div className="cosmic-burst-sub">{subtitle}</div>

          {showUsdtHint ? (
            <div className="cosmic-burst-hint">
              Tip: Open Rewards Hub to <strong>claim to your wallet</strong> in{" "}
              <span className="badge"><TokenInline token="USDT" size={14} /></span> or <TokenInline token="BITS" size={14} />.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}



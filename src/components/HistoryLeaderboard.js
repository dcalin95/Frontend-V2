import React, { useMemo } from "react";
import "./LeaderboardPanel.css";

export default function HistoryLeaderboard({ claimed = [], bitsPriceMillicents = null }) {
  const priceUsd = bitsPriceMillicents ? Number(bitsPriceMillicents) / 1000 : null;

  const rows = useMemo(() => {
    return (claimed || []).map((r) => {
      const amtBits = Math.floor(Number(r.amount || 0));
      const usd = priceUsd != null ? amtBits * priceUsd : null;
      const dateStr = new Date(r.claimed_at || r.created_at).toLocaleString();
      return {
        id: r.id || `${r.reward_type}-${r.created_at}`,
        type: r.reward_type,
        amountBits: amtBits,
        usd,
        dateStr,
        tx: r.tx_hash || null
      };
    });
  }, [claimed, priceUsd]);

  return (
    <>
      <div className="lb-head">
        <div>
          <div className="lb-title">🧾 Claim History</div>
          <div className="lb-sub">
            {priceUsd != null ? `USD uses current presale price ($${priceUsd.toFixed(6)} / BITS).` : "USD uses presale price when available."}
          </div>
        </div>
      </div>

      <div className="lb-table">
        <div className="lb-row lb-header" style={{ gridTemplateColumns: "140px 1fr 110px 180px 120px" }}>
          <div>Type</div>
          <div>Amount</div>
          <div>USD</div>
          <div>Date</div>
          <div>Tx</div>
        </div>

        {rows.map((r) => (
          <div key={r.id} className="lb-row" style={{ gridTemplateColumns: "140px 1fr 110px 180px 120px" }}>
            <div style={{ fontWeight: 900 }}>{String(r.type || "—").toUpperCase()}</div>
            <div className="lb-accent">{Number(r.amountBits || 0).toLocaleString()} $BITS</div>
            <div style={{ fontWeight: 900 }}>{r.usd != null ? `$${Number(r.usd).toFixed(2)}` : "—"}</div>
            <div className="lb-muted">{r.dateStr}</div>
            <div>
              {r.tx ? (
                <a
                  href={`https://bscscan.com/tx/${r.tx}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#7dd3fc", fontWeight: 900, textDecoration: "none" }}
                >
                  View
                </a>
              ) : (
                <span className="lb-muted">—</span>
              )}
            </div>
          </div>
        ))}

        {rows.length === 0 && <div className="lb-empty">No claims yet.</div>}
      </div>
    </>
  );
}



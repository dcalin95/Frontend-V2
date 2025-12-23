import React from "react";
import "./InviteHowItWorks.css";
import TokenInline from "../common/TokenInline";

const InviteHowItWorks = () => {
  return (
    <div className="invite-how-card">
      <div className="invite-how-head">
        <div className="invite-how-title">🧠 Invite System — How it works</div>
        <div className="invite-how-sub">Short guide. Expand sections below for details.</div>
      </div>

      <details className="invite-how-acc" open>
        <summary>✅ How to verify (website + Telegram)</summary>
        <div className="invite-how-acc-body">
          <ul>
            <li>
              <strong>Website</strong>: open <code>/rewards-hub</code> to see Invite/Referral rewards and claim in{" "}
              <strong><TokenInline token="BITS" /></strong> or <strong><TokenInline token="USDT" /></strong>.
            </li>
            <li>
              <strong>Telegram</strong>: use <code>/myrefs</code> (shows invited count) and <code>/invite</code> (shows your invite link).
            </li>
            <li>
              <strong>On-chain proof</strong>: claims return a tx hash; open it on BscScan to audit payouts.
            </li>
          </ul>
        </div>
      </details>

      <details className="invite-how-acc">
        <summary>🔗 Telegram linking (required for Telegram Activity rewards)</summary>
        <div className="invite-how-acc-body">
          <ul>
            <li>Use <code>/register</code> to start tracking.</li>
            <li>Link wallet: <code>/linkwallet 0xYourAddress</code>.</li>
            <li>
              Telegram Activity rewards and Invite rewards are separate; both can be claimed from the website Rewards Hub.
            </li>
          </ul>
        </div>
      </details>

      <details className="invite-how-acc">
        <summary>🛡️ Notes (important)</summary>
        <div className="invite-how-acc-body">
          <ul>
            <li><strong>Always check the URL/code</strong> before applying it.</li>
            <li><strong>Never share private keys</strong>. We only need your public wallet address.</li>
            <li>
              If you change wallets, you must re-link in Telegram (<code>/linkwallet</code>) to receive Telegram Activity rewards.
            </li>
          </ul>
        </div>
      </details>
    </div>
  );
};

export default InviteHowItWorks;



/**
 * Hint / Step — doar modul Beginner pe ClobSeiTradePage.
 */

import React from 'react';

export function ClobSeiHint({ icon = '💡', children }) {
  return (
    <div className="clob-hint">
      <span className="clob-hint__icon">{icon}</span>
      <span className="clob-hint__text">{children}</span>
    </div>
  );
}

export function ClobSeiStep({ n, text }) {
  return (
    <div className="clob-step">
      <span className="clob-step__num">{n}</span>
      <span className="clob-step__text">{text}</span>
    </div>
  );
}

import React from 'react';

/**
 * Clear separation: auxiliary SEI/ATOM vs CEX signal is not the selected pair’s execution quote.
 */
export default function SeiAuxiliaryVsPairCallout({ effectivePair, base, quote }) {
  return (
    <div
      className="ota-sei-micro-profit__auxiliary-callout"
      role="region"
      aria-label="Auxiliary signal vs selected trading pair"
      aria-labelledby="sei-aux-vs-pair-title"
    >
      <h4 id="sei-aux-vs-pair-title" className="ota-sei-micro-profit__auxiliary-callout-title">
        Two different things (do not confuse)
      </h4>
      <ol className="ota-sei-micro-profit__auxiliary-callout-list">
        <li>
          <strong>Your selected pair ({effectivePair}):</strong> used for live price, manual round-trip, and Open position — backend <code>execution/execute</code> quotes apply to this pair.
        </li>
        <li>
          <strong>&quot;Check signal&quot; only:</strong> auxiliary snapshot <strong>SEI/ATOM</strong> Astroport pool vs CEX. It is <strong>not</strong> the bid/ask for <code>{base}/{quote}</code> and must not be read as your pair&apos;s fill price.
        </li>
      </ol>
    </div>
  );
}

import React from 'react';

export default function CapabilityGapsDrawer({ gaps = [] }) {
  if (!gaps.length) return null;
  return (
    <details className="investigator-capability-gaps">
      <summary>Capability gaps <span>{gaps.length}</span></summary>
      <div>
        {gaps.map((gap) => (
          <article key={gap.capability || gap}>
            <strong>{gap.capability || 'Unavailable capability'}</strong>
            <p>{gap.reason || String(gap)}</p>
            {gap.impactOnConclusions ? <small>Impact: {gap.impactOnConclusions}</small> : null}
          </article>
        ))}
      </div>
    </details>
  );
}

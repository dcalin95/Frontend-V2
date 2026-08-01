import React from 'react';

export const INVESTIGATOR_TABS = [
  ['overview', 'Overview'],
  ['graph', 'Graph'],
  ['transactions', 'Transactions'],
  ['fund-flow', 'Fund Flow'],
  ['entities', 'Entities'],
  ['contract-token', 'Contract / Token'],
  ['evidence', 'Evidence'],
  ['timeline', 'Timeline'],
  ['notes-claims', 'Notes & Claims'],
  ['reports', 'Reports'],
  ['assistant', 'AI Assistant'],
];

export default function InvestigatorTabs({ activeTab, onChange }) {
  return (
    <nav className="investigator-tabs" aria-label="Investigation workspace sections">
      <div role="tablist" aria-orientation="horizontal">
        {INVESTIGATOR_TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            className={activeTab === id ? 'is-active' : ''}
            onClick={() => onChange(id)}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

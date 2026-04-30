/**
 * Token select for leverage (collateral, borrowed, margin CFD).
 * Folosește LeverageDropdown (custom) cu TokenLogo per opțiune.
 */
import React from 'react';
import LeverageDropdown from './LeverageDropdown';

export default function TokenSelect({ value, onChange, options, label, disabled = false }) {
  if (!options?.length) return null;

  // Normalizăm opțiunile: { value, label, symbol }
  const ddOptions = options.map((o) => ({
    value: o.address || '',
    label: o.symbol,
    symbol: o.symbol,
  }));

  return (
    <LeverageDropdown
      label={label}
      value={value ?? ''}
      onChange={onChange}
      options={ddOptions}
      ariaLabel={label}
      disabled={disabled}
    />
  );
}

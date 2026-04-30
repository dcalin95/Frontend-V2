/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import SeiAuxiliaryVsPairCallout from '../components/SeiAuxiliaryVsPairCallout';

describe('SeiAuxiliaryVsPairCallout', () => {
  it('labels auxiliary SEI/ATOM signal separately from selected pair', () => {
    const { container } = render(<SeiAuxiliaryVsPairCallout effectivePair="SEI/USDC" base="SEI" quote="USDC" />);
    const text = container.textContent || '';
    expect(text).toMatch(/Two different things/i);
    expect(text).toMatch(/SEI\/USDC/);
    expect(text).toMatch(/SEI\/ATOM/i);
    const region = container.querySelector('[aria-label="Auxiliary signal vs selected trading pair"]');
    expect(region).not.toBeNull();
    expect(region.getAttribute('aria-labelledby')).toBe('sei-aux-vs-pair-title');
  });
});

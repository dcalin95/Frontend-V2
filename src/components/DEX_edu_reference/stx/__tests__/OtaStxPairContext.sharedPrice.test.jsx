/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { OtaStxPairProvider, useOtaStxPair } from '../context/OtaStxPairContext';

const mockUseStxOtaPairPrice = jest.fn();

jest.mock('../hooks/useStxOtaPairPrice', () => ({
  useStxOtaPairPrice: (...args) => mockUseStxOtaPairPrice(...args),
}));

function Consumer() {
  const { livePriceUsd, base, quote } = useOtaStxPair();
  return (
    <span data-testid="stx-shared">
      {base}/{quote}:{livePriceUsd ?? 'null'}
    </span>
  );
}

describe('OtaStxPairProvider shared price', () => {
  beforeEach(() => {
    mockUseStxOtaPairPrice.mockReturnValue({
      livePriceUsd: 0.55,
      livePriceError: null,
      livePriceLoading: false,
      livePriceLastAt: Date.now(),
    });
  });

  it('calls useStxOtaPairPrice once per provider (single poll for strip, window, panel)', () => {
    render(
      <OtaStxPairProvider>
        <Consumer />
      </OtaStxPairProvider>
    );
    expect(mockUseStxOtaPairPrice).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('stx-shared').textContent).toContain('0.55');
  });
});

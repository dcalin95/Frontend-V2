/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { OtaSeiPairProvider, useOtaSeiPair } from '../context/OtaSeiPairContext';

const mockUseSeiMarketData = jest.fn();

jest.mock('../hooks/useSeiMarketData', () => ({
  useSeiMarketData: (...args) => mockUseSeiMarketData(...args),
}));

function PriceConsumer() {
  const { livePriceUsd, base, quote } = useOtaSeiPair();
  return (
    <span data-testid="shared-price">
      {base}/{quote}:{livePriceUsd ?? 'null'}
    </span>
  );
}

describe('OtaSeiPairProvider shared price', () => {
  beforeEach(() => {
    mockUseSeiMarketData.mockReturnValue({
      livePrice: 0.1234,
      livePriceError: null,
      loading: false,
      hasExecutionQuote: true,
      usedFallbackPrice: false,
      priceSource: 'executionQuote',
      lastPriceAt: Date.now(),
      lastExecutionQuoteAt: Date.now(),
    });
  });

  it('calls useSeiMarketData once per provider (one poll for strip, live window, open orders)', () => {
    render(
      <OtaSeiPairProvider>
        <PriceConsumer />
      </OtaSeiPairProvider>
    );
    expect(mockUseSeiMarketData).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('shared-price').textContent).toContain('0.1234');
  });
});

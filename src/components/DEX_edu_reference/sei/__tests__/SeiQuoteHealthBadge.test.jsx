import React from 'react';
import { render } from '@testing-library/react';
import SeiQuoteHealthBadge from '../components/SeiQuoteHealthBadge';
import { SEI_MARKET_DATA_STALE_MS } from '../constants/otaSeiPageDefaults';

describe('SeiQuoteHealthBadge', () => {
  it('renders Exec fresh for recent execution quote', () => {
    const { container } = render(
      <SeiQuoteHealthBadge
        hasExecutionQuote
        usedFallbackPrice={false}
        lastExecutionQuoteAt={Date.now() - 5000}
      />
    );
    expect(container.textContent).toMatch(/Exec fresh/);
  });

  it('renders Fallback + Degraded when only fallback', () => {
    const { container } = render(
      <SeiQuoteHealthBadge
        hasExecutionQuote={false}
        usedFallbackPrice
        lastExecutionQuoteAt={null}
      />
    );
    expect(container.textContent).toMatch(/Fallback/);
    expect(container.textContent).toMatch(/Degraded/);
  });

  it('renders Exec stale when last exec quote is old', () => {
    const { container } = render(
      <SeiQuoteHealthBadge
        hasExecutionQuote
        usedFallbackPrice={false}
        lastExecutionQuoteAt={Date.now() - SEI_MARKET_DATA_STALE_MS - 5000}
      />
    );
    expect(container.textContent).toMatch(/Exec stale/);
  });
});

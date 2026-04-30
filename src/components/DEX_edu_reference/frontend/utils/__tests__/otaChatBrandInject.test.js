import { injectOtaChatBrandAnchors } from '../otaChatBrandInject';

describe('injectOtaChatBrandAnchors', () => {
  it('wraps known product names in brand links', () => {
    const s = 'Use BitSwapDEX and Leverage on SEI with OTA.';
    const out = injectOtaChatBrandAnchors(s);
    expect(out).toContain('[BitSwapDEX](#ota-brand-bitswapdex)');
    expect(out).toContain('[Leverage](#ota-brand-leverage)');
    expect(out).toContain('[SEI](#ota-brand-sei)');
    expect(out).toContain('[OTA](#ota-brand-ota)');
  });

  it('does not alter fenced code blocks', () => {
    const s = 'Text BitSwapDEX.\n\n```\nBitSwapDEX raw\n```';
    const out = injectOtaChatBrandAnchors(s);
    expect(out).toContain('```\nBitSwapDEX raw\n```');
    expect(out.split('```')[1]).not.toContain('#ota-brand');
  });

  it('does not wrap tokens inside inline backticks', () => {
    const s = 'Price `USDT` and USDT.';
    const out = injectOtaChatBrandAnchors(s);
    expect(out).toContain('`USDT`');
    expect(out.match(/#ota-brand/g) || []).toHaveLength(1);
  });

  it('wraps standalone acronyms and multi-word titles', () => {
    const s = 'See API docs and United States policy.';
    const out = injectOtaChatBrandAnchors(s);
    expect(out).toContain('[API](#ota-brand-');
    expect(out).toContain('[United States](#ota-brand-');
  });
});

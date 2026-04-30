import {
  normalizeOpsPanelSymbol,
  fmtSignedPct1,
  dedupeReasoningOpenAiCostFragments,
  stripEmbeddedOpenAiAttributionFromReasoning,
  formatSignalCardReasoningText,
} from './otaOpsPanelDisplay';

describe('otaOpsPanelDisplay', () => {
  describe('normalizeOpsPanelSymbol', () => {
    it('collapses duplicated base like ETHETH', () => {
      expect(normalizeOpsPanelSymbol('ETHETH')).toBe('ETH');
      expect(normalizeOpsPanelSymbol('BTCBTC')).toBe('BTC');
    });
    it('leaves normal symbols', () => {
      expect(normalizeOpsPanelSymbol('ETH')).toBe('ETH');
      expect(normalizeOpsPanelSymbol(' eth ')).toBe('ETH');
    });
    it('does not strip USDT pairs', () => {
      expect(normalizeOpsPanelSymbol('ETHUSDT')).toBe('ETHUSDT');
    });
  });

  describe('fmtSignedPct1', () => {
    it('formats negative without double sign', () => {
      expect(fmtSignedPct1(-15)).toBe('-15.0%');
      expect(fmtSignedPct1(-2.03)).toBe('-2.0%');
    });
    it('formats positive with plus', () => {
      expect(fmtSignedPct1(20)).toBe('+20.0%');
    });
    it('formats zero', () => {
      expect(fmtSignedPct1(0)).toBe('0.0%');
    });
    it('null for non-finite', () => {
      expect(fmtSignedPct1(NaN)).toBeNull();
      expect(fmtSignedPct1(null)).toBeNull();
    });
  });

  describe('dedupeReasoningOpenAiCostFragments', () => {
    it('păstrează o singură apariție pentru același fragment Cost repetat (rânduri)', () => {
      const raw = `Hold (SOL/USDT): no grounded.\n· Cost: $0.0105 · 69837 tok\n· Cost: $0.0105 · 69837 tok\n· Cost: $0.0105 · 69837 tok`;
      const out = dedupeReasoningOpenAiCostFragments(raw);
      expect((out.match(/Cost:\s*\$0\.0105/gi) || []).length).toBe(1);
    });
    it('păstrează costuri diferite (sumă sau tok diferit)', () => {
      const raw = 'a · Cost: $0.01 · 100 tok b · Cost: $0.02 · 200 tok';
      const out = dedupeReasoningOpenAiCostFragments(raw);
      expect((out.match(/Cost:\s*\$/gi) || []).length).toBe(2);
    });
  });

  describe('stripEmbeddedOpenAiAttributionFromReasoning', () => {
    it('taie sufixul Trimis de / Cost dacă e lipit de mesaj (legacy sau paste)', () => {
      const raw =
        'Hold: insufficient grounded evidence. Trimis de: OpenAI · gpt-4o-mini · Cost: $0.0127 · 84708 tok';
      expect(stripEmbeddedOpenAiAttributionFromReasoning(raw)).toBe('Hold: insufficient grounded evidence.');
    });
    it('taie varianta Sent by (EN)', () => {
      expect(stripEmbeddedOpenAiAttributionFromReasoning('X. Sent by: OpenAI · m')).toBe('X.');
    });
  });

  describe('formatSignalCardReasoningText', () => {
    it('prefixează token când lipsește din text', () => {
      expect(formatSignalCardReasoningText('doar mesaj', 'SOL')).toBe('SOL: doar mesaj');
    });
    it('nu dublă prefix dacă token e deja în text', () => {
      expect(formatSignalCardReasoningText('SOL: deja', 'SOL')).toBe('SOL: deja');
    });
    it('nu lasă Trimis de în corp când vine aglomerat în același string API', () => {
      const raw =
        'Hold: insufficient grounded evidence. Trimis de: OpenAI · gpt-4o-mini · Cost: $0.0127 · 84708 tok';
      expect(formatSignalCardReasoningText(raw, 'SOL')).toBe('SOL: Hold: insufficient grounded evidence.');
    });
  });
});

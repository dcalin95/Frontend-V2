/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useOtaFuturesAnalyzeLlmMode } from '../useOtaFuturesAnalyzeLlmMode';
import {
  setOtaFuturesAnalyzeLlmMode,
  OTA_ANALYZE_LLM_OTA_BITS_ONLY,
  OTA_ANALYZE_LLM_WITH_OPENAI,
} from '../../utils/otaAnalysisModePreference';

describe('useOtaFuturesAnalyzeLlmMode', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('citește implicit with_openai', () => {
    const { result } = renderHook(() => useOtaFuturesAnalyzeLlmMode());
    expect(result.current).toBe(OTA_ANALYZE_LLM_WITH_OPENAI);
  });

  it('se actualizează la setOtaFuturesAnalyzeLlmMode (eveniment)', () => {
    const { result } = renderHook(() => useOtaFuturesAnalyzeLlmMode());
    act(() => {
      setOtaFuturesAnalyzeLlmMode(OTA_ANALYZE_LLM_OTA_BITS_ONLY, { source: 'click' });
    });
    expect(result.current).toBe(OTA_ANALYZE_LLM_OTA_BITS_ONLY);
    act(() => {
      setOtaFuturesAnalyzeLlmMode(OTA_ANALYZE_LLM_WITH_OPENAI);
    });
    expect(result.current).toBe(OTA_ANALYZE_LLM_WITH_OPENAI);
  });
});

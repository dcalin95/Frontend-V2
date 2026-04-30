/**
 * Pool health (Astroport) + auxiliary Binance vs SEI/ATOM pool discrepancy polling.
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchMarketDiscrepancy } from '../services/otaSeiMicroProfitService';
import { SEI_POOL_REGISTRY_UI } from '../constants/seiPoolRegistryUi';
import { SEI_REST } from '../seiConfig';

export function useSeiPoolAndAuxiliarySignal() {
  const [poolHealth, setPoolHealth] = useState(null);
  const [poolHealthLoading, setPoolHealthLoading] = useState(false);
  const [priceDiscrepancy, setPriceDiscrepancy] = useState(null);
  const [priceDiscrepancyLoading, setPriceDiscrepancyLoading] = useState(false);

  const checkPoolHealth = useCallback(async () => {
    const simMsg = { simulation: { offer_asset: { info: { native_token: { denom: 'usei' } }, amount: '1000000' } } };
    const b64 = btoa(JSON.stringify(simMsg));
    setPoolHealthLoading(true);
    const restBase = String(SEI_REST || '').replace(/\/$/, '');
    try {
      const results = await Promise.all(
        SEI_POOL_REGISTRY_UI.map(async (pool) => {
          try {
            const res = await fetch(`${restBase}/cosmwasm/wasm/v1/contract/${pool.pairAddress}/smart/${b64}`);
            if (!res.ok) return { ...pool, ok: false, spreadPct: null, reason: `HTTP ${res.status}` };
            const data = await res.json();
            const ret = Number(data?.data?.return_amount || 0);
            const spread = Number(data?.data?.spread_amount || 0);
            if (ret <= 0) return { ...pool, ok: false, spreadPct: 100, reason: 'No liquidity' };
            const spreadPct = (spread / (ret + spread)) * 100;
            const tradeable = spreadPct <= pool.tightSpreadPct;
            const healthy = spreadPct <= pool.maxSpreadPct;
            return { ...pool, ok: tradeable, healthy, spreadPct };
          } catch (e) {
            return { ...pool, ok: false, spreadPct: null, reason: `Error: ${e.message}` };
          }
        })
      );
      const anyOk = results.some((r) => r.ok);
      setPoolHealth({ ok: anyOk, pools: results });
    } catch (e) {
      setPoolHealth({ ok: false, pools: [], reason: `Check failed: ${e.message}` });
    } finally {
      setPoolHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPoolHealth();
    const interval = setInterval(checkPoolHealth, 60000);
    return () => clearInterval(interval);
  }, [checkPoolHealth]);

  useEffect(() => {
    let cancelled = false;
    const fetchDisc = async () => {
      if (cancelled) return;
      setPriceDiscrepancyLoading(true);
      try {
        const data = await fetchMarketDiscrepancy();
        if (!cancelled) setPriceDiscrepancy(data);
      } finally {
        if (!cancelled) setPriceDiscrepancyLoading(false);
      }
    };
    fetchDisc();
    const iv = setInterval(fetchDisc, 30000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, []);

  return {
    poolHealth,
    poolHealthLoading,
    checkPoolHealth,
    priceDiscrepancy,
    priceDiscrepancyLoading,
  };
}

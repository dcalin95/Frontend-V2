import { useEffect, useState, useCallback } from "react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

// CORS proxy pentru acces direct la CoinGecko
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

/**
 * Generic price feed using CoinGecko or fixed price fallback
 * @param {{ coingeckoId?: string|null, fixedPrice?: number|null, vs?: string, refreshMs?: number }} cfg
 */
export default function useTokenPriceFeed(cfg = {}) {
  const { coingeckoId = null, fixedPrice = null, vs = "usd", refreshMs = 10000 } = cfg;
  const [series, setSeries] = useState([]); // [{ time, price }]
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [useDemo, setUseDemo] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError("");
      
      if (!coingeckoId) {
        // Synthetic flat line around fixed price
        const p = typeof fixedPrice === "number" ? fixedPrice : 1;
        const now = Date.now();
        const pts = Array.from({ length: 24 }, (_, i) => ({ time: now - (24 - i) * 60 * 60 * 1000, price: p }));
        setSeries(pts);
        setPrice(p);
        setUseDemo(true);
        setLoading(false);
        return;
      }
      
      // Method 1: Try direct CoinGecko API (might fail due to CORS)
      try {
        const chartUrl = `https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart?vs_currency=${vs}&days=1&interval=hourly`;
        const priceUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=${vs}`;
        
        const [chartRes, priceRes] = await Promise.all([
          fetch(chartUrl, { 
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          }),
          fetch(priceUrl, { 
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          })
        ]);
        
        if (chartRes.ok && priceRes.ok) {
          const chartJson = await chartRes.json();
          const priceJson = await priceRes.json();
          const points = Array.isArray(chartJson?.prices)
            ? chartJson.prices.map(([ts, p]) => ({ time: ts, price: Number(p) }))
            : [];
          
          if (points.length > 0) {
            setSeries(points);
            const cur = Number(priceJson?.[coingeckoId]?.[vs]) || points[points.length - 1]?.price;
            setPrice(cur);
            setUseDemo(false);
            setLoading(false);
            console.log(`✅ SUCCESS: Using real CoinGecko data for ${coingeckoId}`);
            return;
          }
        }
      } catch (directApiError) {
        console.warn(`Direct CoinGecko API failed for ${coingeckoId}:`, directApiError.message);
      }
      
      // Method 2: Try with CORS proxy
      try {
        const chartUrl = `${CORS_PROXY}${encodeURIComponent(`https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart?vs_currency=${vs}&days=1&interval=hourly`)}`;
        const priceUrl = `${CORS_PROXY}${encodeURIComponent(`https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=${vs}`)}`;
        
        const [chartRes, priceRes] = await Promise.all([
          fetch(chartUrl),
          fetch(priceUrl)
        ]);
        
        if (chartRes.ok && priceRes.ok) {
          const chartJson = await chartRes.json();
          const priceJson = await priceRes.json();
          const points = Array.isArray(chartJson?.prices)
            ? chartJson.prices.map(([ts, p]) => ({ time: ts, price: Number(p) }))
            : [];
          
          if (points.length > 0) {
            setSeries(points);
            const cur = Number(priceJson?.[coingeckoId]?.[vs]) || points[points.length - 1]?.price;
            setPrice(cur);
            setUseDemo(false);
            setLoading(false);
            console.log(`✅ SUCCESS: Using real CoinGecko data via proxy for ${coingeckoId}`);
            return;
          }
        }
      } catch (proxyError) {
        console.warn(`CORS proxy failed for ${coingeckoId}:`, proxyError.message);
      }

      // Method 3: Try backend if available
      try {
        const chartUrl = `${BACKEND_URL}/api/market/chart?id=${encodeURIComponent(coingeckoId)}&vs=${encodeURIComponent(vs)}&days=1&interval=hourly`;
        const priceUrl = `${BACKEND_URL}/api/market/price?id=${encodeURIComponent(coingeckoId)}&vs=${encodeURIComponent(vs)}`;
        const [chartRes, priceRes] = await Promise.all([
          fetch(chartUrl, { cache: "no-store" }),
          fetch(priceUrl, { cache: "no-store" })
        ]);
        
        if (chartRes.ok && priceRes.ok) {
          const chartJson = await chartRes.json();
          const priceJson = await priceRes.json();
          const points = Array.isArray(chartJson?.prices)
            ? chartJson.prices.map(([ts, p]) => ({ time: ts, price: Number(p) }))
            : [];
          
          if (points.length > 0) {
            setSeries(points);
            const cur = Number(priceJson?.[coingeckoId]?.[vs]) || points[points.length - 1]?.price || 1;
            setPrice(cur);
            setUseDemo(false);
            setLoading(false);
            console.log(`✅ SUCCESS: Using real data from backend for ${coingeckoId}`);
            return;
          }
        }
      } catch (backendError) {
        console.warn(`Backend not available for ${coingeckoId}:`, backendError.message);
      }
      
      // Fallback to STATIC demo data only if all methods fail
      console.warn(`⚠️ All real data sources failed for ${coingeckoId}, using STATIC demo data`);
      const basePrice = coingeckoId === 'blockstack' ? 2.45 : 
                       coingeckoId === 'wrapped-bitcoin' ? 95000 : 
                       coingeckoId === 'alexgo' ? 0.15 : 1;
      
      // STATIC pattern - NO RANDOM!
      const staticPattern = [
        -0.03, 0.02, -0.01, 0.04, -0.02, 0.01, -0.03, 0.05, 
        -0.01, 0.03, -0.04, 0.02, -0.01, 0.03, -0.02, 0.04,
        -0.03, 0.01, -0.02, 0.05, -0.01, 0.02, -0.03, 0.01
      ];
      
      const now = Date.now();
      const demoPoints = [];
      for (let i = 23; i >= 0; i--) {
        const timestamp = now - (i * 60 * 60 * 1000);
        const volatility = staticPattern[23 - i] || 0;
        const price = basePrice * (1 + volatility);
        demoPoints.push({ time: timestamp, price: Math.max(0.01, price) });
      }
      
      setSeries(demoPoints);
      setPrice(demoPoints[demoPoints.length - 1]?.price || basePrice);
      setUseDemo(true);
      setError("Using demo data - Real data sources unavailable");
      setLoading(false);
      
    } catch (e) {
      // Ultimate fallback
      const p = typeof fixedPrice === "number" ? fixedPrice : 1;
      const now = Date.now();
      const pts = Array.from({ length: 24 }, (_, i) => ({ time: now - (24 - i) * 60 * 60 * 1000, price: p }));
      setSeries(pts);
      setPrice(p);
      setUseDemo(true);
      setError("Using demo data - " + (e?.message || "Failed to load price"));
      setLoading(false);
    }
  }, [coingeckoId, fixedPrice, vs]);

  useEffect(() => {
    fetchData();
    // REMOVE auto-refresh to stop random chart changes!
    // const id = setInterval(fetchData, refreshMs);
    // return () => clearInterval(id);
  }, []); // 🔧 FIXED - Empty dependency array to prevent infinite loop

  return { series, price, loading, error, useDemo, refresh: fetchData };
}



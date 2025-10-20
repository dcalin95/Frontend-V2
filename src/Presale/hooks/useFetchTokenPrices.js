// src/Presale/hooks/useFetchTokenPrices.js
import { useEffect, useState } from "react";
import fetchTokenPrice from "../prices/fetchTokenPrice";
import { tokenList } from "../TokenHandlers/tokenData";

const useFetchTokenPrices = () => {
  const [tokenPrices, setTokenPrices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      const prices = {};

      for (const token of tokenList) {
        try {
          if (token.mockPrice !== undefined) {
            prices[token.key] = {
              price: token.mockPrice,
              source: "mock"
            };
            console.log(`🧪 [Mock] ${token.key} price: $${token.mockPrice}`);
          } else {
            const { price, source } = await fetchTokenPrice(token.address, token.key);
            prices[token.key] = { price, source };
          }
        } catch (err) {
          console.error(`❌ Failed fetching price for ${token.key}`, err);
          prices[token.key] = { price: 0, source: "error" };
        }
      }

      setTokenPrices(prices);
      setLoading(false);
    };

    fetchPrices();
  }, []);

  return { tokenPrices, loading };
};

export default useFetchTokenPrices;

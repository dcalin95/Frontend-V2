/**
 * 📊 useTradingPair Hook
 * 
 * Hook pentru trading pair management
 */

import { useState, useEffect } from 'react';

const useTradingPair = (defaultTokenIn, defaultTokenOut, tokens = []) => {
  const [tokenIn, setTokenIn] = useState(defaultTokenIn || tokens[0] || null);
  const [tokenOut, setTokenOut] = useState(defaultTokenOut || tokens[1] || null);

  useEffect(() => {
    if (tokens.length > 0 && !tokenIn) {
      setTokenIn(tokens[0]);
    }
    if (tokens.length > 1 && !tokenOut) {
      setTokenOut(tokens[1]);
    }
  }, [tokens, tokenIn, tokenOut]);

  const handlePairChange = (newTokenIn, newTokenOut) => {
    if (newTokenIn) setTokenIn(newTokenIn);
    if (newTokenOut) setTokenOut(newTokenOut);
  };

  return {
    tokenIn,
    tokenOut,
    setTokenIn,
    setTokenOut,
    handlePairChange
  };
};

export default useTradingPair;


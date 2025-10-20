import { useState } from "react";
import { tokenList } from "../TokenHandlers/tokenData";

export const useSelectedToken = () => {
  // Inițializăm cu primul token EVM disponibil
  const defaultToken = tokenList.find((t) => t.chain === "evm");

  const [selectedToken, setSelectedToken] = useState(defaultToken.key);
  const [selectedChain, setSelectedChain] = useState(defaultToken.chain);

  const updateChain = (chain) => {
    setSelectedChain(chain);

    // Setează automat primul token din noul chain
    const firstToken = tokenList.find((t) => t.chain === chain);
    if (firstToken) {
      setSelectedToken(firstToken.key);
    }
  };

  const selectToken = (tokenKey) => {
    setSelectedToken(tokenKey);
    const token = tokenList.find((t) => t.key === tokenKey);
    if (token) setSelectedChain(token.chain); // actualizează și chain-ul dacă e nevoie
  };

  return {
    selectedToken,
    selectedChain,
    setSelectedToken: selectToken,
    setSelectedChain: updateChain,
  };
};


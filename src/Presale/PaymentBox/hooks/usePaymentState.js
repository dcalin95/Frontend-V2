import { useState, useMemo, useContext } from "react";
import WalletContext from "../../../context/WalletContext";
import useFetchBalances from "../../hooks/useFetchBalances";
import useAvailableBits from "../../hooks/useAvailableBits";
import useBitsPrice from "../../prices/useBitsPrice";
import useBitsEstimate from "../../hooks/useBitsEstimate";

const usePaymentState = ({
  selectedToken,
  selectedChain,
  amountPay,
  setAmountPay,
  tokenPrices,
  pricesLoading,
}) => {
  const { walletAddress, connectWallet } = useContext(WalletContext);

  // 🔄 Loading States
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  const [transactionStep, setTransactionStep] = useState("");
  const [transactionError, setTransactionError] = useState(null);

  // 📊 Data Hooks
  const balances = useFetchBalances(walletAddress, selectedToken);
  const { availableBits, loading: availableLoading } = useAvailableBits();
  const {
    bitsPrice: pricePerBitsUSD,
    loading: bitsLoading,
    error: priceError,
  } = useBitsPrice(walletAddress);

  // 💰 Token Price Calculation
  const selectedTokenPrice = useMemo(() => {
    let price = tokenPrices?.[selectedToken]?.price || 0;
    if (selectedToken === "SOL" && (!price || price === 0)) price = 150;
    return price;
  }, [tokenPrices, selectedToken]);

  // 🛡️ Safe Amount Validation
  const safeAmountPay = useMemo(() => {
    if (isNaN(amountPay) || amountPay === undefined || amountPay === null) {
      if (selectedToken === 'SOL') return 0.001;
      if (selectedToken === 'BTCB') return 0.0001;
      if (selectedToken === 'USDC-Solana') return 0.01;
      return 0.01;
    }
    return amountPay;
  }, [amountPay, selectedToken]);

  // 🧮 BITS Calculation
  const { bits, usdValue, bonus, bonusAmount } = useBitsEstimate({
    amountPay: safeAmountPay,
    selectedToken,
    tokenPriceUSD: selectedTokenPrice,
    walletAddress,
    pricePerBitsUSD,
  });

  // 🔧 Contract sends INTEGER BITS only - always floor
  const pureBits = Math.floor(bits);

  // 🔍 Debug BITS calculation results
  console.log("🔍 [usePaymentState] BITS Calculation Results for", selectedToken);
  console.log("- safeAmountPay:", safeAmountPay);
  console.log("- bits (from useBitsEstimate):", bits);
  console.log("- usdValue:", usdValue);
  console.log("- bonus:", bonus);
  console.log("- bonusAmount:", bonusAmount);
  console.log("- pureBits (Math.floor):", pureBits);
  console.log("- pricePerBitsUSD:", pricePerBitsUSD);

  // 📈 Loading State Aggregation
  const isLoading = pricesLoading || bitsLoading || availableLoading || isProcessingTransaction;

  // 🎯 Token Data
  const { tokenList } = require("../../TokenHandlers/tokenData");
  const selectedTokenData = useMemo(() => {
    return tokenList.find((token) => token.key === selectedToken);
  }, [tokenList, selectedToken]);

  const selectedTokenIcon = selectedTokenData ? selectedTokenData.icon : "/icons/default.png";

  // 🔍 Validation States
  const hasValidAmount = Number.isFinite(safeAmountPay) && safeAmountPay > 0;
  
  // 💳 For fiat tokens, skip balance validation (user pays with card)
  const isFiatToken = ['TRANSAK', 'MOONPAY', 'NOWPAY'].includes(selectedToken);
  const hasValidBalance = isFiatToken ? true : (balances[selectedToken] >= safeAmountPay);
  
  const canProceed = hasValidAmount && hasValidBalance && !isLoading;

  // 🚨 Debug logging for SOL and Fiat tokens
  if (selectedToken === "SOL" || isFiatToken) {
    console.group(`🟣 [${selectedToken} Payment State Debug]`);
    console.log("Amount to pay:", safeAmountPay);
    console.log("Token Balance:", balances[selectedToken]);
    console.log("Is fiat token:", isFiatToken);
    console.log("Has valid amount:", hasValidAmount);
    console.log("Has valid balance:", hasValidBalance);
    console.log("Is loading:", isLoading);
    console.log("Can proceed:", canProceed);
    console.log("All balances:", balances);
    console.groupEnd();
  }

  return {
    // 🔄 Loading States
    isLoading,
    isProcessingTransaction,
    transactionStep,
    transactionError,
    setIsProcessingTransaction,
    setTransactionStep,
    setTransactionError,

    // 📊 Data
    balances,
    availableBits,
    pricePerBitsUSD,
    priceError,
    selectedTokenPrice,
    safeAmountPay,
    bits,
    usdValue,
    bonus,
    bonusAmount,
    pureBits,

    // 🎯 UI Data
    selectedTokenIcon,
    walletAddress,
    connectWallet,

    // 🔍 Validation
    hasValidAmount,
    hasValidBalance,
    canProceed,
  };
};

export default usePaymentState; 
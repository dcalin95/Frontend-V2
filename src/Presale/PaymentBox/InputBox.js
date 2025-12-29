// src/Presale/PaymentBox/InputBox.js

import React, { useEffect, useState } from "react";
import "./InputBox.css";
import { FaPlus, FaMinus } from "react-icons/fa";
import { GiBroom, GiWallet } from "react-icons/gi";
import SmartTooltip from "../components/SmartTooltip";

const InputBox = ({ amountPay, setAmountPay, userBalance, selectedToken, minAmountToken, minAmountDecimals }) => {
  // 🌟 Different minimum amounts and steps by token
  const DEFAULT_MIN = (selectedToken === "SOL") ? 0.001 :
                      (selectedToken === "USDC-Solana") ? 0.01 :
                      (selectedToken === "BTCB") ? 0.0001 : 0.01;
  const MIN_AMOUNT = typeof minAmountToken === 'number' && minAmountToken > 0 ? minAmountToken : DEFAULT_MIN;
  const STEP = (selectedToken === "SOL") ? 0.001 :
               (selectedToken === "USDC-Solana") ? 0.01 :
               (selectedToken === "BTCB") ? 0.0001 : 0.01;
  const DEFAULT_DECIMALS = (selectedToken === "SOL") ? 3 :
                           (selectedToken === "BTCB") ? 4 :
                           (selectedToken === "USDC-Solana") ? 2 : 2;
  const DECIMALS = typeof minAmountDecimals === 'number' ? Math.max(minAmountDecimals, DEFAULT_DECIMALS) : DEFAULT_DECIMALS;

  const [internalValue, setInternalValue] = useState(
    typeof amountPay === "number" && !isNaN(amountPay) ? amountPay : MIN_AMOUNT
  );


  useEffect(() => {
    if (typeof amountPay !== "number" || isNaN(amountPay)) return;

    let timer;

    if (internalValue < amountPay) {
      timer = setInterval(() => {
        setInternalValue((prev) => {
          const nextValue = parseFloat((prev + STEP).toFixed(DECIMALS));
          if (nextValue >= amountPay) {
            clearInterval(timer);
            return amountPay;
          }
          return nextValue;
        });
      }, 50);
    } else if (internalValue !== amountPay) {
      setInternalValue(amountPay);
    }

    return () => clearInterval(timer);
  }, [amountPay, internalValue]);

  const handleInputChange = (e) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value) || value < MIN_AMOUNT) {
      value = MIN_AMOUNT;
    }
    setAmountPay(value);
  };

  const handleIncrement = () => {
    setAmountPay((prev) => parseFloat((prev + STEP).toFixed(DECIMALS)));
  };

  const handleDecrement = () => {
    setAmountPay((prev) =>
      prev > MIN_AMOUNT ? parseFloat((prev - STEP).toFixed(DECIMALS)) : MIN_AMOUNT
    );
  };

  const handleErase = () => {
    setAmountPay(MIN_AMOUNT);
  };

  const handleMax = () => {
    const maxValue = parseFloat(userBalance?.toFixed(6) || "0.00");
    setAmountPay(maxValue);
  };

  // 🎯 Percentage buttons handler (25%, 50%, 75%, MAX)
  const handlePercentage = (percent) => {
    const balance = parseFloat(userBalance || 0);
    if (balance > 0) {
      const calculatedAmount = parseFloat(((balance * percent) / 100).toFixed(DECIMALS));
      setAmountPay(Math.max(calculatedAmount, MIN_AMOUNT));
    }
  };

  const defaultValue = MIN_AMOUNT.toFixed(DECIMALS);
  const safeValue = isNaN(internalValue) || internalValue <= 0 ? defaultValue : internalValue.toFixed(DECIMALS);

  return (
    <div className="cosmic-input-container">
      <div className="cosmic-input-wrapper">
        <SmartTooltip content={`Investment Amount\nMin: ${MIN_AMOUNT} ${selectedToken}\nEnter the amount you wish to invest.`}>
          <input
            type="text"
            value={safeValue}
            onChange={handleInputChange}
            placeholder="0.00"
            className="cosmic-input"
          />
        </SmartTooltip>
      </div>

      {/* 🎯 NEW: Percentage Buttons Row (like DEXSwap) */}
      <div className="percentage-buttons-row">
        <SmartTooltip content={`Quick Select\n25% of your ${selectedToken} balance`}>
          <button 
            type="button" 
            onClick={() => handlePercentage(25)} 
            className="percentage-button"
          >
            25%
          </button>
        </SmartTooltip>
        <SmartTooltip content={`Quick Select\n50% of your ${selectedToken} balance`}>
          <button 
            type="button" 
            onClick={() => handlePercentage(50)} 
            className="percentage-button"
          >
            50%
          </button>
        </SmartTooltip>
        <SmartTooltip content={`Quick Select\n75% of your ${selectedToken} balance`}>
          <button 
            type="button" 
            onClick={() => handlePercentage(75)} 
            className="percentage-button"
          >
            75%
          </button>
        </SmartTooltip>
        <SmartTooltip content={`Max Balance\nInvest all available ${selectedToken}`}>
          <button 
            type="button" 
            onClick={handleMax} 
            className="percentage-button max-button"
          >
            MAX
          </button>
        </SmartTooltip>
      </div>

      {/* Keep old buttons for desktop (hidden on mobile) */}
      <div className="action-buttons desktop-only">
        <SmartTooltip content={`Decrease Amount\nStep: -${STEP} ${selectedToken}`}>
          <button type="button" onClick={handleDecrement} className="cosmic-button">
            <FaMinus />
          </button>
        </SmartTooltip>
        <SmartTooltip content={`Increase Amount\nStep: +${STEP} ${selectedToken}`}>
          <button type="button" onClick={handleIncrement} className="cosmic-button">
            <FaPlus />
          </button>
        </SmartTooltip>
        <SmartTooltip content="Reset to Minimum">
          <button type="button" onClick={handleErase} className="cosmic-button">
            <GiBroom />
          </button>
        </SmartTooltip>
      </div>
    </div>
  );
};

export default InputBox;

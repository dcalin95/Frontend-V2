// src/Presale/PaymentBox/InputBox.js

import React, { useEffect, useState } from "react";
import "./InputBox.css";
import { FaPlus, FaMinus } from "react-icons/fa";
import { GiBroom, GiWallet } from "react-icons/gi";
import SmartTooltip from "../components/SmartTooltip";
import PRESALE_CONFIG from "../../config/presaleConfig";

const InputBox = ({ amountPay, setAmountPay, userBalance, selectedToken, minAmountToken, minAmountDecimals }) => {
  // 🌟 Different minimum amounts and steps by token (from config)
  const DEFAULT_MIN = PRESALE_CONFIG.DEFAULT_MIN_AMOUNTS[selectedToken] || 0.01;
  const MIN_AMOUNT = typeof minAmountToken === 'number' && minAmountToken > 0 ? minAmountToken : DEFAULT_MIN;
  const STEP = PRESALE_CONFIG.STEP_AMOUNTS[selectedToken] || 0.01;
  const DEFAULT_DECIMALS = PRESALE_CONFIG.DECIMALS[selectedToken] || 2;
  const DECIMALS = typeof minAmountDecimals === 'number' ? Math.max(minAmountDecimals, DEFAULT_DECIMALS) : DEFAULT_DECIMALS;

  const [internalValue, setInternalValue] = useState(
    typeof amountPay === "number" && !isNaN(amountPay) ? amountPay : MIN_AMOUNT
  );

  // 🔥 FIX: Force correction if current amount is below minimum when minimum changes
  useEffect(() => {
    if (typeof amountPay === "number" && !isNaN(amountPay) && amountPay < MIN_AMOUNT) {
      console.warn("⚠️ [InputBox] Current amount", amountPay, "is below minimum", MIN_AMOUNT, "- auto-correcting!");
      setAmountPay(MIN_AMOUNT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [MIN_AMOUNT]); // Only when MIN_AMOUNT changes, not amountPay (to avoid loop)

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
    // 🔥 FIX: Normalize comma to dot for mobile keyboards (European locale)
    const normalizedValue = e.target.value.replace(/,/g, '.');
    
    console.log("⌨️ [handleInputChange] Input changed:");
    console.log("   - Raw value:", e.target.value);
    console.log("   - Normalized value:", normalizedValue);
    
    let value = parseFloat(normalizedValue);
    if (isNaN(value) || value < MIN_AMOUNT) {
      console.log("   - Value is invalid or below minimum, setting to:", MIN_AMOUNT);
      value = MIN_AMOUNT;
    } else {
      console.log("   - Final value to set:", value);
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
    
    console.log("🎯 [handlePercentage] Button clicked:");
    console.log("   - Requested percent:", percent);
    console.log("   - User balance (raw):", userBalance, "| type:", typeof userBalance);
    console.log("   - User balance (parsed):", balance);
    console.log("   - Selected token:", selectedToken);
    console.log("   - MIN_AMOUNT:", MIN_AMOUNT);
    console.log("   - DECIMALS:", DECIMALS);
    console.log("   - Device info:", {
      isMobile: document.body.classList.contains('mode-mobile'),
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    if (balance > 0) {
      const rawCalculation = (balance * percent) / 100;
      const calculatedAmount = parseFloat(rawCalculation.toFixed(DECIMALS));
      
      console.log("   - Raw calculation:", rawCalculation);
      console.log("   - Formula:", `(${balance} * ${percent}) / 100 = ${rawCalculation}`);
      console.log(`   - After toFixed(${DECIMALS}):`, calculatedAmount);
      console.log("   - Will compare:", calculatedAmount, "vs MIN_AMOUNT:", MIN_AMOUNT);
      console.log("   - Final amount (max of calculated or MIN):", Math.max(calculatedAmount, MIN_AMOUNT));
      
      const finalAmount = Math.max(calculatedAmount, MIN_AMOUNT);
      console.log("   - 🔥 SETTING amountPay to:", finalAmount);
      setAmountPay(finalAmount);
    } else {
      console.warn("⚠️ [handlePercentage] Balance is 0 or invalid!");
      console.warn("   - userBalance was:", userBalance);
      console.warn("   - parsed balance was:", balance);
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

      {/* 🎯 NEW: Min - 25% - 50% - 75% - MAX (ALL IN ONE ROW) */}
      <div className="percentage-buttons-row">
        <SmartTooltip content={`Reset to Minimum\n${MIN_AMOUNT} ${selectedToken}`}>
          <button 
            type="button" 
            onClick={handleErase} 
            className="percentage-button min-button"
          >
            MIN
          </button>
        </SmartTooltip>
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

      {/* Keep old +/- buttons for desktop ONLY (hidden on mobile) */}
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
      </div>
    </div>
  );
};

export default InputBox;

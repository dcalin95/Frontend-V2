import React, { useState } from "react";
import { toast } from "react-toastify";
import usePaymentState from "../../Presale/PaymentBox/hooks/usePaymentState";
import useHandleTransaction from "../../Presale/PaymentBox/useHandleTransaction";
import { tokenList } from "../../Presale/TokenHandlers/tokenData";

const CRYPTO_TOKENS = [
  { key: "ETH", name: "Ethereum", icon: "Ξ", color: "#627eea" },
  { key: "BNB", name: "BNB Smart Chain", icon: "B", color: "#f3ba2f" },
  { key: "USDT", name: "Tether USD", icon: "₮", color: "#26a17b" },
  { key: "USDC", name: "USD Coin", icon: "$", color: "#2775ca" },
  { key: "MATIC", name: "Polygon", icon: "◆", color: "#8247e5" },
  { key: "SOL", name: "Solana", icon: "◎", color: "#14f195" },
  { key: "STX", name: "Stacks (Bitcoin L2)", icon: "₿", color: "#f7931a" },
];

const CryptoBoxMobile = ({
  selectedToken,
  selectedChain,
  setSelectedToken,
  setSelectedChain,
  amountPay,
  setAmountPay,
  tokenPrices,
  walletAddress,
  onBack,
}) => {
  const [transactionHash, setTransactionHash] = useState(null);
  const [confirmedBits, setConfirmedBits] = useState(null);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  // 🎯 USE DESKTOP LOGIC - usePaymentState hook
  const paymentState = usePaymentState({
    selectedToken,
    selectedChain,
    amountPay,
    setAmountPay,
    tokenPrices,
    pricesLoading: false,
  });

  // 🚀 USE DESKTOP LOGIC - useHandleTransaction hook
  const { handleBuy } = useHandleTransaction({
    selectedToken,
    selectedChain,
    amountPay: paymentState.safeAmountPay,
    pureBits: paymentState.pureBits,
    usdValue: paymentState.usdValue,
    pricePerBitsUSD: paymentState.pricePerBitsUSD,
    selectedTokenPrice: paymentState.selectedTokenPrice,
    walletAddress: paymentState.walletAddress,
    balances: paymentState.balances,
    availableBits: paymentState.availableBits,
    setTransactionHash,
    setConfirmedBits,
    setPopupVisible,
    setIsConfirmed,
    bonusAmount: paymentState.bonusAmount,
    selectedPaymentMethod: null,
    referralCode: referralCode,
    stripeAmountEUR: undefined,
  });

  const handleBuyClick = async () => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!amountPay || amountPay <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Minimum amount check ($10 USD)
    if (paymentState.usdValue < 10) {
      toast.error("Minimum purchase is $10 USD");
      return;
    }

    if (paymentState.pureBits <= 0) {
      toast.error("Amount too small to receive BITS");
      return;
    }

    // Balance check (unless it's a fiat payment)
    const isFiatToken = ['NOWPAY', 'MOONPAY', 'TRANSAK', 'STRIPE'].includes(selectedToken);
    if (!isFiatToken && paymentState.balances[selectedToken] < amountPay) {
      toast.error(`Insufficient ${selectedToken} balance`);
      return;
    }

    try {
      await handleBuy();
      toast.success(`🎉 Payment successful!`);
      setAmountPay(0);
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(`Payment failed: ${error.message}`);
    }
  };

  const tokenPrice = tokenPrices[selectedToken] || 1;
  const usdValue = paymentState.usdValue || 0;
  const bitsToReceive = paymentState.pureBits || 0;
  const bonusAmount = paymentState.bonusAmount || 0;
  const totalBits = bitsToReceive + bonusAmount;

  return (
    <>
      {/* Back Button */}
      <button className="mobile-back-btn mobile-payment-option" onClick={onBack}>
        ← Back to Payment Methods
      </button>

      {/* Title Card */}
      <div className="mobile-payment-option">
        <div className="mobile-payment-content">
          <h3 className="mobile-payment-title">Pay with Crypto</h3>
          <p className="mobile-payment-desc">Select your preferred cryptocurrency</p>
        </div>
      </div>

      {/* Each Token = ONE card */}
      {CRYPTO_TOKENS.map((token) => {
        const isSelected = selectedToken === token.key;
        const price = tokenPrices[token.key] || 0;

        return (
          <button
            key={token.key}
            className="mobile-payment-option"
            onClick={() => {
              setSelectedToken(token.key);
              // Set correct chain based on token
              if (token.key === "BNB") {
                setSelectedChain("bsc");
              } else if (token.key === "SOL") {
                setSelectedChain("solana");
              } else if (token.key === "STX") {
                setSelectedChain("stacks");
              } else if (token.key === "MATIC") {
                setSelectedChain("polygon");
              } else {
                setSelectedChain("eth");
              }
            }}
            style={{ borderColor: isSelected ? token.color : 'rgba(0, 255, 163, 0.3)' }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `rgba(${parseInt(token.color.slice(1,3), 16)}, ${parseInt(token.color.slice(3,5), 16)}, ${parseInt(token.color.slice(5,7), 16)}, 0.1)`,
              color: token.color,
              fontSize: '24px',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              {token.icon}
            </div>
            <div className="mobile-payment-content">
              <div className="mobile-payment-title">{token.name}</div>
              <div className="mobile-payment-desc">
                ${price > 0 ? price.toFixed(2) : "..."}
              </div>
            </div>
            {isSelected && (
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: token.color,
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                ✓
              </div>
            )}
          </button>
        );
      })}

      {/* Amount Input - ONE card */}
      <div className="mobile-payment-option">
        <div className="mobile-payment-content" style={{flex: 1}}>
          <label className="mobile-payment-title" style={{display: 'block', marginBottom: '8px'}}>
            Amount ({selectedToken})
          </label>
          <input
            type="number"
            className="mobile-input"
            placeholder="0.00"
            value={amountPay || ""}
            onChange={(e) => setAmountPay(parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            style={{width: '100%'}}
          />
          {paymentState.balances[selectedToken] > 0 && (
            <div style={{marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right', opacity: 0.8}}>
              Balance: {paymentState.balances[selectedToken].toFixed(4)} {selectedToken}
            </div>
          )}
        </div>
      </div>

      {/* Referral Code - ONE card */}
      <div className="mobile-payment-option">
        <div className="mobile-payment-content" style={{flex: 1}}>
          <label className="mobile-payment-title" style={{display: 'block', marginBottom: '8px'}}>
            🎯 Referral Code (Optional)
          </label>
          <input
            type="text"
            className="mobile-input"
            placeholder="CODE-XXXXX"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            maxLength={20}
            style={{width: '100%'}}
          />
        </div>
      </div>

      {/* Summary - ONE card */}
      {amountPay > 0 && (
        <div className="mobile-payment-option">
          <div className="mobile-payment-content" style={{flex: 1}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)'}}>
              <span>USD Value:</span>
              <strong style={{color: 'var(--text-primary)'}}>${usdValue.toFixed(2)}</strong>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)'}}>
              <span>$BITS Price:</span>
              <strong style={{color: 'var(--text-primary)'}}>
                ${paymentState.pricePerBitsUSD < 1 ? paymentState.pricePerBitsUSD.toFixed(4) : paymentState.pricePerBitsUSD.toFixed(2)}
              </strong>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)'}}>
              <span>Base $BITS:</span>
              <strong style={{color: 'var(--text-primary)'}}>{bitsToReceive.toLocaleString()} $BITS</strong>
            </div>
            {bonusAmount > 0 && (
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: 'var(--solana-purple)'}}>
                <span>Bonus:</span>
                <strong>+{bonusAmount.toLocaleString()} $BITS</strong>
              </div>
            )}
            <div style={{display: 'flex', justifyContent: 'space-between', paddingTop: '15px', fontSize: '16px', color: 'var(--text-primary)', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
              <span>Total Receive:</span>
              <strong style={{
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: '18px'
              }}>
                {totalBits.toLocaleString()} $BITS
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Buy Button - ONE card */}
      <button
        className="mobile-payment-option"
        onClick={handleBuyClick}
        disabled={!paymentState.canProceed || paymentState.isLoading}
        style={{
          background: 'var(--gradient-primary)',
          borderColor: 'transparent',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          cursor: paymentState.canProceed && !paymentState.isLoading ? 'pointer' : 'not-allowed',
          opacity: paymentState.canProceed && !paymentState.isLoading ? 1 : 0.5
        }}
      >
        {paymentState.isLoading ? "Processing..." : `Buy ${totalBits.toLocaleString()} $BITS`}
      </button>

      {/* Error/Warning Messages - Each ONE card */}
      {!walletAddress && (
        <div className="mobile-payment-option" style={{borderColor: '#ff9800', color: '#ff9800'}}>
          ⚠️ Please connect your wallet to continue
        </div>
      )}
      {usdValue > 0 && usdValue < 10 && (
        <div className="mobile-payment-option" style={{borderColor: '#ff9800', color: '#ff9800'}}>
          ⚠️ Minimum purchase is $10 USD
        </div>
      )}
      {paymentState.transactionError && (
        <div className="mobile-payment-option" style={{borderColor: '#ef4444', color: '#ef4444'}}>
          ❌ {paymentState.transactionError}
        </div>
      )}
    </>
  );
};

export default CryptoBoxMobile;

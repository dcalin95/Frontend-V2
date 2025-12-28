import React, { useState } from "react";
import { toast } from "react-toastify";
import usePaymentState from "../../Presale/PaymentBox/hooks/usePaymentState";
import useHandleTransaction from "../../Presale/PaymentBox/useHandleTransaction";
import PaymentTitleBridgeMobile from "./PaymentTitleBridgeMobile";

const CRYPTO_TOKENS = [
  { key: "ETH", name: "Ethereum", img: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=026", color: "#627eea" },
  { key: "BNB", name: "BNB Chain", img: "https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=026", color: "#f3ba2f" },
  { key: "USDT", name: "Tether", img: "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=026", color: "#26a17b" },
  { key: "USDC", name: "USD Coin", img: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=026", color: "#2775ca" },
  { key: "MATIC", name: "Polygon", img: "https://cryptologos.cc/logos/polygon-matic-logo.svg?v=026", color: "#8247e5" },
  { key: "SOL", name: "Solana", img: "https://cryptologos.cc/logos/solana-sol-logo.svg?v=026", color: "#14f195" },
  { key: "LINK", name: "Chainlink", img: "https://cryptologos.cc/logos/chainlink-link-logo.svg?v=026", color: "#2a5ada" },
  { key: "BTCB", name: "Bitcoin BEP2", img: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=026", color: "#f7931a" },
  { key: "STX", name: "Stacks", img: "https://cryptologos.cc/logos/stacks-stx-logo.svg?v=026", color: "#5546ff" },
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
  const [, setTransactionHash] = useState(null);
  const [, setConfirmedBits] = useState(null);
  const [, setPopupVisible] = useState(false);
  const [, setIsConfirmed] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  const paymentState = usePaymentState({
    selectedToken,
    selectedChain,
    amountPay,
    setAmountPay,
    tokenPrices,
    pricesLoading: false,
  });

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

    if (paymentState.usdValue < 10) {
      toast.error("Minimum purchase is $10 USD");
      return;
    }

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

  const usdValue = paymentState.usdValue || 0;
  const bitsToReceive = paymentState.pureBits || 0;
  const bonusAmount = paymentState.bonusAmount || 0;
  const totalBits = bitsToReceive + bonusAmount;
  const selectedMeta = CRYPTO_TOKENS.find((t) => t.key === selectedToken);

  return (
    <>
      {/* Header Navigation */}
      <div style={{display: 'flex', alignItems: 'center', marginBottom: '20px'}}>
        <button 
          onClick={onBack}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: 'var(--text-secondary)',
            fontSize: '18px',
            padding: '8px 12px',
            cursor: 'pointer',
            marginRight: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h3 style={{
          margin: 0, 
          fontSize: '20px', 
          fontWeight: 'bold', 
          background: 'linear-gradient(135deg, #14f195, #00C2FF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Select Crypto
        </h3>
      </div>

      {/* 🤖 AI GRID LAYOUT FOR TOKENS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '25px'
      }}>
        {CRYPTO_TOKENS.map((token) => {
          const isSelected = selectedToken === token.key;
          const priceData = tokenPrices[token.key];
          const price = priceData?.price || priceData || 0; 
          const glowColor = isSelected ? token.color : 'transparent';
          const borderColor = isSelected ? token.color : 'rgba(255, 255, 255, 0.1)';
          
          return (
            <button
              key={token.key}
              onClick={() => {
                setSelectedToken(token.key);
                if (token.key === "BNB" || token.key === "BTCB" || token.key === "LINK") setSelectedChain("bsc");
                else if (token.key === "SOL") setSelectedChain("solana");
                else if (token.key === "STX") setSelectedChain("stacks");
                else if (token.key === "MATIC") setSelectedChain("polygon");
                else setSelectedChain("eth");
              }}
              style={{
                background: isSelected ? `rgba(${parseInt(token.color.slice(1,3), 16)}, ${parseInt(token.color.slice(3,5), 16)}, ${parseInt(token.color.slice(5,7), 16)}, 0.1)` : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${borderColor}`,
                borderRadius: '16px',
                padding: '15px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: isSelected ? `0 0 20px ${glowColor}30` : 'none',
                position: 'relative',
                minHeight: '110px'
              }}
            >
              {/* Token Icon - SVG Image */}
              <div style={{
                width: '44px',
                height: '44px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                filter: isSelected ? `drop-shadow(0 0 10px ${token.color})` : 'none',
                transition: 'all 0.3s ease'
              }}>
                <img 
                  src={token.img} 
                  alt={token.name} 
                  style={{
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    filter: isSelected ? 'none' : 'grayscale(100%) opacity(0.7)',
                    transition: 'all 0.3s ease'
                  }} 
                />
              </div>
              
              {/* Token Symbol */}
              <div style={{
                color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
                fontWeight: 'bold',
                fontSize: '16px',
                marginBottom: '4px'
              }}>
                {token.key}
              </div>

              {/* Price */}
              <div style={{
                fontSize: '12px',
                color: isSelected ? token.color : 'rgba(255,255,255,0.4)',
                fontFamily: 'monospace'
              }}>
                ${price > 0 ? price.toFixed(2) : "..."}
              </div>

              {/* Active Dot */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: token.color,
                  boxShadow: `0 0 10px ${token.color}`
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Input Section - Clean Card */}
      <div className="mobile-payment-option" style={{
        background: 'linear-gradient(180deg, rgba(20, 241, 149, 0.05) 0%, rgba(20, 241, 149, 0.02) 100%)',
        border: '1px solid rgba(20, 241, 149, 0.3)',
        padding: '20px'
      }}>
        <div className="mobile-payment-content" style={{flex: 1}}>
          <PaymentTitleBridgeMobile
            payTokenLabel={selectedToken}
            payTokenIconSrc={selectedMeta?.img}
          />
          <label className="mobile-payment-title" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#14f195'}}>
            <span>How much {selectedToken}?</span>
            <span style={{fontSize: '12px', color: 'rgba(255,255,255,0.6)'}}>Min: $10 USD</span>
          </label>
          <div style={{position: 'relative'}}>
            <input
              type="number"
              className="mobile-input"
              placeholder="0.00"
              value={amountPay}
              onChange={(e) => setAmountPay(e.target.value)}
              min="0"
              step="0.000001"
              style={{
                width: '100%', 
                fontSize: '24px', 
                padding: '15px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(20, 241, 149, 0.3)',
                borderRadius: '12px',
                color: '#fff',
                outline: 'none'
              }}
            />
            {paymentState.balances[selectedToken] > 0 && (
                <div style={{
                    position: 'absolute', 
                    right: '10px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    fontSize: '12px', 
                    color: 'rgba(255,255,255,0.5)',
                    background: 'rgba(0,0,0,0.5)',
                    padding: '4px 8px',
                    borderRadius: '6px'
                }}>
                  Bal: {paymentState.balances[selectedToken].toFixed(4)}
                </div>
            )}
          </div>
          
          {amountPay && parseFloat(amountPay) > 0 && usdValue < 10 && (
             <div style={{marginTop: '8px', fontSize: '12px', color: '#ff9800', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px'}}>
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
               Min $10 USD (~{(10 / (tokenPrices[selectedToken]||1)).toFixed(4)} {selectedToken})
             </div>
          )}
        </div>
      </div>

      {/* Referral (Optional) */}
      <div style={{marginTop: '15px', marginBottom: '20px'}}>
        <input
          type="text"
          className="mobile-input"
          placeholder="Referral Code (Optional)"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          style={{
            width: '100%',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '14px',
            padding: '12px',
            borderRadius: '12px',
            color: '#fff'
          }}
        />
      </div>

      {/* Summary Card */}
      {amountPay > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          background: 'rgba(20, 241, 149, 0.05)',
          border: '1px solid rgba(20, 241, 149, 0.2)',
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(20,241,149,0.1) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: 'rgba(255,255,255,0.7)'}}>
            <span>USD Value</span>
            <span style={{color: '#fff', fontWeight: 'bold'}}>${usdValue.toFixed(2)}</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: 'rgba(255,255,255,0.7)'}}>
            <span>Receive</span>
            <span style={{color: '#14f195', fontWeight: 'bold'}}>{bitsToReceive.toLocaleString()} $BITS</span>
          </div>
          {bonusAmount > 0 && (
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#d946ef'}}>
              <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                Bonus
              </span>
              <span style={{fontWeight: 'bold'}}>+{bonusAmount.toLocaleString()} $BITS</span>
            </div>
          )}
          <div style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '15px', 
            paddingTop: '15px', 
            borderTop: '1px solid rgba(20, 241, 149, 0.2)',
            fontSize: '18px',
            fontWeight: 'bold',
            alignItems: 'center'
          }}>
            <span>Total</span>
            <span style={{
              fontSize: '24px',
              background: 'linear-gradient(90deg, #14f195, #00C2FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {totalBits.toLocaleString()} $BITS
            </span>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleBuyClick}
        disabled={!paymentState.canProceed || paymentState.isLoading}
        style={{
          width: '100%',
          marginTop: '25px',
          padding: '18px',
          background: paymentState.canProceed ? 'linear-gradient(90deg, #14f195, #00C2FF)' : 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '16px',
          color: paymentState.canProceed ? '#000' : 'rgba(255,255,255,0.3)',
          fontWeight: 'bold',
          fontSize: '18px',
          cursor: paymentState.canProceed ? 'pointer' : 'not-allowed',
          opacity: paymentState.isLoading ? 0.7 : 1,
          boxShadow: paymentState.canProceed ? '0 0 30px rgba(20, 241, 149, 0.4)' : 'none',
          transition: 'all 0.3s ease'
        }}
      >
        {paymentState.isLoading ? (
            <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                <div className="loading-spinner" style={{width: '20px', height: '20px', borderTopColor: '#000'}}></div>
                Processing...
            </span>
        ) : "BUY NOW"}
      </button>
    </>
  );
};

export default CryptoBoxMobile;

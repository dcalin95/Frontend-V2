import React, { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import usePaymentState from "../../Presale/PaymentBox/hooks/usePaymentState";
import useHandleTransaction from "../../Presale/PaymentBox/useHandleTransaction";
import PaymentTitleBridgeMobile from "./PaymentTitleBridgeMobile";
import { useWallet } from "../../context/WalletContext";

const CRYPTO_TOKENS = [
  { key: "ETH", name: "Ethereum", img: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=026", color: "#627eea" },
  { key: "BNB", name: "BNB Chain", img: "https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=026", color: "#f3ba2f" },
  { key: "USDT", name: "Tether", img: "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=026", color: "#26a17b" },
  { key: "USDC", name: "USD Coin", img: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=026", color: "#2775ca" },
  { key: "MATIC", name: "Polygon", img: "https://cryptologos.cc/logos/polygon-matic-logo.svg?v=026", color: "#8247e5" },
  { key: "SOL", name: "Solana", img: "https://cryptologos.cc/logos/solana-sol-logo.svg?v=026", color: "#14f195" },
  { key: "LINK", name: "Chainlink", img: "https://cryptologos.cc/logos/chainlink-link-logo.svg?v=026", color: "#2a5ada" },
  { key: "BTCB", name: "Bitcoin BEP2", img: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=026", color: "#f7931a" },
  // STX removed - not functional on mobile
];

// 💰 Quick Buy Presets (USD amounts)
const QUICK_BUY_PRESETS = [
  { usdAmount: 10, label: "Entry", icon: "🌱" },
  { usdAmount: 50, label: "Starter", icon: "🚀" },
  { usdAmount: 100, label: "Trader", icon: "⭐" },
  { usdAmount: 500, label: "Pro", icon: "💎" },
  { usdAmount: 1000, label: "Whale", icon: "🐋" },
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
  const { setShowWalletModal } = useWallet();
  const [, setTransactionHash] = useState(null);
  const [, setConfirmedBits] = useState(null);
  const [, setPopupVisible] = useState(false);
  const [, setIsConfirmed] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  
  // 🟣 SOL-only: receiving wallet on BSC/EVM (0x...)
  const [solReceivingEvmWallet, setSolReceivingEvmWallet] = useState("");
  const [solReceivingTouched, setSolReceivingTouched] = useState(false);

  const paymentState = usePaymentState({
    selectedToken,
    selectedChain,
    amountPay,
    setAmountPay,
    tokenPrices,
    pricesLoading: false,
  });

  // Auto-fill EVM wallet if available
  useEffect(() => {
    if (selectedToken !== "SOL") return;
    if (solReceivingTouched) return;
    const w = (paymentState.walletAddress || "").toString().trim();
    if (w && w.startsWith('0x') && ethers.utils.isAddress(w)) {
      setSolReceivingEvmWallet(w);
    } else {
      setSolReceivingEvmWallet("");
    }
  }, [selectedToken, paymentState.walletAddress, solReceivingTouched]);

  const isValidEvmWallet = useMemo(() => {
    const w = (solReceivingEvmWallet || "").toString().trim();
    try {
      return !!w && ethers.utils.isAddress(w);
    } catch (_) {
      return false;
    }
  }, [solReceivingEvmWallet]);

  const effectiveEvmWallet = useMemo(() => {
    if (selectedToken === "SOL") {
      return (solReceivingEvmWallet || "").toString().trim();
    }
    return paymentState.walletAddress;
  }, [selectedToken, solReceivingEvmWallet, paymentState.walletAddress]);

  const { handleBuy } = useHandleTransaction({
    selectedToken,
    selectedChain,
    amountPay: paymentState.safeAmountPay,
    pureBits: paymentState.pureBits,
    usdValue: paymentState.usdValue,
    pricePerBitsUSD: paymentState.pricePerBitsUSD,
    selectedTokenPrice: paymentState.selectedTokenPrice,
    walletAddress: effectiveEvmWallet,
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
    signer: paymentState.signer,
    provider: paymentState.provider,
  });

  const handleBuyClick = async () => {
    if (!walletAddress) {
      // Show wallet modal instead of just error
      setShowWalletModal(true);
      toast.info("Please connect your wallet to continue");
      return;
    }

    if (selectedToken === "SOL" && !isValidEvmWallet) {
      toast.error("Please enter a valid BSC/EVM receiving address (0x...)");
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
      setAmountPay("");
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
  
  // Safe check for amountPay display
  const displayAmount = amountPay && !isNaN(parseFloat(amountPay)) ? parseFloat(amountPay) : 0;

  return (
    <>
      {/* Header Navigation */}
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'}}>
        <div style={{display: 'flex', alignItems: 'center'}}>
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
        {!walletAddress && (
          <button
            onClick={() => setShowWalletModal(true)}
            style={{
              background: 'linear-gradient(135deg, #14f195, #00C2FF)',
              border: 'none',
              borderRadius: '12px',
              color: '#000',
              fontSize: '14px',
              fontWeight: 'bold',
              padding: '10px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 15px rgba(20, 241, 149, 0.3)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7M21 3l-9 9M15 3h6v6"></path>
            </svg>
            Connect
          </button>
        )}
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
                else if (token.key === "MATIC") setSelectedChain("polygon");
                else setSelectedChain("eth");
              }}
              style={{
                background: isSelected ? `rgba(${parseInt(token.color.slice(1,3), 16)}, ${parseInt(token.color.slice(3,5), 16)}, ${parseInt(token.color.slice(5,7), 16)}, 0.1)` : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${borderColor}`,
                borderRadius: '16px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: isSelected ? `0 0 20px ${glowColor}30` : 'none',
                position: 'relative',
                minHeight: '120px' // ✅ Increased for better touch targets
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
                fontSize: '28px', // ✅ Increased from 24px for better mobile UX
                padding: '18px', // ✅ Increased padding for better touch
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
          
          {/* 💰 QUICK BUY PRESETS (USD Amounts) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
            marginTop: '12px'
          }}>
            {QUICK_BUY_PRESETS.map((preset) => {
              const tokenPrice = tokenPrices[selectedToken]?.price || tokenPrices[selectedToken] || 0;
              const tokenAmount = tokenPrice > 0 ? (preset.usdAmount / tokenPrice).toFixed(6) : '0';
              const isSelected = parseFloat(amountPay) === parseFloat(tokenAmount);
              
              return (
                <button
                  key={preset.usdAmount}
                  onClick={() => setAmountPay(tokenAmount)}
                  style={{
                    padding: '12px 6px',
                    background: isSelected ? 'rgba(20, 241, 149, 0.2)' : 'rgba(20, 241, 149, 0.1)',
                    border: `1px solid ${isSelected ? '#14f195' : 'rgba(20, 241, 149, 0.3)'}`,
                    borderRadius: '10px',
                    color: '#14f195',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: isSelected ? '0 0 10px rgba(20, 241, 149, 0.4)' : 'none'
                  }}
                >
                  <span style={{fontSize: '16px'}}>{preset.icon}</span>
                  <span>${preset.usdAmount}</span>
                </button>
              );
            })}
          </div>

          {/* PERCENTAGE BUTTONS - MOBILE (Balance-based) */}
          {paymentState.balances[selectedToken] > 0 && (
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '12px',
              justifyContent: 'space-between'
            }}>
              {[
                { label: '25%', value: 0.25 },
                { label: '50%', value: 0.50 },
                { label: '75%', value: 0.75 },
                { label: 'MAX', value: 1.0 }
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={() => {
                    const balance = paymentState.balances[selectedToken] || 0;
                    const calculated = (balance * btn.value).toFixed(6);
                    setAmountPay(calculated);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    background: 'rgba(153, 69, 255, 0.1)',
                    border: '1px solid rgba(153, 69, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#9945ff',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}
          
          {amountPay && parseFloat(amountPay) > 0 && usdValue < 10 && !isNaN(usdValue) && (
             <div style={{marginTop: '8px', fontSize: '12px', color: '#ff9800', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px'}}>
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
               Min $10 USD (~{(10 / ((tokenPrices[selectedToken]?.price || tokenPrices[selectedToken]) || 1)).toFixed(4)} {selectedToken})
             </div>
          )}
        </div>
      </div>

      {/* Referral (Optional) */}
      <div style={{marginTop: '15px', marginBottom: '10px'}}>
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

      {/* 🟣 SOL: receiving wallet (BSC/EVM) */}
      {selectedToken === "SOL" && (
        <div style={{marginTop: '10px', marginBottom: '20px'}}>
          <label style={{display: 'block', fontSize: '12px', color: '#14f195', marginBottom: '8px', fontWeight: 'bold'}}>
            🟣 Receive BITS on (BSC / EVM wallet 0x…)
          </label>
          <input
            type="text"
            placeholder="Paste your EVM wallet address (0x...)"
            value={solReceivingEvmWallet}
            onChange={(e) => {
              setSolReceivingTouched(true);
              setSolReceivingEvmWallet(e.target.value.trim());
            }}
            style={{
              width: '100%',
              background: 'rgba(20, 241, 149, 0.05)',
              border: `1px solid ${isValidEvmWallet ? 'rgba(20, 241, 149, 0.5)' : 'rgba(255, 107, 107, 0.5)'}`,
              fontSize: '14px',
              padding: '12px',
              borderRadius: '12px',
              color: '#fff',
              outline: 'none'
            }}
          />
          <div style={{fontSize: '11px', marginTop: '6px', color: isValidEvmWallet ? 'rgba(255,255,255,0.6)' : '#ff6b6b'}}>
            {isValidEvmWallet ? (
              <>✅ Receiving wallet set: <strong>{solReceivingEvmWallet.slice(0,6)}...{solReceivingEvmWallet.slice(-4)}</strong></>
            ) : (
              <>⚠️ Required: enter a valid <strong>0x…</strong> address to receive your BITS tokens on BSC.</>
            )}
          </div>
        </div>
      )}

      {/* 💰 Real-Time Calculator Card - Shows BITS you'll receive */}
      {amountPay && parseFloat(amountPay) > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '22px',
          background: 'linear-gradient(180deg, rgba(20, 241, 149, 0.1) 0%, rgba(20, 241, 149, 0.05) 100%)',
          border: '2px solid rgba(20, 241, 149, 0.3)',
          borderRadius: '18px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(20, 241, 149, 0.2)'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '250px',
            height: '250px',
            background: 'radial-gradient(circle, rgba(20,241,149,0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          
          {/* Main Display - Large BITS Amount */}
          <div style={{textAlign: 'center', marginBottom: '20px'}}>
            <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px'}}>
              You Will Receive
            </div>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #14f195, #00C2FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 20px rgba(20, 241, 149, 0.3)'
            }}>
              {totalBits.toLocaleString()} $BITS
            </div>
            {bonusAmount > 0 && (
              <div style={{fontSize: '14px', color: '#d946ef', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                <span>+{bonusAmount.toLocaleString()} Bonus</span>
              </div>
            )}
          </div>
          
          {/* Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            paddingTop: '18px',
            borderTop: '1px solid rgba(20, 241, 149, 0.2)'
          }}>
            <div>
              <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px'}}>USD Value</div>
              <div style={{fontSize: '16px', color: '#fff', fontWeight: 'bold'}}>${usdValue.toFixed(2)}</div>
            </div>
            <div>
              <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px'}}>Base BITS</div>
              <div style={{fontSize: '16px', color: '#14f195', fontWeight: 'bold'}}>{bitsToReceive.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Button - Larger for Mobile Touch */}
      <button
        onClick={handleBuyClick}
        disabled={!paymentState.canProceed || paymentState.isLoading}
        style={{
          width: '100%',
          marginTop: '25px',
          padding: '22px', // ✅ Increased from 18px
          minHeight: '64px', // ✅ Minimum height for better touch targets
          background: paymentState.canProceed ? 'linear-gradient(90deg, #14f195, #00C2FF)' : 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '16px',
          color: paymentState.canProceed ? '#000' : 'rgba(255,255,255,0.3)',
          fontWeight: 'bold',
          fontSize: '20px', // ✅ Increased from 18px
          cursor: paymentState.canProceed ? 'pointer' : 'not-allowed',
          opacity: paymentState.isLoading ? 0.7 : 1,
          boxShadow: paymentState.canProceed ? '0 0 30px rgba(20, 241, 149, 0.4)' : 'none',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}
      >
        {paymentState.isLoading ? (
            <>
                <div className="loading-spinner" style={{width: '24px', height: '24px', borderTopColor: '#000', borderWidth: '3px'}}></div>
                <span>Processing...</span>
            </>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <span>BUY NOW</span>
          </>
        )}
      </button>
    </>
  );
};

export default CryptoBoxMobile;

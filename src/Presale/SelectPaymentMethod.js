import React from "react";
import "./SelectPaymentMethod.css";
import { tokenList } from "./TokenHandlers/tokenData";
import evmIcon from "../assets/icons/evm-logo.jpg";
import solanaIcon from "../assets/icons/solana-logo.png";
import cardIcon from "../assets/icons/card-logo.jpg"; // 💳 Adaugă iconița local
import SmartTooltip from "./components/SmartTooltip";

const SelectPaymentMethod = ({
  selectedToken,
  onSelectToken,
  selectedChain,
  onSelectChain,
  tokenPrices // 💲 Received from parent
}) => {
  const isStripeSelected = selectedToken === "STRIPE";

  const filteredTokens = tokenList.filter((token) => {
    if (token.key === "STRIPE") return false;
    return token.chain === selectedChain;
  });

  const handleSelectChain = (chain) => {
    onSelectChain(chain);
    if (chain !== "fiat") {
      const firstToken = tokenList.find((token) => token.chain === chain);
      if (firstToken && selectedToken !== firstToken.key) {
        onSelectToken(firstToken.key);
      }
    } else if (!isStripeSelected && selectedToken === "STRIPE") {
      const fallback = tokenList.find(
        (token) => token.chain === "fiat" && token.key !== "STRIPE"
      );
      if (fallback) onSelectToken(fallback.key);
    }
  };

  const handleSelectStripe = () => {
    onSelectChain("fiat");
    if (selectedToken !== "STRIPE") {
      onSelectToken("STRIPE");
    }
  };

  // Helper to get price safely
  const getTokenPrice = (tokenKey) => {
    if (!tokenPrices) return null;
    // Mapping keys if necessary (e.g. ETH -> ETH)
    // Assuming tokenPrices uses the same keys as tokenList
    const tokenData = tokenPrices[tokenKey] || tokenPrices[tokenKey.toUpperCase()];
    
    // 🔧 FIX: Extract numeric price from object { price: 123, source: '...' }
    let priceValue = null;
    if (typeof tokenData === 'object' && tokenData !== null && 'price' in tokenData) {
      priceValue = tokenData.price;
    } else if (typeof tokenData === 'number') {
      priceValue = tokenData;
    }

    if (priceValue) {
        // Format logic: if < $1 show 4 decimals, else 2 decimals
        return priceValue < 1 
            ? `$${priceValue.toFixed(4)}` 
            : `$${priceValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    return null;
  };

  return (
    <div className="token-selector">
      <h2 className="payment-method-title">With What Do You Want to Pay</h2>

      {/* === Tab-uri EVM / Solana / Fiat === */}
      <div className="chain-toggle">
        <SmartTooltip content={`EVM Networks\nBinance Smart Chain (BSC), Ethereum, Polygon, Avalanche\nUse MetaMask or WalletConnect.`}>
          <button
            className={`chain-tab ${selectedChain === "evm" ? "active" : ""}`}
            onClick={() => handleSelectChain("evm")}
          >
            <img src={evmIcon} alt="EVM" className="chain-icon" />
            EVM
          </button>
        </SmartTooltip>

        <SmartTooltip content={`Solana Network\nHigh-speed, low-cost transactions.\nUse Phantom or Solflare wallet.`}>
          <button
            className={`chain-tab ${selectedChain === "solana" ? "active" : ""}`}
            onClick={() => handleSelectChain("solana")}
          >
            <img src={solanaIcon} alt="Solana" className="chain-icon" />
            Solana
          </button>
        </SmartTooltip>

        <SmartTooltip content={`Secure Card Payment\nBuy directly with Visa/Mastercard via Stripe.\nIncludes BitSwapDEX AI Education access + $BITS tokens.`}>
          <button
            className={`chain-tab chain-tab--stripe ${
              isStripeSelected ? "active" : ""
            }`}
            onClick={handleSelectStripe}
          >
            <img src={cardIcon} alt="Stripe" className="chain-icon" />
            Stripe Card
          </button>
        </SmartTooltip>

        <SmartTooltip content={`Fiat Options\nOther fiat payment gateways if Stripe is unavailable.`}>
          <button
            className={`chain-tab ${
              selectedChain === "fiat" && !isStripeSelected ? "active" : ""
            }`}
            onClick={() => {
              onSelectChain("fiat");
              // 🔄 Force reset selection to first non-Stripe Fiat token
              const fallback = tokenList.find(
                (token) => token.chain === "fiat" && token.key !== "STRIPE"
              );
              if (fallback) onSelectToken(fallback.key);
            }}
          >
            <img src={cardIcon} alt="Fiat" className="chain-icon" />
            Fiat
          </button>
        </SmartTooltip>
      </div>

      {/* === Token Buttons (filtered by chain) === */}
      <div className="token-grid">
        {isStripeSelected ? (
          // 💳 Stripe Selected View
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '16px 24px',
            background: 'rgba(99, 91, 255, 0.1)', // Cleaner background
            border: '1px solid #635bff',
            borderRadius: '12px',
            color: '#fff',
            marginTop: '10px',
            width: '100%',
            maxWidth: '400px',
            margin: '10px auto 0',
            boxShadow: '0 4px 20px rgba(99, 91, 255, 0.2)'
          }}>
            <img src={cardIcon} alt="Stripe" style={{width: '32px', height: '32px', borderRadius: '50%'}} />
            <div style={{textAlign: 'left'}}>
              <div style={{fontSize: '1.1rem', fontWeight: '700', color: '#fff', fontFamily: 'Space Grotesk, sans-serif'}}>Stripe Secure Checkout</div>
              <div style={{fontSize: '0.85rem', opacity: 0.8, fontFamily: 'Inter, sans-serif'}}>Credit/Debit Card selected. Continue below.</div>
            </div>
          </div>
        ) : (
          // 💱 Standard Token Grid
          filteredTokens.map((token) => {
            const price = getTokenPrice(token.key);
            
            return (
              <SmartTooltip 
                key={token.key} 
                content={`${token.name} (${token.symbol})\nPrice: ${price || 'Updating...'}\nChain: ${token.chain === 'evm' ? 'BSC/ETH' : token.chain === 'solana' ? 'Solana' : 'Fiat'}\n${token.chain === 'solana' ? 'Gas Fee: <$0.001' : token.chain === 'evm' ? 'Gas Fee: ~$0.05 (BSC)' : 'No Gas Fee'}`}
              >
                <button
                  className={`token-button ${
                    selectedToken === token.key ? "active" : ""
                  }`}
                  onClick={() => onSelectToken(token.key)}
                  style={{
                    borderColor: selectedToken === token.key ? token.color : "rgba(255,255,255,0.1)",
                  }}
                >
                  <div className="token-btn-content">
                    <img
                      src={token.icon}
                      alt={`${token.name} icon`}
                      className="token-icon"
                    />
                    <div className="token-text-col">
                      <span className="token-name">{token.name}</span>
                      {price && (
                        <span className="token-live-price" style={{ color: selectedToken === token.key ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                          {price}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </SmartTooltip>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SelectPaymentMethod;

import React, { useState } from "react";
import { trackTikTokEvent } from "../../utils/tiktok";
import usePaymentState from "./hooks/usePaymentState";
import useHandleTransaction from "./useHandleTransaction";
import PaymentSummary from "./PaymentSummary";
import InputBox from "./InputBox";
import TransactionPopup from "../TransactionPopup";
import PaymentTitle from "./components/PaymentTitle";
import PriceInfo from "./components/PriceInfo";
import PaymentLoading from "./components/PaymentLoading";
import PaymentError from "./components/PaymentError";
import PaymentMethodSelector from "./PaymentMethodSelector";
import StripeAmountSelector from "./components/StripeAmountSelector";
import { tokenList } from "../TokenHandlers/tokenData";
import useCellManagerData from "../hooks/useCellManagerData";
// Import separated styles
import "./PaymentBox.desktop.css";
import "./PaymentBox.mobile.css";

const PaymentBox = ({
  selectedToken,
  selectedChain,
  amountPay,
  setAmountPay,
  tokenPrices,
  pricesLoading,
}) => {
  // 🎯 Custom Hook pentru toată logica de state
  const paymentState = usePaymentState({
    selectedToken,
    selectedChain,
    amountPay,
    setAmountPay,
    tokenPrices,
    pricesLoading,
  });

  // 📊 Transaction States
  const [transactionHash, setTransactionHash] = useState(null);
  const [confirmedBits, setConfirmedBits] = useState(null);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // 💳 Payment Method Selection States
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);

  // 💳 Stripe specific state
  const isStripeToken = selectedToken === "STRIPE";
  const [stripeAmountEUR, setStripeAmountEUR] = useState(10);
  const [eurUsdRate, setEurUsdRate] = useState(1);
  const [isRateLoading, setIsRateLoading] = useState(false);
  const [rateError, setRateError] = useState(null);
  const selectedTokenInfo = React.useMemo(
    () => tokenList.find((token) => token.key === selectedToken),
    [selectedToken]
  );
  const selectedTokenLabel = selectedTokenInfo?.name || selectedToken;
  const bitsUnitPriceUSD =
    paymentState.pricePerBitsUSD && paymentState.pricePerBitsUSD > 0
      ? paymentState.pricePerBitsUSD
      : 0.001;
  const cellManagerData = useCellManagerData();
  const liveBitsPrice = cellManagerData?.currentPrice;
  const displayBitsPriceUSD =
    liveBitsPrice && liveBitsPrice > 0 ? liveBitsPrice : bitsUnitPriceUSD;
  
  // 🎯 Referral Code State
  const [referralCode, setReferralCode] = useState("");
  // const tikTokTrackedRef = React.useRef(false);

  // 🔍 Auto-detect referral code from URL
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromURL = urlParams.get("ref");
    if (codeFromURL) {
      setReferralCode(codeFromURL);
      console.log("🎯 Auto-detected referral code from URL:", codeFromURL);
    }
  }, []);

  // 🔄 Reset payment method when token changes
  React.useEffect(() => {
    console.log("🔄 [RESET] useEffect triggered - selectedToken changed to:", selectedToken);
    console.log("🔄 [RESET] Before reset - selectedPaymentMethod:", selectedPaymentMethod);
    console.log("🔄 [RESET] Before reset - showPaymentSelector:", showPaymentSelector);
    
    setSelectedPaymentMethod(null);
    setShowPaymentSelector(false);
    
    console.log("🔄 [RESET] After reset commands executed");
    
    // Verify reset after state update
    setTimeout(() => {
      console.log("🔄 [RESET] State after timeout - selectedPaymentMethod should be null");
    }, 100);
  }, [selectedToken]);

  React.useEffect(() => {
    if (!isStripeToken) return;

    setShowPaymentSelector(false);
    setSelectedPaymentMethod({
      id: "stripe_checkout",
      name: "Stripe Card Checkout",
      available: true,
      icon: "💳",
      fees: "Standard Stripe fees",
      processingTime: "Instant",
    });
  }, [isStripeToken]);

  React.useEffect(() => {
    if (!isStripeToken) return;

    let ignore = false;
    const fetchRate = async () => {
      setIsRateLoading(true);
      setRateError(null);
      try {
        const response = await fetch(
          "https://api.exchangerate.host/latest?base=EUR&symbols=USD"
        );
        if (!response.ok) {
          throw new Error(`Rate fetch failed with ${response.status}`);
        }
        const json = await response.json();
        if (!ignore) {
          const rate = json?.rates?.USD || 1;
          setEurUsdRate(rate);
        }
      } catch (err) {
        console.error("⚠️ Failed to fetch EUR→USD rate:", err);
        if (!ignore) {
          setRateError(err.message || "Rate fetch failed");
          setEurUsdRate(1);
        }
      } finally {
        if (!ignore) setIsRateLoading(false);
      }
    };

    fetchRate();
    return () => {
      ignore = true;
    };
  }, [isStripeToken]);

  React.useEffect(() => {
    if (!isStripeToken) return;
    const rate = eurUsdRate || 1;
    const usdAmount = parseFloat((stripeAmountEUR * rate).toFixed(2));
    if (Number.isFinite(usdAmount) && usdAmount !== amountPay) {
      setAmountPay(usdAmount);
    }
  }, [isStripeToken, stripeAmountEUR, eurUsdRate, amountPay, setAmountPay]);

  // 🚀 Transaction Handler
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
    selectedPaymentMethod: selectedPaymentMethod,
    referralCode: referralCode, // 🎯 Pass referral code to handler
    stripeAmountEUR: isStripeToken ? stripeAmountEUR : undefined,
  });

  const handleClosePopup = () => {
    setPopupVisible(false);
    setTransactionHash(null);
    setConfirmedBits(null);
    setIsConfirmed(false);
    // if (tikTokTrackedRef.current) tikTokTrackedRef.current = false;
  };

  // TikTok payment tracking intentionally removed (privacy & business readiness)

  // 💳 Check if we need to show payment method selector
  const isFiatToken = ['NOWPAY', 'MOONPAY', 'TRANSAK', 'STRIPE'].includes(selectedToken);
  const shouldShowSelector = isFiatToken && paymentState.safeAmountPay > 0;

  // 💳 Handle payment method selection
  const handlePaymentMethodSelect = (method) => {
    console.log("🎯 [PaymentBox] handlePaymentMethodSelect called with:", method);
    console.log("🎯 [PaymentBox] Current selectedPaymentMethod:", selectedPaymentMethod);
    console.log("🎯 [PaymentBox] Is final confirmation?:", selectedPaymentMethod && selectedPaymentMethod.id === method.id);
    
    // If this is the final confirmation (Continue button), proceed with payment
    if (selectedPaymentMethod && selectedPaymentMethod.id === method.id) {
      console.log("🎯 [PaymentBox] Final confirmation - hiding selector");
      setShowPaymentSelector(false); // Hide selector after final confirmation
      setSelectedPaymentMethod(method);
    } else {
      console.log("🎯 [PaymentBox] First selection - keeping selector visible");
      // First selection - just set the method, keep selector visible for confirmation
      setSelectedPaymentMethod(method);
    }
    
    console.log("🎯 [PaymentBox] After selection - selectedPaymentMethod will be:", method);
  };

  // 💳 Handle proceed to payment selection
  const handleProceedToPayment = () => {
    if (isFiatToken && paymentState.safeAmountPay > 0) {
      setShowPaymentSelector(true);
    }
  };

  // 🎯 Loading State
  if (paymentState.isLoading) {
    return (
      <div className="payment-box">
        <PaymentLoading 
          isLoading={paymentState.isLoading}
          transactionStep={paymentState.transactionStep}
          isProcessingTransaction={paymentState.isProcessingTransaction}
        />
      </div>
    );
  }

  // 🔢 Dynamic minimum in token for $10
  const minUsd = 10;
  const price = Number(paymentState.selectedTokenPrice) || 0;
  let minTokenNumber = null;
  let minTokenDecimals = 2;
  let minTokenExtraNumber = null;
  if (price > 0) {
    const raw = minUsd / price;
    if (raw < 1) minTokenDecimals = 3;
    if (raw < 0.1) minTokenDecimals = 4;
    if (raw < 0.01) minTokenDecimals = 5;
    if (raw < 0.001) minTokenDecimals = 6;
    const factor = Math.pow(10, minTokenDecimals);
    const roundedUp = Math.ceil(raw * factor) / factor;
    minTokenNumber = roundedUp;
    minTokenExtraNumber = roundedUp;
  }

  return (
    <div className="payment-box">
      {/* 🎯 Transaction Popup */}
      <TransactionPopup
        visible={isPopupVisible}
        txHash={transactionHash}
        bits={confirmedBits}
        token={selectedToken}
        amount={paymentState.safeAmountPay}
        walletAddress={paymentState.walletAddress}
        isConfirmed={isConfirmed}
        onClose={handleClosePopup}
      />

      {/* 🎯 Error Display */}
      <PaymentError 
        error={paymentState.transactionError}
        onRetry={() => paymentState.setTransactionError(null)}
      />

      {/* 🎯 Payment Title */}
      <PaymentTitle
        selectedTokenKey={selectedToken}
        selectedTokenLabel={selectedTokenLabel}
        selectedTokenIcon={paymentState.selectedTokenIcon}
      />

      {/* 🎯 Price Information */}
      <PriceInfo
        selectedTokenKey={selectedToken}
        selectedTokenLabel={selectedTokenLabel}
        selectedTokenIcon={paymentState.selectedTokenIcon}
        bitsPriceUSD={displayBitsPriceUSD}
        selectedTokenPrice={paymentState.selectedTokenPrice}
        bitsLoading={paymentState.isLoading}
        priceError={paymentState.priceError}
      />

      {isStripeToken ? (
        <>
          <StripeAmountSelector
            selectedAmountEUR={stripeAmountEUR}
            onSelectAmount={setStripeAmountEUR}
            eurToUsdRate={eurUsdRate}
            isRateLoading={isRateLoading}
            rateError={rateError}
            bitsPriceUSD={displayBitsPriceUSD}
          />
          <div className="min-purchase-note">
            <span className="min-note-icon" aria-hidden>ℹ️</span>
            <span>
              Choose a fixed Stripe package (minimum €10). We calculate $BITS
              automatically.
            </span>
          </div>
        </>
      ) : (
        <>
          <InputBox
            amountPay={paymentState.safeAmountPay}
            setAmountPay={setAmountPay}
            userBalance={paymentState.balances[selectedToken] || 0}
            selectedToken={selectedToken}
            minAmountToken={minTokenNumber}
            minAmountDecimals={minTokenDecimals}
          />
          <div className="min-purchase-note">
            <span className="min-note-icon" aria-hidden>ℹ️</span>
            <span>{`Minimum purchase is $${minUsd}.`}</span>
            {minTokenNumber != null && (
              <span className="min-note-extra">
                {`For ${selectedToken}, minimum is `}
                <span className="min-token-amount">
                  {minTokenExtraNumber.toFixed(minTokenDecimals)} {selectedToken}
                </span>
                {`.`}
              </span>
            )}
          </div>
        </>
      )}

      {/* 🎯 Referral Code Input */}
      <div className="referral-code-container">
        <label className="referral-code-label">
          🎯 Referral Code (Optional)
        </label>
        <input
          type="text"
          placeholder="Enter referral code (e.g., CODE-OE3477)"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          className="referral-code-input"
          maxLength={20}
        />
        {referralCode && (
          <div className="referral-code-info">
            ✅ Using referral code: <strong>{referralCode}</strong>
          </div>
        )}
      </div>

      {/* 🎯 Terms Acceptance Checkbox */}
      <div className="terms-checkbox-container">
        <label className="terms-checkbox-label">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="terms-checkbox"
          />
          <span className="checkbox-custom"></span>
          <span className="terms-text">
            I have read, understood, and agree to the 
            <a href="/terms" className="terms-link">Terms & Conditions</a> and 
            <a href="/privacy-policy" className="terms-link">Privacy Policy</a>
          </span>
        </label>
      </div>

      {/* 💳 Payment Method Selector */}
      {showPaymentSelector && !isStripeToken && (
        <PaymentMethodSelector
          onSelectMethod={handlePaymentMethodSelect}
          selectedMethod={selectedPaymentMethod}
          amount={paymentState.usdValue || paymentState.safeAmountPay}
          walletAddress={paymentState.walletAddress}
          isVisible={showPaymentSelector}
        />
      )}

      {/* 🎯 Action Buttons */}
      {!paymentState.walletAddress ? (
        <button onClick={paymentState.connectWallet} className="connect-wallet-button">
          Connect Wallet
        </button>
      ) : isFiatToken && !selectedPaymentMethod ? (
        <button 
          onClick={handleProceedToPayment} 
          className="buy-button"
          disabled={!paymentState.hasValidAmount || !termsAccepted}
        >
          <img src="/logo.png" alt="BITS Logo" className="button-logo" />
          <span className="button-text">Choose Payment Method</span>
        </button>
      ) : (
        <>
          <button 
            onClick={() => {
              try { trackTikTokEvent('InitiateCheckout', { context: 'presale_buy_click' }); } catch(_) {}
              handleBuy();
            }} 
            className="buy-button"
            disabled={!paymentState.canProceed || !termsAccepted}
          >
            <img src="/logo.png" alt="BITS Logo" className="button-logo" />
            <span className="button-text">
              {isStripeToken ? 'Pay Securely with Stripe' : 'BUY  $BITS  NOW'}
            </span>
          </button>
          
          {/* 🚨 Debug Info - SHOW ONLY when button is disabled */}
          {(!paymentState.canProceed || !termsAccepted) && (
            <div className="button-debug-info" style={{
              fontSize: '0.8rem',
              color: '#ff6b6b',
              marginTop: '8px',
              padding: '12px',
              background: 'rgba(255, 107, 107, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              textAlign: 'center',
              minWidth: 'fit-content',
              maxWidth: '100%',
              wordWrap: 'break-word',
              lineHeight: '1.4'
            }}>
              <div>🚨 Button disabled because:</div>
              {!paymentState.hasValidAmount && <div>• Invalid amount: {paymentState.safeAmountPay}</div>}
              {!paymentState.hasValidBalance && !isFiatToken && <div>• Insufficient balance: {paymentState.balances[selectedToken] || 0} {selectedToken}</div>}
              {isFiatToken && <div>• ✅ Fiat payment - no crypto balance required</div>}
              {paymentState.isLoading && <div>• Loading data...</div>}
              {!termsAccepted && <div>• Terms & Conditions not accepted</div>}
              {selectedToken === "SOL" && !window.solana && <div>• Phantom Wallet not detected (install Phantom)</div>}
              

            </div>
          )}
        </>
      )}

      {/* 🎯 Payment Summary */}
      <PaymentSummary
        amountPay={paymentState.safeAmountPay}
        usdValue={paymentState.usdValue}
        selectedTokenPrice={paymentState.selectedTokenPrice}
        pureBits={paymentState.pureBits}
        bonus={paymentState.bonus}
        bonusAmount={paymentState.bonusAmount}
        selectedToken={selectedToken}
        selectedTokenLabel={selectedTokenLabel}
        bitsPriceUSD={displayBitsPriceUSD}
        fiatDetails={
          isStripeToken
            ? { currency: "EUR", amount: stripeAmountEUR }
            : null
        }
      />

      {/* 🎯 Bonus Information */}
      <div className="bonus-line">
        <img src="/logo.png" alt="$BITS" className="token-title-icon" />
        <span className="bonus-label">Claimable Bonus:</span>
        <span className="bonus-value">{paymentState.bonusAmount} $BITS</span>
      </div>
      <div className="bonus-note">
        <span>Bonus tokens can be managed in Rewards Hub</span>
      </div>

      {/* 🎯 Success Message - CLEAN VERSION WITHOUT GOOGLE ADS */}
      {confirmedBits && (
        <div className="confirmed-success">
          ✅ You received <strong>{confirmedBits}</strong> $BITS successfully!
        </div>
      )}
    </div>
  );
};

export default PaymentBox;
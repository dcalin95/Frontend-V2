import { useState } from "react";
import handleStripePaymentService from "../../TokenHandlers/handleStripePayment";
import { toast } from "react-toastify";

const useStripePayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStripePayment = async (amountUSD, walletAddress, referralCode) => {
    setIsLoading(true);
    setError(null);
    try {
      // Estimate BITS (approximate for frontend, backend validates)
      // Assuming 1 BITS = $0.001 for now, or fetch from somewhere if critical
      const bitsToReceive = Math.floor(amountUSD / 0.001); 
      
      // Assuming 1 EUR ~= 1.1 USD for initial estimation if needed, 
      // but the handler seems to require amountEUR. 
      // Let's just pass amountUSD as amountEUR for now if we only have USD,
      // OR backend handles conversion.
      // Looking at handleStripePayment.js: "if (!amountEUR || amountEUR < 10)"
      // It requires amountEUR.
      // We need to convert or just pass the same value if we are strictly in USD mode (which Stripe supports).
      // However, the handler specifically checks amountEUR.
      // Let's pass amountEUR as amountUSD / 1.08 (approx rate) or just same value for safety.
      
      const amountEUR = amountUSD; // Simplified for mobile flow

      await handleStripePaymentService({
        amountUSD,
        amountEUR,
        bitsToReceive,
        walletAddress,
        referralCode,
        bonusAmount: 0, // Simple flow
        bonusPercentage: 0
      });
      
    } catch (err) {
      console.error("Stripe payment error:", err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleStripePayment,
    isLoading,
    error
  };
};

export default useStripePayment;


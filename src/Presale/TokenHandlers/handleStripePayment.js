const handleStripePayment = async ({
  amountUSD,
  amountEUR,
  bitsToReceive,
  walletAddress,
  bonusAmount = 0,
  bonusPercentage = 0,
  referralCode,
}) => {
  console.groupCollapsed("💳 [Stripe Checkout] Initiating");
  try {
    const backendURL =
      process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

    if (!amountEUR || amountEUR < 10) {
      throw new Error("Stripe checkout requires a minimum of €10.");
    }

    const payload = {
      amountEUR,
      amountUSD,
      bitsToReceive,
      walletAddress,
      bonusAmount,
      bonusPercentage,
      referralCode,
      successUrl: `${window.location.origin}/presale?payment=stripe-success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/presale?payment=stripe-cancel`,
    };

    console.log("💳 [Stripe Checkout] Payload:", payload);

    const response = await fetch(
      `${backendURL}/api/stripe/create-checkout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    console.log("💳 [Stripe Checkout] Response:", data);

    if (!response.ok || !data?.url) {
      throw new Error(data?.error || "Failed to create Stripe checkout session.");
    }

    const checkoutWindow = window.open(data.url, "_blank", "noopener");
    if (!checkoutWindow) {
      window.location.href = data.url;
    }

    return data;
  } catch (error) {
    console.error("❌ [Stripe Checkout] Failed:", error);
    alert(`Stripe checkout failed: ${error.message}`);
    throw error;
  } finally {
    console.groupEnd();
  }
};

export default handleStripePayment;


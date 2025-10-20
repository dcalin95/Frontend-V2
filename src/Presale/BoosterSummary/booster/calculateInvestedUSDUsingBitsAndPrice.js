const calculateInvestedUSDUsingBitsAndPrice = async (bitsAmount, pricePerBitUSD) => {
    try {
      return parseFloat((bitsAmount * pricePerBitUSD).toFixed(4));
    } catch (error) {
      console.error("❌ Error in fallback USD investment calc:", error);
      return 0;
    }
  };
  
  export default calculateInvestedUSDUsingBitsAndPrice;
  
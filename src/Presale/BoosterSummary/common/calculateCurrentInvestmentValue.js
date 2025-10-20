const calculateCurrentInvestmentValue = (totalBits, currentPrice) => {
  try {
    return totalBits * currentPrice;
  } catch (error) {
    console.error("❌ Error calculateCurrentInvestmentValue:", error);
    return 0;
  }
};

export default calculateCurrentInvestmentValue;

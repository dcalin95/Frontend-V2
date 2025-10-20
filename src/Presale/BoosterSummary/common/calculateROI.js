const calculateROI = (purchasePrice, currentPrice) => {
  try {
    const buy = Number(purchasePrice);
    const current = Number(currentPrice);

    if (!buy || isNaN(buy) || isNaN(current) || buy === 0) return 0;

    const roi = ((current - buy) / buy) * 100;
    return roi;
  } catch (error) {
    console.error("❌ Error calculateROI:", error);
    return 0;
  }
};

export default calculateROI;

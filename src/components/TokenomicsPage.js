import React from "react";
import TokenomicsChart from "./TokenomicsChart";
import "./TokenomicsPage.css";

const TokenomicsPage = () => {
  // valorile centrale ale proiectului
  const totalSupply = 3_000_000_000;
  const initialPrice = 0.0001;
  const vestingInfo = "Team & Treasury: 12 months linear vesting";

  return (
    <div className="tokenomics-page">
      <div className="tokenomics-page-container">
        {/* Chart-ul primește props, deci afișează corect supply + price */}
        <TokenomicsChart totalSupply={totalSupply} initialPrice={initialPrice} />

        <div className="tokenomics-info">
          <h2>Tokenomics Overview</h2>
          <p>
            BitSwapDEX AI tokenomics are designed to ensure sustainable growth,
            community engagement, and long-term value creation for all stakeholders.
          </p>

          <div className="tokenomics-details">
            <div className="detail-item">
              <h3>Total Supply</h3>
              <p>{totalSupply.toLocaleString("en-US")} $BITS</p>
            </div>

            <div className="detail-item">
              <h3>Initial Price</h3>
              <p>${initialPrice} per $BITS</p>
            </div>

            <div className="detail-item">
              <h3>Vesting Period</h3>
              <p>{vestingInfo}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenomicsPage;

import React from "react";
import "./Whitepaper.css";

const Whitepaper = () => {
  return (
    <div className="whitepaper-container">
      {/* Soarele stilizat deasupra titlului */}
      <div className="whitepaper-sun"></div>

      {/* Titlu și subtitlu */}
      <h1 className="whitepaper-title">BitSwapDEX AI - $BITS - White Paper</h1>
      <h2 className="whitepaper-subtitle">THE AI-DRIVEN DECENTRALIZED EXCHANGE</h2>

      {/* Textul explicativ */}
      <p className="whitepaper-text">
        <span className="highlight-bits">$BITS</span> - BitSwapDEX AI is a next-generation decentralized exchange (DEX) that seamlessly integrates Artificial Intelligence (AI) and Machine Learning (ML) technologies. Built on the Stacks blockchain, a powerful layer-2 solution anchored to
        <span className="highlight-bitcoin"> $Bitcoin</span> via the Proof-of-Transfer (PoX) consensus mechanism, BitSwapDEX AI leverages AI-driven optimizations to provide an efficient, secure, and scalable peer-to-peer (P2P) trading experience.
      </p>

      <p className="whitepaper-text">
        By combining cutting-edge AI technologies with the reliability of <span className="highlight-bitcoin">$Bitcoin</span> and the smart contract capabilities of Stacks, BitSwapDEX AI emerges as a smarter, adaptive, and secure platform that pushes the boundaries of decentralized finance (DeFi).
      </p>

      {/* Butonul */}
      <button
        className="whitepaper-button"
        onClick={() => window.open("https://bitswap-5.gitbook.io/bitswapdex-ai", "_blank")}
      >
        Read Full Whitepaper
      </button>
    </div>
  );
};

export default Whitepaper;


import React from "react";
import ElectronAnimation from "./ElectronAnimation"; // Importă componenta
import "./Scheme.css"; // CSS pentru Scheme

const Scheme = () => {
  return (
    <div className="scheme-container">
      <h1 className="scheme-title">BitSwapDEX AI Scheme</h1>
      <div className="scheme-grid">
        {/* Electronii se mișcă între casete */}
        <ElectronAnimation />

        <div className="scheme-item center-item">
          <div className="icon-container">
            <i className="fas fa-brain"></i>
          </div>
          <h3>AI Core</h3>
          <p>Central hub leveraging AI for optimization and trading insights.</p>
        </div>

        <div className="scheme-item left-item">
          <div className="icon-container">
            <i className="fas fa-wallet"></i>
          </div>
          <h3>Wallet</h3>
          <p>Securely store and manage your crypto assets.</p>
        </div>
        <div className="scheme-item left-item">
          <div className="icon-container">
            <i className="fas fa-coins"></i>
          </div>
          <h3>Liquidity Pools</h3>
          <p>Earn rewards by participating in decentralized pools.</p>
        </div>

        <div className="scheme-item right-item">
          <div className="icon-container">
            <i className="fas fa-link"></i>
          </div>
          <h3>Smart Contracts</h3>
          <p>Automating trades and ensuring transparent transactions.</p>
        </div>
        <div className="scheme-item right-item">
          <div className="icon-container">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <h3>DEX Integration</h3>
          <p>Connect to a decentralized exchange for seamless trading.</p>
        </div>
      </div>
    </div>
  );
};

export default Scheme;


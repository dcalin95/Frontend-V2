import React from "react";
import PropTypes from "prop-types";
import "./WalletButtons.css"; // opțional: pentru styling extern

const WalletButtons = ({ onConnect, wallets }) => {
  return (
    <div className="wallet-buttons">
      {wallets.map((wallet) => (
        <button
          key={wallet.name}
          onClick={() => onConnect(wallet)}
          className="wallet-button"
          style={{ color: wallet.color }}
          aria-label={`Connect to ${wallet.name}`}
        >
          <img
            src={wallet.icon}
            alt={`${wallet.name} icon`}
            className="wallet-icon"
            style={{
              filter: `drop-shadow(0 0 6px ${wallet.color})`,
              width: "28px",
              height: "28px",
              marginRight: "10px",
            }}
          />
          <span className="wallet-text">{wallet.name}</span>
        </button>
      ))}
    </div>
  );
};

WalletButtons.propTypes = {
  onConnect: PropTypes.func.isRequired,
  wallets: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default WalletButtons;


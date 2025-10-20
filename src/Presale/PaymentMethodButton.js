import React from "react";
import "./PaymentMethodButton.css";

const PaymentMethodButton = ({ token, icon, selected, onClick, network }) => (
    <button
        className={`payment-method-button ${selected ? "active" : ""}`}
        onClick={onClick}
    >
        <img src={icon} alt={token} className="token-icon" />
        <span className="token-name">{token}</span>
        <span className="network-label">{network}</span>
    </button>
);

export default PaymentMethodButton;


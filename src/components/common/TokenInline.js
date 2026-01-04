import React from "react";
import bitsLogo from "../../assets/logo.png";
import usdcLogo from "../../assets/usdc-logo.png";

const TOKENS = {
  BITS: { src: bitsLogo, label: "BITS", alt: "BITS" },
  USDC: { src: usdcLogo, label: "USDC", alt: "USDC" },
};

export default function TokenInline({
  token,
  className = "",
  size = 16,
  dollar = false,
}) {
  const t = TOKENS[String(token || "").toUpperCase()];
  if (!t) return <span className={className}>{String(token || "")}</span>;

  const text = dollar && t.label === "BITS" ? "$BITS" : t.label;

  return (
    <span className={`token-inline ${className}`.trim()}>
      <img
        className="token-inline-icon"
        src={t.src}
        alt={t.alt}
        style={{ width: size, height: size }}
      />
      <span className="token-inline-text">{text}</span>
    </span>
  );
}



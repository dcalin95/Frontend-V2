import React from "react";
import "./Footer.css";
import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import binanceLogo from "../assets/exchanges/binance-clearbit.png";
import coinbaseLogo from "../assets/exchanges/coinbase-clearbit.png";
import krakenLogo from "../assets/exchanges/kraken-clearbit.png";
import bybitLogo from "../assets/exchanges/bybit-clearbit.png";
import kucoinLogo from "../assets/exchanges/kucoin-clearbit.png";
import gateioLogo from "../assets/exchanges/gateio-clearbit.png";
import mexcLogo from "../assets/exchanges/mexc-clearbit.png";
import uniswapLogo from "../assets/exchanges/uniswap-clearbit.png";
import pancakeswapLogo from "../assets/exchanges/pancakeswap-clearbit.png";
import bitfinexLogo from "../assets/exchanges/bitfinex-clearbit.png";
import okxLogo from "../assets/exchanges/okx-clearbit.png";
import htxLogo from "../assets/exchanges/htx-clearbit.png";

const Footer = () => {
  const exchanges = [
    { name: 'Binance', logo: binanceLogo, url: 'https://www.binance.com' },
    { name: 'Coinbase', logo: coinbaseLogo, url: 'https://www.coinbase.com' },
    { name: 'Kraken', logo: krakenLogo, url: 'https://www.kraken.com' },
    { name: 'Bybit', logo: bybitLogo, url: 'https://www.bybit.com' },
    { name: 'KuCoin', logo: kucoinLogo, url: 'https://www.kucoin.com' },
    { name: 'Gate.io', logo: gateioLogo, url: 'https://www.gate.io' },
    { name: 'MEXC', logo: mexcLogo, url: 'https://www.mexc.com' },
    { name: 'Uniswap', logo: uniswapLogo, url: 'https://app.uniswap.org' },
    { name: 'PancakeSwap', logo: pancakeswapLogo, url: 'https://pancakeswap.finance' },
    { name: 'Bitfinex', logo: bitfinexLogo, url: 'https://www.bitfinex.com' },
    { name: 'OKX', logo: okxLogo, url: 'https://www.okx.com' },
    { name: 'HTX', logo: htxLogo, url: 'https://www.htx.com' },
  ];

  return (
    <footer className="footer-container">
      {/* 🚀 COMPACT LISTING SECTION */}
      <div className="footer-exchanges-compact">
        <p className="exchanges-slogan">
          🚀 <strong>Listing Price Will Be Higher Than Final Presale Round</strong> — Get In Early! 💎
        </p>
        <div className="exchanges-logos">
          {exchanges.map((exchange, index) => (
            <a
              key={index}
              href={exchange.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <img 
                src={exchange.logo} 
                alt={exchange.name}
                title={`${exchange.name} - ${exchange.url}`}
                className="exchange-logo-mini"
                onError={(e) => {
                  // Fallback: dacă logo-ul nu se încarcă, afișează numele
                  e.target.style.display = 'none';
                  const textFallback = document.createElement('div');
                  textFallback.textContent = exchange.name;
                  textFallback.style.cssText = 'color: #00FFA3; font-size: 12px; font-weight: 700;';
                  e.target.parentNode.appendChild(textFallback);
                }}
              />
            </a>
          ))}
        </div>
        <p className="exchanges-subtitle">Coming Soon to Major Exchanges</p>
      </div>

      <p className="footer-text">
        <BrandLogo size="xs" className="footer-brand" showText={false} />
        <span className="footer-text__content">
          &copy; 2025-2026 - ®BitSwapDEX AI &amp; $BITS. Powered by AI and Blockchain Technology! All rights reserved!
          Any copying/reproduction without the written consent of ®BitSwapDEX AI is prohibited and punishable under
          International Copyright Law!
        </span>
      </p>
      <div className="footer-links">
        <Link to="/terms" className="footer-button">
          <i className="fas fa-file-alt footer-icon blue"></i> Terms and Conditions
        </Link>
        <Link to="/privacy-policy" className="footer-button">
          <i className="fas fa-user-shield footer-icon green"></i> Privacy Policy
        </Link>
        <Link to="/contact" className="footer-button">
          <i className="fas fa-envelope footer-icon"></i> Contact
        </Link>
        <Link to="/" className="footer-button">
          <i className="fas fa-home footer-icon red"></i> Go to Home Page
        </Link>
      </div>
    </footer>
  );
};

export default Footer;

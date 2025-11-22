import React from 'react';
import './PurchaseProcessViz.css';
import SmartTooltip from '../Presale/components/SmartTooltip';
import bitsLogo from '../assets/logo.png'; // Import BITS Logo

const PurchaseProcessViz = () => {
  return (
    <div className="process-viz-container">
      <svg className="process-svg" viewBox="0 0 800 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00FFA3" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#00FFA3" stopOpacity="1" />
            <stop offset="100%" stopColor="#DC1FFF" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="gradCore" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FFA3" />
            <stop offset="100%" stopColor="#DC1FFF" />
          </linearGradient>
          <filter id="glowViz">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Dynamic Glitch Filter */}
          <filter id="aiGlitch">
            <feTurbulence type="fractalNoise" baseFrequency="0.01 0.003" numOctaves="1" seed="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* --- CONNECTIONS --- */}
        {/* Wallet to Core - Data Stream */}
        <path d="M100,150 C200,150 250,150 350,150" stroke="url(#gradLine)" strokeWidth="2" fill="none" />
        <path d="M100,150 C200,150 250,150 350,150" stroke="#00FFA3" strokeWidth="4" strokeDasharray="4 20" fill="none" className="anim-flow-fast" opacity="0.8" />

        {/* Core to BITS - Value Transfer */}
        <path d="M450,150 C550,150 600,150 700,150" stroke="url(#gradLine)" strokeWidth="2" fill="none" />
        <path d="M450,150 C550,150 600,150 700,150" stroke="#DC1FFF" strokeWidth="4" strokeDasharray="8 12" fill="none" className="anim-flow" opacity="0.6" style={{ animationDirection: 'reverse' }} />

        {/* --- LEFT NODE: WALLET & MINERS --- */}
        <SmartTooltip content={`Secure Web3 Gateway\nConnecting via encrypted RPC nodes.\nMiners validating signature.`}>
          <g className="anim-float node-hover">
            {/* Orbital Rings */}
            <circle cx="100" cy="150" r="45" fill="none" stroke="#00FFA3" strokeWidth="1" strokeDasharray="60 100" className="anim-spin-slow" opacity="0.6" />
            <circle cx="100" cy="150" r="55" fill="none" stroke="#00FFA3" strokeWidth="0.5" strokeDasharray="10 10" className="anim-spin-rev" opacity="0.3" />
            
            <circle cx="100" cy="150" r="40" fill="rgba(5, 10, 15, 0.9)" stroke="#00FFA3" strokeWidth="2" filter="url(#glowViz)" />
            
            {/* Abstract Wallet Icon */}
            <path d="M85,140 h30 a5,5 0 0,1 5,5 v20 a5,5 0 0,1 -5,5 h-30 a5,5 0 0,1 -5,-5 v-20 a5,5 0 0,1 5,-5 z M110,150 v10" stroke="#fff" strokeWidth="2" fill="none" />
            
            {/* Mining Nodes (Small orbiting dots) */}
            <circle cx="100" cy="100" r="3" fill="#00FFA3" className="anim-orbit-1" />
            <circle cx="100" cy="200" r="3" fill="#00FFA3" className="anim-orbit-2" />
            <text x="100" y="225" textAnchor="middle" fill="#00FFA3" fontSize="12" fontFamily="Orbitron" letterSpacing="1">SECURE WALLET</text>
          </g>
        </SmartTooltip>

        {/* --- CENTER NODE: AI BLOCKCHAIN CORE --- */}
        <SmartTooltip content={`AI Neural Blockchain Core\nProcessing transaction blocks with ML optimization.\nSmart Contract: Verified.`}>
          <g className="anim-pulse node-hover">
            {/* Complex Rotating Geometry */}
            <g className="anim-spin-slow">
              <rect x="370" y="120" width="60" height="60" rx="10" fill="none" stroke="url(#gradCore)" strokeWidth="1" transform="rotate(45 400 150)" />
              <rect x="370" y="120" width="60" height="60" rx="10" fill="none" stroke="url(#gradCore)" strokeWidth="1" transform="rotate(135 400 150)" opacity="0.5" />
            </g>
            
            {/* Central AI Brain/Chip */}
            <rect x="385" y="135" width="30" height="30" rx="4" fill="rgba(0,0,0,0.8)" stroke="#fff" strokeWidth="2" filter="url(#glowViz)" />
            <path d="M390,150 h20 M400,140 v20" stroke="#00FFA3" strokeWidth="2" />
            <circle cx="400" cy="150" r="4" fill="#DC1FFF" className="anim-pulse-fast" />

            {/* Data Rays */}
            <line x1="400" y1="120" x2="400" y2="90" stroke="url(#gradCore)" strokeWidth="2" strokeDasharray="4 4" className="anim-flow-vertical" />
            <line x1="400" y1="180" x2="400" y2="210" stroke="url(#gradCore)" strokeWidth="2" strokeDasharray="4 4" className="anim-flow-vertical" />

            <text x="400" y="245" textAnchor="middle" fill="#fff" fontSize="12" fontFamily="Orbitron" letterSpacing="2">AI CORE</text>
          </g>
        </SmartTooltip>

        {/* --- RIGHT NODE: BITS TOKEN ASSET --- */}
        <SmartTooltip content={`$BITS Token Asset\nThe BitSwapDEX utility token.\nStored immutably on the blockchain.`}>
          <g className="anim-float node-hover" style={{ animationDelay: '1s' }}>
            {/* Energy Field */}
            <circle cx="700" cy="150" r="50" fill="url(#gradCore)" opacity="0.1" filter="url(#aiGlitch)" />
            <circle cx="700" cy="150" r="42" fill="rgba(10, 10, 20, 0.9)" stroke="#DC1FFF" strokeWidth="2" filter="url(#glowViz)" />
            
            {/* REAL BITS LOGO EMBEDDED IN SVG */}
            <image href={bitsLogo} x="675" y="125" height="50" width="50" className="bits-logo-svg anim-spin-slow-rev" />
            
            <text x="700" y="225" textAnchor="middle" fill="#DC1FFF" fontSize="14" fontFamily="Orbitron" fontWeight="bold">$BITS TOKEN</text>
          </g>
        </SmartTooltip>

        {/* Floating Data Packets - High Frequency */}
        <circle r="3" fill="#fff" filter="url(#glowViz)">
          <animateMotion dur="1.5s" repeatCount="indefinite" path="M100,150 C200,150 250,150 350,150" />
        </circle>
        <circle r="3" fill="#00FFA3" filter="url(#glowViz)">
          <animateMotion dur="1.5s" begin="0.75s" repeatCount="indefinite" path="M450,150 C550,150 600,150 700,150" />
        </circle>

      </svg>
    </div>
  );
};

export default PurchaseProcessViz;


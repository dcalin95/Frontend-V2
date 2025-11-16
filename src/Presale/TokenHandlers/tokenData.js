// src/Presale/TokenHandlers/tokenData.js
import bnb from "../../assets/icons/bnb.logo.png";
import eth from "../../assets/icons/evm-logo.jpg";
import usdt from "../../assets/icons/tether-usdt-logo.png";
import usdc from "../../assets/icons/usdc-solana-logo.png";
import sol from "../../assets/icons/solana-logo.png";
import matic from "../../assets/icons/polygon-matic-logo.png";
import link from "../../assets/icons/chainlink-logo.png";
import btcb from "../../assets/icons/btcb-logo.png";
import usdcSolana from "../../assets/icons/usdc-solana-logo.png";
import cardIcon from "../../assets/icons/card-logo.jpg";

// ✅ Folosește adresele reale din CONTRACTS.js (hardcoded aici temporar, pune-le și acolo)
export const tokenList = [
  {
    name: "BNB",
    key: "BNB",
    icon: bnb,
    color: "#f3ba2f",
    chain: "evm",
    address: "0x0000000000000000000000000000000000000000", // Native token
  },
  
  {
    name: "ETH",
    key: "ETH",
    icon: eth,
    color: "#627eea",
    chain: "evm",
    address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", // Binance-Peg ETH on BSC Mainnet
  },
  {
    name: "USDT",
    key: "USDT",
    icon: usdt,
    color: "#26a17b",
    chain: "evm",
    address: "0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684", // USDT on BSC Testnet
  },
  {
    name: "USDC",
    key: "USDC",
    icon: usdc,
    color: "#2775ca",
    chain: "evm",
    address: "0x64544969ed7EBf5f083679233325356EbE738930", // USDC on BSC Testnet
  },
  {
    name: "SOL",
    key: "SOL",
    icon: sol,
    color: "#66f9e2",
    chain: "solana",
    address: null, // Not supported on EVM
  },
  {
    name: "MATIC",
    key: "MATIC",
    icon: matic,
    color: "#8247e5",
    chain: "evm",
    address: "0xCC42724C6683B7E57334c4E856f4c9965ED682bD", // Binance-Peg MATIC (BSC Mainnet)
    decimals: 18,
  },
  {
    name: "LINK",
    key: "LINK",
    icon: link,
    color: "#2a5ada",
    chain: "evm",
    address: "0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD", // LINK on BSC
    decimals: 18,
  },
  {
    name: "BTCB",
    key: "BTCB",
    icon: btcb,
    color: "#f7931a",
    chain: "evm",
    address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", // BTCB (Wrapped BTC) on BSC
    decimals: 18,
  },
  {
    name: "USDC-Solana",
    key: "USDC-Solana",
    icon: usdcSolana,
    color: "#2775ca",
    chain: "solana",
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC mainnet mint
    decimals: 6
  },
  // Fiat payments - Coming Soon (waiting for Seychelles company registration)
  {
    name: "Stripe Card Checkout",
    key: "STRIPE",
    icon: cardIcon,
    color: "#635bff",
    chain: "fiat",
    address: null,
    comingSoon: false,
  },
  {
    name: "Card Payment (NOWPayments)",
    key: "NOWPAY",
    icon: cardIcon,
    color: "#444",
    chain: "fiat",
    address: null,
    comingSoon: true,
    requiresCompany: true,
  },
  {
    name: "MoonPay (Credit Card)",
    key: "MOONPAY",
    icon: cardIcon,
    color: "#7B68EE",
    chain: "fiat",
    address: null,
    comingSoon: true,
    requiresCompany: true,
  },
  {
    name: "Transak (Bank Transfer)",
    key: "TRANSAK", 
    icon: cardIcon,
    color: "#4285F4",
    chain: "fiat",
    address: null,
    comingSoon: true,
    requiresCompany: true,
  },
];


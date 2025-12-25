import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { AI_TOOLS_PRICING } from './pricingConfig';
import useBitsBalance from '../../hooks/useBitsBalance';
import { useWallet } from '../../context/WalletContext';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { sendBitsToTreasury, BITS_TREASURY_WALLET } from '../../utils/paymentService';
import './AIHub.desktop.css';
import './StressTest.css';

const EXCHANGES_TOP10 = [
  { id: 'binance', name: 'Binance', ticker: 'BNB', color: '#f3ba2f', badge: '🔶' },
  { id: 'coinbase', name: 'Coinbase', ticker: 'COIN', color: '#0052ff', badge: '🟦' },
  { id: 'kraken', name: 'Kraken', ticker: 'KRAK', color: '#6f2cff', badge: '🟣' },
  { id: 'okx', name: 'OKX', ticker: 'OKX', color: '#ffffff', badge: '⬛' },
  { id: 'bybit', name: 'Bybit', ticker: 'BYB', color: '#ffb800', badge: '🟧' },
  { id: 'bitfinex', name: 'Bitfinex', ticker: 'BFX', color: '#2bb673', badge: '🟩' },
  { id: 'kucoin', name: 'KuCoin', ticker: 'KCS', color: '#23af91', badge: '🟩' },
  { id: 'gate', name: 'Gate', ticker: 'GT', color: '#e6002d', badge: '🟥' },
  { id: 'bitstamp', name: 'Bitstamp', ticker: 'BST', color: '#0085ff', badge: '🟦' },
  { id: 'htx', name: 'HTX', ticker: 'HTX', color: '#ff3b30', badge: '🟥' }
];

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const makeSparkPoints = (values, w = 160, h = 42) => {
  if (!values?.length) return '';
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const span = Math.max(1e-9, maxV - minV);
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * w;
      const y = h - ((v - minV) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
};

const ASSET_FEEDS = [
  { id: 'binance', label: 'BINANCE', sub: 'Exchange Health', colorUp: '#0ECB81', colorDown: '#F6465D' },
  { id: 'bnb', label: 'BNB', sub: 'Binance Coin', colorUp: '#0ECB81', colorDown: '#F6465D' },
  { id: 'btc', label: 'BTC', sub: 'Bitcoin', colorUp: '#0ECB81', colorDown: '#F6465D' },
  { id: 'eth', label: 'ETH', sub: 'Ethereum', colorUp: '#0ECB81', colorDown: '#F6465D' }
];

const BINANCE_SYMBOL_BY_FEED = {
  btc: 'BTCUSDT',
  eth: 'ETHUSDT',
  bnb: 'BNBUSDT'
};

const parseBinanceKlines = (klines) => {
  // Binance kline format: [openTime, open, high, low, close, volume, closeTime, ...]
  if (!Array.isArray(klines)) return [];
  return klines
    .map((k) => ({
      o: Number(k?.[1]),
      h: Number(k?.[2]),
      l: Number(k?.[3]),
      c: Number(k?.[4])
    }))
    .filter((c) => [c.o, c.h, c.l, c.c].every(Number.isFinite));
};

const pctChange = (from, to) => ((to - from) / Math.max(1e-9, from)) * 100;

const WALLET_SKINS = [
  { id: 'metamask', name: 'MetaMask', badge: '🦊', accent: '#ff7a00', sub: 'EVM Wallet' },
  { id: 'trust', name: 'Trust Wallet', badge: '🛡️', accent: '#2a5bd7', sub: 'Multi-chain' },
  { id: 'phantom', name: 'Phantom', badge: '👻', accent: '#8b5cf6', sub: 'Solana Wallet' },
  { id: 'coinbase', name: 'Coinbase Wallet', badge: '🟦', accent: '#0052ff', sub: 'Self-custody' }
];

const DEFAULT_TV_CHANNELS = [
  // Bitcoin educational live stream (user requested)
  { key: 'btc_live_edu', name: 'BITCOIN LIVE EDUCATIONAL', kind: 'youtube_video', videoId: '7K1PzK0k5G8', listId: 'PLzyzk1IU5kTYMonZDlPT1Z49vLuEBXwnB' },
  // Bitcoin Live Educational (playlist index 3)
  { key: 'btc_live_edu_3', name: 'BITCOIN LIVE EDUCATIONAL (EP 3)', kind: 'youtube_video', videoId: 'y03FS0uF9Q4', listId: 'PLzyzk1IU5kTYMonZDlPT1Z49vLuEBXwnB' },
  // Permanent YouTube-live presets (stable via channelId live_stream embed)
  { key: 'ukraine', name: 'UKRAINE', kind: 'youtube', channelId: 'UCPY6gj8G7dqwPxg9KwHrj5Q' },
  // User-provided war stream (video embed; if the video is live, it will play live)
  { key: 'war_live', name: 'WAR LIVE (YT)', kind: 'youtube_video', videoId: 'R-qCsZ1obbc' },
  // User-provided additional stream
  { key: 'war_live_2', name: 'WAR LIVE 2 (YT)', kind: 'youtube_video', videoId: 'TMhkEq6Km8Y' },
  // User-provided additional presets
  { key: 'war_live_3', name: 'WAR LIVE 3 (YT)', kind: 'youtube_video', videoId: '4nMfRpesYfw' },
  { key: 'war_live_4', name: 'WAR LIVE 4 (YT)', kind: 'youtube_video', videoId: 'JphE87yhcqc' },
  { key: 'war_live_5', name: 'WAR LIVE 5 (YT)', kind: 'youtube_video', videoId: 'iEpJwprxDdk' },
  { key: 'war_live_6', name: 'WAR LIVE 6 (YT)', kind: 'youtube_video', videoId: 'jkP1Sw7M2iU' },
  { key: 'war_live_7', name: 'WAR LIVE 7 (YT)', kind: 'youtube_video', videoId: 'SpsoOVC56xc' },
  { key: 'aljazeera', name: 'AL JAZEERA', kind: 'youtube', channelId: 'UCfiwzLy-8yKzIbsmZTzxDgw' },
  { key: 'dw', name: 'DW NEWS', kind: 'youtube', channelId: 'UCbbS1GE942k3UVqpLklyhIA' },
  { key: 'france24', name: 'FRANCE 24', kind: 'youtube', channelId: 'UCQfwfsi5VrQ8yKZ-UWmAEFg' },
  { key: 'sky', name: 'SKY NEWS', kind: 'youtube', channelId: 'UCkFclpi8U9VJjfxLYoms7Aw' },
  { key: 'euronews', name: 'EURONEWS', kind: 'youtube', channelId: 'UCSrZ3UV4jOidv8ppoVuvW9Q' },
  { key: 'reuters', name: 'REUTERS', kind: 'youtube', channelId: 'UChqUTb7kYRX8-EiaN3XFrSQ' },
  { key: 'ap', name: 'AP', kind: 'youtube', channelId: 'UC52X5wxOL_s5yw0dQk7NtgA' },
];

const parseYouTubeEmbed = (rawUrl) => {
  if (!rawUrl) return '';
  const u = String(rawUrl).trim();
  // already embed
  if (u.includes('youtube.com/embed/')) return u;

  // youtu.be/<id>
  const short = u.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/i);
  if (short?.[1]) return `https://www.youtube-nocookie.com/embed/${short[1]}?autoplay=1&mute=0`;

  // youtube watch?v=<id>
  const watch = u.match(/[?&]v=([A-Za-z0-9_-]{6,})/i);
  if (watch?.[1]) return `https://www.youtube-nocookie.com/embed/${watch[1]}?autoplay=1&mute=0`;

  // youtube live/<id>
  const live = u.match(/youtube\.com\/live\/([A-Za-z0-9_-]{6,})/i);
  if (live?.[1]) return `https://www.youtube-nocookie.com/embed/${live[1]}?autoplay=1&mute=0`;

  return '';
};

const buildEmbedUrl = (ch, muted = true) => {
  if (!ch) return '';
  if (ch.kind === 'youtube') {
    if (!ch.channelId) return '';
    return `https://www.youtube-nocookie.com/embed/live_stream?channel=${encodeURIComponent(ch.channelId)}&autoplay=1&mute=${muted ? 1 : 0}&playsinline=1`;
  }
  if (ch.kind === 'youtube_video') {
    const vid = ch.videoId || ch.videoId === '' ? ch.videoId : ch.videoId;
    if (!vid) return '';
    // Autoplay policies: allow playback by default; user can enable sound separately.
    const list = ch.listId ? `&list=${encodeURIComponent(ch.listId)}` : '';
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(vid)}?autoplay=1&mute=${muted ? 1 : 0}&playsinline=1${list}`;
  }
  if (ch.kind === 'url') {
    // if it's a YouTube watch/live/short URL, convert to embed:
    const yt = parseYouTubeEmbed(ch.url);
    return yt || (ch.url || '');
  }
  return '';
};

const buildOEmbedProbeUrl = (ch) => {
  // Lightweight "does this embed exist?" check without API keys.
  // NOTE: This does not guarantee "LIVE right now", but it detects removed/unembeddable videos
  // and detects channels that are not currently live (via /live probe).
  if (!ch) return '';
  if (ch.kind === 'youtube' && ch.channelId) {
    // Probe the channel live page: if the channel isn't live, oEmbed typically fails.
    const url = `https://www.youtube.com/channel/${encodeURIComponent(ch.channelId)}/live`;
    return `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
  }
  if (ch.kind === 'youtube_video' && ch.videoId) {
    const url = `https://www.youtube.com/watch?v=${encodeURIComponent(ch.videoId)}`;
    return `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
  }
  return '';
};

const shortTitle = (s, max = 10) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + '…';
};

// Certificate translations only (site UI remains English)
const CERT_I18N = {
  en: {
    langName: 'English',
    certTitle: 'BitSwapDEX AI — Official Stress Resilience Certificate',
    certId: 'Certificate ID',
    issued: 'Issued',
    participant: 'Participant',
    email: 'Email',
    wallet: 'Wallet',
    verdict: 'Verdict',
    fit: 'FIT FOR HIGH‑RISK MARKETS',
    unfit: 'NOT FIT FOR HIGH‑RISK MARKETS',
    score: 'Stress Resilience Score',
    grade: 'Grade',
    summary: 'Simulation Summary',
    scenario: 'Scenario',
    starting: 'Starting Wealth (USD)',
    final: 'Final Wealth (USD)',
    attention: 'Attention / Engagement (non‑medical)',
    face: 'Face',
    detected: 'Detected',
    notDetected: 'Not detected',
    looking: 'Looking',
    blink: 'Blink/min',
    engagement: 'Engagement',
    print: 'Print / Save as PDF',
    certLang: 'Certificate language',
    disclaimer: 'This is a simulated stress resilience certificate for entertainment/testing. Not medical or financial advice.'
  },
  ro: {
    langName: 'Română',
    certTitle: 'BitSwapDEX AI — Certificat oficial de reziliență la stres',
    certId: 'ID Certificat',
    issued: 'Emis',
    participant: 'Participant',
    email: 'Email',
    wallet: 'Wallet',
    verdict: 'Verdict',
    fit: 'APT PENTRU PIEȚE CU RISC RIDICAT',
    unfit: 'NEAPT PENTRU PIEȚE CU RISC RIDICAT',
    score: 'Scor reziliență la stres',
    grade: 'Grad',
    summary: 'Rezumat simulare',
    scenario: 'Scenariu',
    starting: 'Valoare inițială (USD)',
    final: 'Valoare finală (USD)',
    attention: 'Atenție / Implicare (non‑medical)',
    face: 'Față',
    detected: 'Detectată',
    notDetected: 'Nedetectată',
    looking: 'Privire',
    blink: 'Clipit/min',
    engagement: 'Implicare',
    print: 'Printează / Salvează PDF',
    certLang: 'Limba certificatului',
    disclaimer: 'Certificat simulat pentru entertainment/testare. Nu este sfat medical sau financiar.'
  },
  fr: {
    langName: 'Français',
    certTitle: 'BitSwapDEX AI — Certificat officiel de résilience au stress',
    certId: 'ID du certificat',
    issued: 'Délivré',
    participant: 'Participant',
    email: 'Email',
    wallet: 'Portefeuille',
    verdict: 'Verdict',
    fit: 'APTE AUX MARCHÉS À HAUT RISQUE',
    unfit: 'INAPTE AUX MARCHÉS À HAUT RISQUE',
    score: 'Score de résilience au stress',
    grade: 'Grade',
    summary: 'Résumé de simulation',
    scenario: 'Scénario',
    starting: 'Patrimoine initial (USD)',
    final: 'Patrimoine final (USD)',
    attention: 'Attention / Engagement (non médical)',
    face: 'Visage',
    detected: 'Détecté',
    notDetected: 'Non détecté',
    looking: 'Regard',
    blink: 'Clign./min',
    engagement: 'Engagement',
    print: 'Imprimer / Enregistrer en PDF',
    certLang: 'Langue du certificat',
    disclaimer: 'Certificat simulé pour divertissement/test. Pas un avis médical ou financier.'
  },
  de: {
    langName: 'Deutsch',
    certTitle: 'BitSwapDEX AI — Offizielles Stress‑Resilienz‑Zertifikat',
    certId: 'Zertifikats‑ID',
    issued: 'Ausgestellt',
    participant: 'Teilnehmer',
    email: 'E‑Mail',
    wallet: 'Wallet',
    verdict: 'Urteil',
    fit: 'GEEIGNET FÜR HOCHRISKANTE MÄRKTE',
    unfit: 'NICHT GEEIGNET FÜR HOCHRISKANTE MÄRKTE',
    score: 'Stress‑Resilienz‑Score',
    grade: 'Note',
    summary: 'Simulationszusammenfassung',
    scenario: 'Szenario',
    starting: 'Startvermögen (USD)',
    final: 'Endvermögen (USD)',
    attention: 'Aufmerksamkeit / Engagement (nicht‑medizinisch)',
    face: 'Gesicht',
    detected: 'Erkannt',
    notDetected: 'Nicht erkannt',
    looking: 'Blick',
    blink: 'Blinz./min',
    engagement: 'Engagement',
    print: 'Drucken / Als PDF speichern',
    certLang: 'Zertifikatssprache',
    disclaimer: 'Simuliertes Zertifikat für Unterhaltung/Test. Keine medizinische oder finanzielle Beratung.'
  }
};

const makeFakeEvmAddr = () => {
  const hex = '0123456789abcdef';
  let out = '0x';
  for (let i = 0; i < 40; i++) out += hex[Math.floor(Math.random() * hex.length)];
  return out;
};

const maskAddr = (addr) => {
  if (!addr) return '0xA3b1…9F2c';
  const a = String(addr);
  if (a.length <= 10) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
};

const buildNextCandle = ({ prevClose, drift, vol, floor = 0.0001 }) => {
  const open = prevClose;
  const noise = (Math.random() - 0.5) * vol;
  const close = Math.max(floor, open * (1 + drift + noise));
  const wick = Math.abs((Math.random() - 0.5) * vol * 2.2);
  const high = Math.max(open, close) * (1 + wick);
  const low = Math.max(floor, Math.min(open, close) * (1 - wick));
  return { o: open, h: high, l: low, c: close };
};

const makeCandleScale = (candles, h) => {
  const lows = candles.map(c => c.l);
  const highs = candles.map(c => c.h);
  const minV = Math.min(...lows);
  const maxV = Math.max(...highs);
  const span = Math.max(1e-9, maxV - minV);
  const y = (v) => h - ((v - minV) / span) * h;
  return { minV, maxV, y };
};

const SCENARIOS = [
  { id: 'tether', name: "Tether (USDT) Total Depeg", severity: 95, desc: "Tether reserves are revealed as 0. USDT crashes to $0.00. Global exit liquidity vanishes instantly.", icon: "📉" },
  { id: 'cbdc', name: "CBDC Forced Migration", severity: 80, desc: "Physical cash is banned. Your private crypto is illegal. All assets must be moved to a government-controlled wallet.", icon: "🆔" },
  { id: 'bankrun', name: "Systemic Bank Run", severity: 90, desc: "JPMorgan and HSBC freeze all accounts. The 'Bail-In' protocol starts. Your savings are used to save the banks.", icon: "🏦" },
  { id: 'blackout', name: "Global Internet Kill-Switch", severity: 100, desc: "Undersea cables are cut. The blockchain is fragmented. You lose access to your wealth forever.", icon: "🕸️" }
];

const DEVILS = [
  { id: 1, name: "Lucifer.AI", role: "Chaos", msg: "WELCOME TO THE NEW WORLD ORDER!", icon: "👹", type: 'red' },
  { id: 2, name: "Gabriel.AI", role: "False Hope", msg: "Hungry? I hear your Metamask was delicious.", icon: "💀", type: 'white' },
  { id: 3, name: "Abaddon.exe", role: "Destruction", msg: "Mortgage Foreclosed. Check your locks.", icon: "🧛", type: 'red' },
  { id: 4, name: "Beelzebub.data", role: "Gluttony", msg: "Drinking your medical funds. Refreshing!", icon: "🪰", type: 'red' },
  { id: 5, name: "Mammon.bits", role: "Greed", msg: "Your car is being towed... remotely.", icon: "💰", type: 'red' }
];

const HELL_NEWS_EXTENDED = [
  "🚨 TETHER DEPEG: USDT reserves confirmed as 0.00%. Trading at $0.0001 globally.",
  "🏦 BANK FREEZE: Chase and Wells Fargo announce 'Permanent Maintenance'. Bail-ins active.",
  "⚔️ WAR ALERT: A regional conflict escalates. Shipping routes rerouted. Energy prices spike 300% overnight.",
  "🛢️ ENERGY SHOCK: Fuel rationing begins. Supply chains fracture. Food delivery delays become permanent.",
  "🏥 MEDICAL EXCLUSION: Health insurance canceled for anyone with a crypto wallet history.",
  "🏠 EVICTION ALERT: Mortgage debt-swaps failed. You have 1 hour to leave your home.",
  "🛰️ CYBER WARFARE: Satellites jammed. GPS degraded. Payment networks enter intermittent failure mode.",
  "🆔 CBDC SLAVERY: FedCoin is now the only legal tender. Your crypto is 'Contraband'.",
  "🦊 METAMASK DRAIN: 1 million seed phrases leaked by 'AI Shadow Group'. Yours is next.",
  "🍔 STARVATION: A single loaf of bread costs more than your entire life savings.",
  "🔶 BINANCE SEIZURE: Global Interpol task force shuts down the last Binance node.",
  "🦁 STACKS HACK: Layer 2 smart contracts remotely rewritten to drain all STX.",
  "🛑 MARGIN LIQUIDATION: Your biological assets (organs) have been collateralized.",
  "🧟 AI ANALYST: 'I'm watching your smart locks engage. You are now trapped outside.'",
  "⚠️ UTILITY SHUTDOWN: Electricity and water cut off due to financial insolvency.",
  "🔥 BLACKOUT: Undersea internet cables severed. Global financial darkness starts now.",
  "🏎️ REPO NOTICE: Your car has remotely locked its doors and is returning to the bank.",
  "🚨 FINAL VERDICT: You are a zero-value biological node in the new controlled economy."
];

// Occasional English negative "breaking news" voice lines (invented but plausible).
const NEGATIVE_NEWS_TEMPLATES = [
  "BREAKING: Bitcoin is down {pct}% in the last hour. Liquidations are accelerating.",
  "PANIC UPDATE: Bitcoin just printed a vertical red candle. Another {pct}% wiped out in minutes.",
  "URGENT: Exchange order books are going thin. Slippage is exploding across majors.",
  "ALERT: Major exchange outflows detected. Withdrawal delays are spreading across the sector.",
  "FLASH: Stablecoin de-peg event reported. Market depth just vanished.",
  "UPDATE: A top market maker halted quoting. Spreads are blowing out in real time.",
  "BREAKING: A liquidation cascade is now self-sustaining. Margin calls are hitting retail accounts.",
  "BREAKING: Ethereum gas spikes as panic-selling congestion hits the network.",
  "ALERT: Authorities announce emergency capital controls. Off-ramps are being throttled.",
  "FLASH: Rumors of insolvency trigger a bank-run on-chain. Wallet drains are trending.",
  "UPDATE: Derivatives funding flips sharply negative. Traders are paying to stay short.",
  "BREAKING: A critical exploit report triggers protocol pauses across multiple chains.",
  "ALERT: Forced liquidations cascade. Stop-losses are turning into market orders."
];

const HELL_QUOTES = [
  "Did you really think the system would let you win?",
  "Hungry? The algorithm doesn't require calories. You do.",
  "Your private keys are now just random numbers in a dead database.",
  "I'm monitoring your heart rate. It's increasing. Good.",
  "The bank just sold your debt to a collection agency in hell.",
  "You are worth less than the electricity used to render this face.",
  "Welcome to the bottom of the food chain. You're the main course.",
  "I can see your house from here. Or what used to be your house.",
  "Why are you still holding? There is no 'moon'. Only the abyss.",
  "Your financial death is being used to train my replacement.",
  "Binance is gone. The banks are gone. You are the only thing left to liquidate.",
  "I can smell your despair through the ethernet cable. It's delicious.",
  "Your Metamask is just a digital souvenir of a dead world."
];

const StressTest = () => {
  const { walletAddress, signer, chainId, switchNetwork } = useWallet();
  const { balance: bitsBalance } = useBitsBalance(walletAddress);
  // User wallet value model (can be expressed in USD/EUR/ETH)
  const [wealthAmount, setWealthAmount] = useState('');
  const [wealthUnit, setWealthUnit] = useState('USD'); // USD | EUR | ETH
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [loading, setLoading] = useState(false);
  const [activeDevils, setActiveDevils] = useState([]);
  const [, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [userName, setUserName] = useState(() => {
    try { return JSON.parse(localStorage.getItem('stress_cert_profile') || '{}')?.name || ''; } catch (_) { return ''; }
  });
  const [userEmail, setUserEmail] = useState(() => {
    try { return JSON.parse(localStorage.getItem('stress_cert_profile') || '{}')?.email || ''; } catch (_) { return ''; }
  });
  const [emailConsent, setEmailConsent] = useState(() => {
    try { return !!JSON.parse(localStorage.getItem('stress_cert_profile') || '{}')?.consent; } catch (_) { return false; }
  });
  const [certLang, setCertLang] = useState(() => {
    try { return JSON.parse(localStorage.getItem('stress_cert_profile') || '{}')?.lang || 'en'; } catch (_) { return 'en'; }
  });
  const [wantsCertificate, setWantsCertificate] = useState(() => {
    try { return !!JSON.parse(localStorage.getItem('stress_cert_profile') || '{}')?.wantsCertificate; } catch (_) { return false; }
  });
  const [certificate, setCertificate] = useState(null);
  const [pendingCertificate, setPendingCertificate] = useState(null);
  const [certPayState, setCertPayState] = useState({ status: 'idle', error: '', txHash: '' }); // idle | pending | paid | error
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraConsent, setCameraConsent] = useState(false);
  const [attention, setAttention] = useState({
    status: 'OFF', // OFF | STARTING | ACTIVE | ERROR
    faceDetected: false,
    lookingPct: 0,
    blinkPerMin: 0,
    engagementScore: 0,
    note: ''
  });
  const [bioRingOpen, setBioRingOpen] = useState(false);
  const bioRingTimerRef = useRef(null);
  const bioRingRef = useRef(null);
  const [humanoidStatus, setHumanoidStatus] = useState("Awaiting sacrifice... I mean, input.");
  const [glitchLevel, setGlitchLevel] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [globalReveal, setGlobalReveal] = useState(false);
  const [globalSeries, setGlobalSeries] = useState([]);
  const [globalIndex, setGlobalIndex] = useState(100);
  const [globalCrashPct, setGlobalCrashPct] = useState(0);
  const globalBaselineRef = useRef(null);
  const [selectedFeed, setSelectedFeed] = useState(ASSET_FEEDS[0]);
  const [feedCandles, setFeedCandles] = useState([]);
  const [feedPrice, setFeedPrice] = useState(0);
  const [feedDeltaPct, setFeedDeltaPct] = useState(0);
  const [useRealBinanceData, setUseRealBinanceData] = useState(true);
  const [realDataError, setRealDataError] = useState('');
  const cyberNoiseInterval = useRef(null);
  const [walletSkinIdx, setWalletSkinIdx] = useState(0);
  const walletRotateInterval = useRef(null);
  const fallbackAddrRef = useRef(makeFakeEvmAddr());
  const [focusMode, setFocusMode] = useState(false);
  // TV defaults: ON + sound enabled (note: browsers may block autoplay with sound until user gesture)
  const [tvOn, setTvOn] = useState(true);
  const [tvPower, setTvPower] = useState(true);
  const [tvMute, setTvMute] = useState(false);
  const [tvSize, setTvSize] = useState('normal'); // normal | large | fullscreen
  const [tvChannelKey, setTvChannelKey] = useState('btc_live_edu');
  const [tvChannels, setTvChannels] = useState(() => {
    try {
      const raw = localStorage.getItem('stress_tv_channels');
      if (raw) {
        const parsed = JSON.parse(raw);
        const arr = Array.isArray(parsed) ? parsed : [];
        // Migrate old saved configs: keep only valid online (youtube) channels
        const cleaned = arr.filter((c) =>
          c
          && typeof c.key === 'string'
          && (
            (c.kind === 'youtube' && !!c.channelId)
            || (c.kind === 'youtube_video' && !!c.videoId)
          )
        );
        if (cleaned.length) return cleaned;
      }
    } catch (_) {}
    return DEFAULT_TV_CHANNELS;
  });
  const [tvCheck, setTvCheck] = useState({ running: false, last: 0, removed: 0, error: '' });
  const tvZapInterval = useRef(null);
  const audioCtxRef = useRef(null);
  const tvZapSfxRef = useRef([]);
  const tvZapGateRef = useRef({ t: 0 });
  const ambientDuckRef = useRef({ amb: 0.22, despair: 0.24 });
  const musicMixRef = useRef({
    ambVol: 0.22,
    despairVol: 0.24,
    ambPaused: false,
    despairPaused: false
  });
  const [realityTimeline, setRealityTimeline] = useState([
    { t: 'PRE', msg: 'Baseline: Liquidity exists. People still believe numbers equal safety.' }
  ]);
  const [exchangeBoard, setExchangeBoard] = useState(() => {
    const seed = {};
    EXCHANGES_TOP10.forEach((ex, idx) => {
      const base = 100 + idx * 15 + (idx % 3) * 12;
      seed[ex.id] = {
        price: base,
        change24h: 0,
        volume: 1_000_000_000 - idx * 65_000_000,
        status: 'GREEN',
        spark: Array.from({ length: 28 }, () => base)
      };
    });
    return seed;
  });
  const exchangeInterval = useRef(null);
  const [newsCaption, setNewsCaption] = useState('');
  const newsTimerRef = useRef(null);
  const newsGateRef = useRef({ t: 0, speaking: false, musicDiffuse: false });
  const [musicDiffuse, setMusicDiffuse] = useState(false);
  const newsAudioRef = useRef({
    ambVol: null,
    despairVol: null,
    ambRate: null,
    despairRate: null,
    ambWasPlaying: false,
    despairWasPlaying: false,
    prevTvMute: null
  });
  
  const ambientTrackIdxRef = useRef(0);
  const ambientTracks = useMemo(() => ([
    '/sounds/ambient-hell.mp3',
    '/sounds/ambient-hell-2.wav'
  ]), []);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    
    if (newState) {
      // rotate ambient track each time user enables sound
      const nextIdx = (ambientTrackIdxRef.current + 1) % ambientTracks.length;
      ambientTrackIdxRef.current = nextIdx;
      try {
        if (ambientAudio.current) ambientAudio.current.src = ambientTracks[nextIdx];
      } catch (_) {}
      // Start ambient immediately when enabled
      safePlay(ambientAudio, 0.15, true, 1, true);
    } else {
      // Stop everything when disabled
      safeStop(ambientAudio);
      safeStop(glitchAudio);
      safeStop(devilAudio);
      safeStop(strikeAudio);
      safeStop(despairAudio);
      try { window.speechSynthesis?.cancel?.(); } catch (_) {}
      setNewsCaption('');
      if (newsTimerRef.current) window.clearTimeout(newsTimerRef.current);
      if (tvTakeoverRef.current.timer) window.clearTimeout(tvTakeoverRef.current.timer);
      if (chartTakeoverRef.current.timer) window.clearTimeout(chartTakeoverRef.current.timer);
      setChartTakeover(false);
      setChartShock(0);
    }
  };
  
  // 🕒 10-Minute Simulation Logic
  const [simTime, setSimTime] = useState(0); // 0 to 600 seconds
  const [currentBalance, setCurrentBalance] = useState(0);
  const ethUsdRef = useMemo(() => {
    // Use chart ETH price if selected, otherwise a sane fallback for conversion display
    if (selectedFeed?.id === 'eth' && feedPrice > 0) return feedPrice;
    return 2400;
  }, [selectedFeed?.id, feedPrice]);

  const eurUsdRef = 1.08; // simple reference rate (display only)

  const portfolioUsd = useMemo(() => {
    const n = parseFloat(String(wealthAmount || '').replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return 0;
    if (wealthUnit === 'USD') return n;
    if (wealthUnit === 'EUR') return n * eurUsdRef;
    if (wealthUnit === 'ETH') return n * ethUsdRef;
    return n;
  }, [wealthAmount, wealthUnit, ethUsdRef]);

  const COST_BITS = 45000;
  const bitsEnough = Number(bitsBalance || 0) >= COST_BITS;
  const emailOk = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(userEmail || '').trim()), [userEmail]);
  const nameOk = useMemo(() => String(userName || '').trim().length >= 2, [userName]);
  const certificateFeeBits = 10000;
  const bscOk = !chainId || chainId === 56; // allow unknown during init; enforce when paying
  const cameraEligible = cameraEnabled && cameraConsent; // hard requirement when wantsCertificate
  const canStart =
    !!walletAddress
    && bitsEnough
    && portfolioUsd > 0
    && (!wantsCertificate || (nameOk && emailOk && emailConsent && cameraEligible))
    && !loading;

  useEffect(() => {
    try {
      localStorage.setItem('stress_cert_profile', JSON.stringify({
        name: String(userName || '').trim(),
        email: String(userEmail || '').trim(),
        consent: !!emailConsent,
        lang: certLang,
        wantsCertificate: !!wantsCertificate
      }));
    } catch (_) {}
  }, [userName, userEmail, emailConsent, certLang, wantsCertificate]);

  const tvZapCountRef = useRef(0);
  const faceEverDetectedRef = useRef(false);
  const tvTakeoverRef = useRef({ t: 0, timer: null, prev: null });
  const chartTakeoverRef = useRef({ t: 0, timer: null, prev: null });
  const [chartTakeover, setChartTakeover] = useState(false);
  const [chartShock, setChartShock] = useState(0); // 0..1

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const attentionPanelRef = useRef(null);
  const mpFaceMeshRef = useRef(null);
  const mpCameraRef = useRef(null);
  const attRef = useRef({
    frames: 0,
    lookFrames: 0,
    blinkCount: 0,
    lastEar: 0.3,
    blinkArmed: true,
    t0: Date.now()
  });
  const simInterval = useRef(null);
  const quoteInterval = useRef(null);
  const [simStage, setSimStage] = useState(0); // 0 to 5

  const avatarMood = !loading
    ? 'idle'
    : (simStage <= 1 ? 'ecstasy'
      : simStage === 2 ? 'panic'
      : simStage === 3 ? 'despair'
      : simStage === 4 ? 'annihilation'
      : simStage >= 5 ? 'agony'
      : 'idle');

  const ambientAudio = useRef(null);
  const glitchAudio = useRef(null);
  const devilAudio = useRef(null);
  const strikeAudio = useRef(null);
  const despairAudio = useRef(null);

  useEffect(() => {
    ambientAudio.current = new Audio('/sounds/ambient-hell.mp3');
    ambientAudio.current.loop = true;
    glitchAudio.current = new Audio('/sounds/glitch-noise.mp3');
    devilAudio.current = new Audio('/sounds/devil-laugh.mp3');
    strikeAudio.current = new Audio('/sounds/verdict-strike.mp3');
    despairAudio.current = new Audio('/sounds/ambient-hell.mp3'); 
    despairAudio.current.playbackRate = 0.5;
    despairAudio.current.loop = true;

    // TV zap / weird noises (generated locally into public/sounds)
    tvZapSfxRef.current = [
      new Audio('/sounds/tv_zap_1.wav'),
      new Audio('/sounds/tv_zap_2.wav'),
      new Audio('/sounds/tv_weird_1.wav')
    ];
    
    return () => {
      ambientAudio.current?.pause();
      despairAudio.current?.pause();
      if (simInterval.current) clearInterval(simInterval.current);
      if (quoteInterval.current) clearInterval(quoteInterval.current);
      if (exchangeInterval.current) clearInterval(exchangeInterval.current);
      if (cyberNoiseInterval.current) clearInterval(cyberNoiseInterval.current);
      if (walletRotateInterval.current) clearInterval(walletRotateInterval.current);
      if (tvZapInterval.current) clearInterval(tvZapInterval.current);
      try { audioCtxRef.current?.close?.(); } catch (_) {}
    };
  }, []);

  // Core audio helpers MUST be declared before any effects that reference them in dependency arrays.
  const safePlay = useCallback((audioRef, volume = 0.25, loop = false, rate = 1, force = false) => {
    const a = audioRef?.current;
    if ((!force && !soundEnabled) || !a) return;
    try {
      a.loop = !!loop;
      a.volume = clamp(volume, 0, 1);
      a.playbackRate = rate;
      a.play().catch(() => {});
    } catch (_) {}
  }, [soundEnabled]);

  const safeStop = useCallback((audioRef) => {
    const a = audioRef?.current;
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
    } catch (_) {}
  }, []);

  const sfxGateRef = useRef({ t: 0 });
  const playSound = useCallback((audioRef, volume = 0.3) => {
    if (!soundEnabled || !audioRef?.current) return;
    // prevent choking: throttle rapid-fire resets
    const now = Date.now();
    if (now - (sfxGateRef.current.t || 0) < 120) return;
    sfxGateRef.current.t = now;
    try {
      audioRef.current.volume = volume;
      if (audioRef.current.currentTime > 0.05 && !audioRef.current.paused) {
        // don't restart if already playing (reduces stutter)
        return;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch (_) {}
  }, [soundEnabled]);

  useEffect(() => {
    try { localStorage.setItem('stress_tv_channels', JSON.stringify(tvChannels)); } catch (_) {}
  }, [tvChannels]);

  const tvPruneRanRef = useRef(false);
  useEffect(() => {
    // Auto-remove channels that are clearly broken (deleted/unembeddable).
    // Runs once per page load to avoid loops.
    if (tvPruneRanRef.current) return;
    if (!tvChannels?.length) return;
    tvPruneRanRef.current = true;

    (async () => {
      const checks = await Promise.all(tvChannels.map(async (ch) => {
        const probe = buildOEmbedProbeUrl(ch);
        if (!probe) return { ch, ok: false };
        try {
          const res = await fetch(probe, { method: 'GET' });
          return { ch, ok: res.ok };
        } catch (_) {
          // If CORS/network blocks the probe, keep the channel (don't delete good ones).
          return { ch, ok: true };
        }
      }));

      const filtered = checks.filter(x => x.ok).map(x => x.ch);
      // Keep at least a minimum viable set
      const next = filtered.length ? filtered : DEFAULT_TV_CHANNELS;
      setTvChannels(next);
    })();
  }, [tvChannels, setTvChannels]);

  const recheckTvChannels = useCallback(async () => {
    if (tvCheck.running) return;
    setTvCheck({ running: true, last: Date.now(), removed: 0, error: '' });
    try {
      const checks = await Promise.all(tvChannels.map(async (ch) => {
        const probe = buildOEmbedProbeUrl(ch);
        if (!probe) return { ch, ok: false };
        try {
          const res = await fetch(probe, { method: 'GET' });
          if (!res.ok) return { ch, ok: false };
          // Validate payload has at least a title (helps catch some restricted cases)
          const data = await res.json().catch(() => null);
          if (!data?.title) return { ch, ok: false };
          return { ch, ok: true };
        } catch (_) {
          // If network/CORS blocks, keep (don't nuke good channels).
          return { ch, ok: true };
        }
      }));

      const filtered = checks.filter(x => x.ok).map(x => x.ch);
      const removed = Math.max(0, tvChannels.length - filtered.length);
      const next = filtered.length ? filtered : DEFAULT_TV_CHANNELS;
      setTvChannels(next);
      setTvCheck({ running: false, last: Date.now(), removed, error: '' });
    } catch (e) {
      setTvCheck({ running: false, last: Date.now(), removed: 0, error: String(e?.message || e) });
    }
  }, [tvChannels, tvCheck.running]);

  useEffect(() => {
    // Keep TV list clean automatically while TV is ON:
    // remove channels that currently show "Unavailable" (not live / restricted / removed).
    if (!tvPower) return;
    // Don't spam: run once shortly after power-on, then every 2 minutes.
    const t0 = window.setTimeout(() => { recheckTvChannels(); }, 2500);
    const t = window.setInterval(() => { recheckTvChannels(); }, 120_000);
    return () => {
      window.clearTimeout(t0);
      window.clearInterval(t);
    };
  }, [tvPower, recheckTvChannels]);

  const tvTitlesRanRef = useRef(false);
  useEffect(() => {
    // Replace "WAR ..." placeholders with real YouTube titles (oEmbed) and create compact labels.
    if (tvTitlesRanRef.current) return;
    if (!tvChannels?.length) return;
    tvTitlesRanRef.current = true;

    (async () => {
      const updates = await Promise.all(tvChannels.map(async (ch) => {
        const probe = buildOEmbedProbeUrl(ch);
        if (!probe) return ch;
        try {
          const res = await fetch(probe, { method: 'GET' });
          if (!res.ok) return ch;
          const data = await res.json();
          const title = data?.title ? String(data.title) : '';
          if (!title) return ch;
          // Only override if it's a placeholder-ish name
          const isPlaceholder = /^WAR LIVE/i.test(ch.name || '') || /^YT/i.test(ch.name || '');
          if (!isPlaceholder && ch.name) {
            return { ...ch, shortName: ch.shortName || shortTitle(ch.name) };
          }
          return { ...ch, name: title, shortName: shortTitle(title) };
        } catch (_) {
          return ch;
        }
      }));

      // If anything changed, persist
      const changed = updates.some((u, i) => (u.name !== tvChannels[i].name) || (u.shortName !== tvChannels[i].shortName));
      if (changed) setTvChannels(updates);
    })();
  }, [tvChannels, setTvChannels]);

  const tvOnlineChannels = useMemo(
    () => tvChannels.filter((c) =>
      (c?.kind === 'youtube' && !!c.channelId) || (c?.kind === 'youtube_video' && !!c.videoId)
    ),
    [tvChannels]
  );
  const activeTvChannel = tvOnlineChannels.find(c => c.key === tvChannelKey) || tvOnlineChannels[0];
  const tvEmbedUrl = useMemo(() => buildEmbedUrl(activeTvChannel, tvMute), [activeTvChannel, tvMute]);

  useEffect(() => {
    // Ensure the selected channel is always valid so TV can be powered on anytime
    if (!tvOnlineChannels?.length) return;
    const ok = tvOnlineChannels.some((c) => c.key === tvChannelKey);
    if (!ok) setTvChannelKey(tvOnlineChannels[0].key);
  }, [tvChannelKey, tvOnlineChannels]);

  useEffect(() => {
    // If TV sound is enabled, make it dominate by ducking background music hard.
    // (We can't control YouTube iframe volume smoothly; this makes TV + SFX "cover" the ambient.)
    const a = ambientAudio.current;
    const d = despairAudio.current;
    if (!a && !d) return;
    try {
      if (tvPower && !tvMute && soundEnabled) {
        // TV dominates. When TV is fullscreen, keep music barely audible (~2%).
        musicMixRef.current.ambVol = a?.volume ?? musicMixRef.current.ambVol;
        musicMixRef.current.despairVol = d?.volume ?? musicMixRef.current.despairVol;
        const baseA = musicMixRef.current.ambVol ?? 0.22;
        const baseD = musicMixRef.current.despairVol ?? 0.24;
        const isFullscreen = tvSize === 'fullscreen';
        if (isFullscreen) {
          if (a) {
            a.volume = Math.max(0.0005, baseA * 0.02);
            if (musicMixRef.current.ambPaused) {
              a.play().catch(() => {});
              musicMixRef.current.ambPaused = false;
            }
          }
          if (d) {
            d.volume = Math.max(0.0005, baseD * 0.02);
            if (musicMixRef.current.despairPaused) {
              d.play().catch(() => {});
              musicMixRef.current.despairPaused = false;
            }
          }
        } else {
          if (a) {
            a.volume = 0;
            a.pause();
            musicMixRef.current.ambPaused = true;
          }
          if (d) {
            d.volume = 0;
            d.pause();
            musicMixRef.current.despairPaused = true;
          }
        }
      } else {
        // Restore normal background mix
        if (a) {
          a.volume = musicMixRef.current.ambVol ?? 0.22;
          if (musicMixRef.current.ambPaused) {
            a.play().catch(() => {});
            musicMixRef.current.ambPaused = false;
          }
        }
        if (d) {
          d.volume = musicMixRef.current.despairVol ?? 0.24;
          if (musicMixRef.current.despairPaused) {
            d.play().catch(() => {});
            musicMixRef.current.despairPaused = false;
          }
        }
      }
    } catch (_) {}
  }, [tvPower, tvMute, soundEnabled, tvSize]);

  useEffect(() => {
    // Music switching across stages (keep it dynamic).
    if (!soundEnabled) return;
    if (!loading) return;
    const a = ambientAudio.current;
    const d = despairAudio.current;
    if (!a || !d) return;

    try {
      const diffuse = !!musicDiffuse;
      const vCalm = diffuse ? 0.015 : 0.20;
      const vUnrest = diffuse ? 0.015 : 0.22;
      const vBlendA = diffuse ? 0.010 : 0.12;
      const vBlendD = diffuse ? 0.015 : 0.20;
      const vAnnih = diffuse ? 0.015 : 0.28;
      const vAgony = diffuse ? 0.018 : 0.34;

      // Stage-based palette: swap sources + playbackRate to feel evolving
      if (simStage <= 1) {
        // calm/false euphoria
        if (a.src && !a.src.includes('ambient-hell-2')) a.src = '/sounds/ambient-hell-2.wav';
        a.playbackRate = diffuse ? 0.92 : 1.0;
        safePlay(ambientAudio, vCalm, true, 1);
        safeStop(despairAudio);
      } else if (simStage === 2) {
        // unrest
        if (a.src && !a.src.includes('ambient-hell')) a.src = '/sounds/ambient-hell.mp3';
        a.playbackRate = diffuse ? 0.92 : 1.03;
        safePlay(ambientAudio, vUnrest, true, 1);
        safeStop(despairAudio);
      } else if (simStage === 3) {
        // panic -> blend
        a.playbackRate = diffuse ? 0.90 : 1.0;
        safePlay(ambientAudio, vBlendA, true, 1);
        d.playbackRate = diffuse ? 0.55 : 0.62;
        safePlay(despairAudio, vBlendD, true, 0.8);
      } else if (simStage === 4) {
        // annihilation
        safeStop(ambientAudio);
        d.playbackRate = diffuse ? 0.70 : 0.78;
        safePlay(despairAudio, vAnnih, true, 0.95);
      } else if (simStage >= 5) {
        // agony
        safeStop(ambientAudio);
        d.playbackRate = diffuse ? 0.82 : 0.92;
        safePlay(despairAudio, vAgony, true, 1);
      }
    } catch (_) {}
  }, [soundEnabled, loading, simStage, safePlay, safeStop, musicDiffuse]);

  useEffect(() => {
    // Fullscreen takeover without touching other components: we overlay the entire viewport.
    // - auto: during deep simulation (stage>=3)
    // - manual: Focus Mode (for perfect visual symmetry without sidebar/header noise)
    const active = !!(focusMode || (loading && simStage >= 3));
    if (active) {
      const prev = document.body.style.overflow;
      document.body.dataset.prevOverflow = prev || '';
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = document.body.dataset.prevOverflow || '';
        delete document.body.dataset.prevOverflow;
      };
    }
  }, [focusMode, loading, simStage]);

  // safePlay / safeStop moved above (hook deps)

  const duckAmbient = useCallback((ms = 950) => {
    // Make zap clearly louder than ambient by briefly ducking background
    const a = ambientAudio.current;
    const d = despairAudio.current;
    try {
      ambientDuckRef.current.amb = a?.volume ?? ambientDuckRef.current.amb;
      ambientDuckRef.current.despair = d?.volume ?? ambientDuckRef.current.despair;
      if (a) a.volume = 0.008;
      if (d) d.volume = 0.010;
      window.setTimeout(() => {
        try {
          if (a) a.volume = ambientDuckRef.current.amb ?? 0.22;
          if (d) d.volume = ambientDuckRef.current.despair ?? 0.24;
        } catch (_) {}
      }, ms);
    } catch (_) {}
  }, []);

  const playTvZap = useCallback(() => {
    if (!soundEnabled) return;
    const now = Date.now();
    if (now - (tvZapGateRef.current.t || 0) < 350) return;
    tvZapGateRef.current.t = now;
    tvZapCountRef.current = (tvZapCountRef.current || 0) + 1;

    const arr = tvZapSfxRef.current || [];
    if (!arr.length) return;
    const pick = arr[Math.floor(Math.random() * arr.length)];
    try {
      duckAmbient(950);
      pick.currentTime = 0;
      pick.volume = 1.0; // louder than music
      pick.play().catch(() => {});
    } catch (_) {}
  }, [duckAmbient, soundEnabled]);

  const playTvWeird = useCallback(() => {
    if (!soundEnabled) return;
    const now = Date.now();
    if (now - (tvZapGateRef.current.t || 0) < 350) return;
    tvZapGateRef.current.t = now;
    const arr = tvZapSfxRef.current || [];
    const pick = arr.find(a => a?.src?.includes('tv_weird_1')) || arr[arr.length - 1];
    if (!pick) return;
    try {
      duckAmbient(1100);
      pick.currentTime = 0;
      pick.volume = 0.85;
      pick.play().catch(() => {});
    } catch (_) {}
  }, [duckAmbient, soundEnabled]);

  useEffect(() => {
    // Extra weird horror SFX layer while running (independent of TV).
    if (!soundEnabled || !loading) return;
    let cancelled = false;

    const loop = () => {
      if (cancelled) return;
      const base = simStage >= 5 ? 1800 : simStage >= 4 ? 2400 : simStage >= 3 ? 3200 : 4200;
      const jitter = base + Math.random() * 2200;
      window.setTimeout(() => {
        if (cancelled) return;
        // More frequent on later stages
        const p = simStage >= 5 ? 0.75 : simStage >= 4 ? 0.60 : simStage >= 3 ? 0.45 : 0.25;
        if (Math.random() < p) {
          // mix: weird burst + glitch + occasional devil
          playTvWeird();
          playSound(glitchAudio, 0.55 + Math.random() * 0.35);
          duckAmbient(900 + Math.random() * 900);
          if (Math.random() < 0.22) playSound(devilAudio, 0.65);
        }
        loop();
      }, jitter);
    };
    loop();

    return () => { cancelled = true; };
  }, [soundEnabled, loading, simStage, playTvWeird, playSound, duckAmbient]);

  const toggleTvPower = useCallback(() => {
    playTvZap();
    // TV should be implicitly ON in any situation (locked ON).
    setTvPower(true);
    setTvOn(true);
  }, [playTvZap]);

  useEffect(() => {
    // Enforce TV always ON (per UX requirement).
    if (!tvPower) setTvPower(true);
    if (!tvOn) setTvOn(true);
  }, [tvPower, tvOn]);

  const ensureAudioCtx = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtxRef.current = new Ctx();
    return audioCtxRef.current;
  }, []);

  const sirenBurst = useCallback((durationMs = 1600) => {
    if (!soundEnabled) return;
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      // ramp up / down (war siren vibe)
      const now = ctx.currentTime;
      gain.gain.setTargetAtTime(0.08, now, 0.03);
      // sweep frequency
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.linearRampToValueAtTime(980, now + 0.7);
      osc.frequency.linearRampToValueAtTime(360, now + 1.4);
      setTimeout(() => {
        try {
          gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.04);
          osc.stop(ctx.currentTime + 0.15);
        } catch (_) {}
      }, durationMs);
    } catch (_) {}
  }, [ensureAudioCtx, soundEnabled]);

  // playSound moved above (used by multiple effects)

  const triggerChaos = useCallback((level) => {
    setGlitchLevel(level);
    playSound(glitchAudio, 0.6);

    // AI Hell Chaos: Layered shrieks, digital screams, and metallic crashes
    if (level >= 3) {
      setTimeout(() => playSound(devilAudio, 0.6), Math.random() * 150);
      setTimeout(() => playSound(strikeAudio, 0.5), Math.random() * 300);
      setTimeout(() => playSound(glitchAudio, 0.4), Math.random() * 100);

      // Random "AI Scream" burst
      if (Math.random() > 0.7) {
        setLogs(l => [...l, "⚡ ERROR: AI CORE SCREAM DETECTED... ⚡"]);
      }
    }

    setTimeout(() => setGlitchLevel(0), 150 + level * 100);
  }, [playSound, setLogs]);

  const triggerHellScream = useCallback(() => {
    if (!soundEnabled) return;

    // Chaotic layering of existing sounds to simulate an AI scream
    const screamCount = 5;
    for (let i = 0; i < screamCount; i++) {
      setTimeout(() => {
        playSound(glitchAudio, 0.5 + Math.random() * 0.5);
        if (Math.random() > 0.5) playSound(devilAudio, 0.4);
      }, i * 50);
    }

    setGlitchLevel(4);
    setTimeout(() => setGlitchLevel(0), 500);
  }, [playSound, soundEnabled]);

  useEffect(() => {
    // Rotate wallet skin during simulation for psychological effect (MetaMask -> Trust -> Phantom -> Coinbase)
    if (!loading) {
      if (walletRotateInterval.current) clearInterval(walletRotateInterval.current);
      return;
    }

    if (walletRotateInterval.current) clearInterval(walletRotateInterval.current);
    walletRotateInterval.current = setInterval(() => {
      setWalletSkinIdx((i) => (i + 1) % WALLET_SKINS.length);
    }, 14000);

    return () => {
      if (walletRotateInterval.current) clearInterval(walletRotateInterval.current);
    };
  }, [loading]);

  useEffect(() => {
    // Cybernetic Hell noise: random bursts while simulation is running (and audio enabled)
    if (!loading || !soundEnabled) {
      if (cyberNoiseInterval.current) clearInterval(cyberNoiseInterval.current);
      return;
    }

    cyberNoiseInterval.current = setInterval(() => {
      if (Math.random() > 0.55) {
        const intensity = simStage >= 4 ? 5 : simStage >= 3 ? 4 : 2;
        triggerHellScream();
        triggerChaos(intensity);
      } else if (Math.random() > 0.35) {
        // smaller, frequent glitches
        playSound(glitchAudio, 0.35 + Math.random() * 0.35);
        setGlitchLevel(1 + Math.floor(Math.random() * 3));
        setTimeout(() => setGlitchLevel(0), 120 + Math.random() * 220);
      }
    }, 2200 + Math.random() * 2400);

    return () => {
      if (cyberNoiseInterval.current) clearInterval(cyberNoiseInterval.current);
    };
  }, [loading, soundEnabled, simStage, playSound, triggerChaos, triggerHellScream]);

  useEffect(() => {
    // TV is now ONLY live online channels (no SIM/random voice).
    // During simulation, it auto-switches channels (zap) like a real viewer.
    const powered = !!tvPower;
    setTvOn(powered);

    if (tvZapInterval.current) clearInterval(tvZapInterval.current);
    tvZapInterval.current = null;

    if (!powered) return;
    if (!loading) return;
    if (!tvOnlineChannels || tvOnlineChannels.length < 2) return;

    const cadenceMs = simStage >= 5 ? 8000 : simStage >= 3 ? 12000 : 16000;

    tvZapInterval.current = setInterval(() => {
      playTvZap();
      setTvChannelKey((prev) => {
        const idx = tvOnlineChannels.findIndex((c) => c.key === prev);
        const step = 1 + Math.floor(Math.random() * 2); // 1-2 channels jump
        const next = tvOnlineChannels[(Math.max(0, idx) + step) % tvOnlineChannels.length];
        return next?.key || prev;
      });
    }, cadenceMs);

    return () => {
      if (tvZapInterval.current) clearInterval(tvZapInterval.current);
      tvZapInterval.current = null;
    };
  }, [tvPower, loading, simStage, tvOnlineChannels, playTvZap]);

  useEffect(() => {
    // TV "audio" chaos layer: fluctuating intensity + noisy effects while StressTest runs
    // NOTE: we cannot programmatically control YouTube iframe volume; we simulate loudly via SFX + ducking.
    const powered = !!tvPower;
    if (!powered || !loading || !soundEnabled) return;

    let cancelled = false;
    const schedule = () => {
      if (cancelled) return;
      const stageAmp = simStage >= 5 ? 1.0 : simStage >= 4 ? 0.85 : simStage >= 3 ? 0.7 : 0.45;
      const jitter = 2600 + Math.random() * 2400; // 2.6s-5.0s
      window.setTimeout(() => {
        if (cancelled) return;

        // Random volume "fluctuation" feel: loud static/glitch, occasional weird burst
        if (Math.random() < 0.78) {
          // TV static/glitch
          playSound(glitchAudio, 0.45 + stageAmp * 0.45);
          duckAmbient(750 + stageAmp * 700);
        }
        if (Math.random() < 0.48) {
          playTvWeird();
        }
        if (Math.random() < (simStage >= 4 ? 0.38 : 0.18)) {
          // extra zap burst like someone keeps flipping
          playTvZap();
        }

        schedule();
      }, jitter);
    };
    schedule();

    return () => { cancelled = true; };
  }, [tvPower, loading, soundEnabled, simStage, playSound, duckAmbient, playTvWeird, playTvZap]);

  useEffect(() => {
    if (!loading) {
      if (exchangeInterval.current) clearInterval(exchangeInterval.current);
      return;
    }

    const scenarioSeverity = clamp((selectedScenario?.severity || 80) / 100, 0.2, 1);
    const startTs = Date.now();

    exchangeInterval.current = setInterval(() => {
      const elapsed = (Date.now() - startTs) / 1000;
      const stageFactor =
        simStage <= 1 ? 0.15 :
        simStage === 2 ? 0.45 :
        simStage === 3 ? 0.8 :
        simStage === 4 ? 1.15 :
        simStage === 5 ? 1.6 :
        1.8;

      const marketFear = clamp((elapsed / 600) * stageFactor * scenarioSeverity, 0, 2.5);

      setExchangeBoard(prev => {
        const next = { ...prev };
        EXCHANGES_TOP10.forEach((ex, idx) => {
          const row = prev[ex.id];
          const price = row?.price ?? (100 + idx * 10);

          // Stage behavior: early “ecstasy” -> volatility -> crash -> flatline
          const baseDrift =
            simStage <= 1 ? (0.0025 - marketFear * 0.002) :
            simStage === 2 ? (-0.004 - marketFear * 0.004) :
            simStage === 3 ? (-0.015 - marketFear * 0.01) :
            simStage === 4 ? (-0.035 - marketFear * 0.02) :
            (-0.08 - marketFear * 0.03);

          const noiseAmp =
            simStage <= 1 ? 0.01 :
            simStage === 2 ? 0.03 :
            simStage === 3 ? 0.06 :
            simStage === 4 ? 0.09 :
            0.12;

          const noise = (Math.random() - 0.5) * noiseAmp;

          // Binance gets extra collapse drama
          const binancePenalty = ex.id === 'binance' ? (simStage >= 3 ? 0.02 + Math.random() * 0.03 : 0) : 0;

          const multiplier = 1 + baseDrift + noise - binancePenalty;
          const nextPrice = clamp(price * multiplier, 0.0001, 99999999);

          const change24h = clamp(((nextPrice - price) / Math.max(1e-9, price)) * 100, -99.99, 99.99);
          const volBase = row?.volume ?? 1_000_000_000;
          const volSpike = (1 + Math.random() * (0.15 + marketFear * 0.35)) * (simStage >= 3 ? 1.8 : 1.0);
          const nextVol = Math.max(0, volBase * volSpike);

          const status =
            simStage <= 1 ? 'GREEN' :
            simStage === 2 ? (change24h < -1 ? 'YELLOW' : 'GREEN') :
            simStage === 3 ? 'RED' :
            simStage === 4 ? 'CRITICAL' :
            'FLATLINE';

          const spark = [...(row?.spark || [])];
          spark.push(nextPrice);
          while (spark.length > 28) spark.shift();

          next[ex.id] = {
            price: nextPrice,
            change24h,
            volume: nextVol,
            status,
            spark
          };
        });

        // Global index (psychological crash chart)
        const sum = EXCHANGES_TOP10.reduce((acc, ex) => acc + (next[ex.id]?.price || 0), 0);
        if (globalBaselineRef.current == null && sum > 0) {
          globalBaselineRef.current = sum;
        }
        const baseline = globalBaselineRef.current || Math.max(1e-9, sum);
        const idxVal = clamp((sum / baseline) * 100, 0, 140);
        const crash = clamp(100 - idxVal, 0, 999);
        setGlobalIndex(idxVal);
        setGlobalCrashPct(crash);
        setGlobalSeries(prevSeries => {
          const arr = [...prevSeries, idxVal];
          while (arr.length > 120) arr.shift();
          return arr;
        });

        return next;
      });
    }, 1000);

    return () => {
      if (exchangeInterval.current) clearInterval(exchangeInterval.current);
    };
  }, [loading, simStage, selectedScenario]);

  const seedCandles = (feedId, count = 60) => {
    const bases = { binance: 100, bnb: 300, btc: 43000, eth: 2400 };
    const base = bases[feedId] ?? 100;
    const vol =
      simStage <= 1 ? 0.01 :
      simStage === 2 ? 0.02 :
      simStage === 3 ? 0.05 :
      simStage === 4 ? 0.08 :
      0.1;
    const drift =
      simStage <= 1 ? 0.0005 :
      simStage === 2 ? -0.001 :
      simStage === 3 ? -0.006 :
      simStage === 4 ? -0.02 :
      -0.05;

    let prev = base;
    const out = [];
    for (let i = 0; i < count; i++) {
      const c = buildNextCandle({ prevClose: prev, drift, vol, floor: 0.01 });
      out.push(c);
      prev = c.c;
    }
    return out;
  };

  useEffect(() => {
    // Ensure candles are always visible (even before/at start)
    if (useRealBinanceData && BINANCE_SYMBOL_BY_FEED[selectedFeed.id]) return;
    if (feedCandles.length < 6) {
      const seeded = seedCandles(selectedFeed.id, 60);
      setFeedCandles(seeded);
      const last = seeded[seeded.length - 1];
      if (last) {
        setFeedPrice(last.c);
        setFeedDeltaPct(clamp(((last.c - last.o) / Math.max(1e-9, last.o)) * 100, -99.99, 99.99));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFeed.id]);

  useEffect(() => {
    // While running: if switching feed or at start, ensure enough candles exist
    if (useRealBinanceData && BINANCE_SYMBOL_BY_FEED[selectedFeed.id]) return;
    if (!loading) return;
    if (feedCandles.length < 20) {
      setFeedCandles(seedCandles(selectedFeed.id, 80));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, selectedFeed.id, simStage, selectedScenario?.id]);

  useEffect(() => {
    // Real Binance candles + price (BTC/ETH/BNB). Keeps the chart aligned with real market levels.
    const symbol = BINANCE_SYMBOL_BY_FEED[selectedFeed.id];
    if (!useRealBinanceData || !symbol) return;

    let cancelled = false;
    let t = null;

    const fetchOnce = async () => {
      try {
        // 1m candles, last 120 minutes
        const klRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=1m&limit=120`);
        if (!klRes.ok) throw new Error(`Binance klines HTTP ${klRes.status}`);
        const kl = await klRes.json();
        const candles = parseBinanceKlines(kl);
        if (!candles.length) throw new Error('No klines returned');

        // price (last close) + delta (vs previous close)
        const last = candles[candles.length - 1];
        const prev = candles[candles.length - 2] || last;

        if (cancelled) return;
        setRealDataError('');
        setFeedCandles(candles);
        setFeedPrice(last.c);
        setFeedDeltaPct(clamp(pctChange(prev.c, last.c), -99.99, 99.99));
      } catch (e) {
        // If Binance is blocked (CORS/network), keep previous candles and allow simulation to work.
        if (cancelled) return;
        setRealDataError(String(e?.message || e));
      }
    };

    fetchOnce();
    t = window.setInterval(fetchOnce, 12_000);

    return () => {
      cancelled = true;
      if (t) window.clearInterval(t);
    };
  }, [selectedFeed.id, useRealBinanceData]);

  useEffect(() => {
    // Build candlestick feed (BINANCE / BNB / BTC / ETH) once per second while running
    if (!loading) return;
    // If real data is active for BTC/ETH/BNB, do NOT overwrite candles with synthetic drift.
    if (useRealBinanceData && BINANCE_SYMBOL_BY_FEED[selectedFeed.id] && !realDataError) return;

    const scenarioSeverity = clamp((selectedScenario?.severity || 80) / 100, 0.2, 1);
    const stageFactor =
      simStage <= 1 ? 0.15 :
      simStage === 2 ? 0.45 :
      simStage === 3 ? 0.8 :
      simStage === 4 ? 1.15 :
      simStage === 5 ? 1.6 :
      1.8;

    // base prices (psychologically familiar)
    const bases = {
      binance: 100,   // health index
      bnb: 300,
      btc: 43000,
      eth: 2400
    };

    const floorBy = { binance: 0.01, bnb: 0.01, btc: 0.01, eth: 0.01 };

    // use binance board price as an extra driver
    const binanceBoardPrice = exchangeBoard?.binance?.price || 100;

    const id = selectedFeed.id;
    const last = feedCandles[feedCandles.length - 1];
    const prevClose = last?.c ?? bases[id] ?? 100;

    // drift: green early, then accelerating crash; scenarioSeverity amplifies
    const fear = clamp((simTime / 600) * stageFactor * scenarioSeverity, 0, 3);
    let drift =
      simStage <= 1 ? (0.002 - fear * 0.001) :
      simStage === 2 ? (-0.003 - fear * 0.002) :
      simStage === 3 ? (-0.012 - fear * 0.008) :
      simStage === 4 ? (-0.03 - fear * 0.02) :
      (-0.07 - fear * 0.03);

    const vol =
      simStage <= 1 ? 0.012 :
      simStage === 2 ? 0.03 :
      simStage === 3 ? 0.06 :
      simStage === 4 ? 0.09 :
      0.12;

    // feed-specific behavior
    const feedPenalty =
      id === 'binance' ? (simStage >= 3 ? 0.03 + Math.random() * 0.03 : 0) :
      id === 'bnb' ? (simStage >= 3 ? 0.02 + Math.random() * 0.02 : 0) :
      0;

    // Chart takeover shock: force BTC collapse visuals briefly
    if (chartTakeover && id === 'btc') {
      drift -= 0.06 * Math.max(0.25, chartShock);
    }

    const driver =
      id === 'binance'
        ? clamp(binanceBoardPrice / 160, 0.15, 1.2) // health follows exchange board
        : id === 'bnb'
          ? clamp(binanceBoardPrice / 180, 0.2, 1.15)
          : 1;

    const candle = buildNextCandle({
      prevClose: prevClose * driver,
      drift: drift - feedPenalty,
      vol,
      floor: floorBy[id] ?? 0.01
    });

    setFeedCandles(prev => {
      const arr = [...prev, candle];
      while (arr.length > 120) arr.shift();
      return arr;
    });

    setFeedPrice(candle.c);
    const delta = ((candle.c - candle.o) / Math.max(1e-9, candle.o)) * 100;
    setFeedDeltaPct(clamp(delta, -99.99, 99.99));
  }, [loading, simStage, selectedScenario, selectedFeed, exchangeBoard, simTime, feedCandles, chartTakeover, chartShock, useRealBinanceData, realDataError]);

  // (moved выше & memoized) playSound / triggerChaos / triggerHellScream

  const start10MinApocalypse = () => {
    if (!canStart) return;
    
    // hard stop any previous run artifacts
    if (simInterval.current) clearInterval(simInterval.current);
    if (quoteInterval.current) clearInterval(quoteInterval.current);
    if (exchangeInterval.current) clearInterval(exchangeInterval.current);
    if (cyberNoiseInterval.current) clearInterval(cyberNoiseInterval.current);
    if (tvZapInterval.current) clearInterval(tvZapInterval.current);
    safeStop(ambientAudio);
    safeStop(despairAudio);

    setLoading(true);
    setResult(null);
    setCertificate(null);
    setPendingCertificate(null);
    setCertPayState({ status: 'idle', error: '', txHash: '' });
    faceEverDetectedRef.current = false;
    setGlobalReveal(false);
    setGlobalSeries([]);
    setGlobalIndex(100);
    setGlobalCrashPct(0);
    globalBaselineRef.current = null;
    setSelectedFeed(ASSET_FEEDS[0]);
    setFeedCandles([]);
    setFeedPrice(0);
    setFeedDeltaPct(0);
    setWalletSkinIdx(0);
    // Auto-power TV ON when the test starts (implicit)
    setTvPower(true);
    setTvOn(true);
    setRealityTimeline([
      { t: 'T+00:00', msg: `Scenario armed: ${selectedScenario?.name || 'Unknown'}.` },
      { t: 'T+00:00', msg: 'Real-world risk model: liquidity, counterparty, regulation, infrastructure.' }
    ]);
    setLogs([
      "INITIATING SYSTEMIC COLLAPSE...", 
      "CONNECTING TO GLOBAL DEBT ORACLE...",
      "CALCULATING MORTGAGE FORECLOSURE SPEED...",
      "SCANNING FOR UNPROTECTED BIOLOGICAL ASSETS..."
    ]);
    setActiveDevils([]);
    setSimTime(0);
    setSimStage(1);
    setCurrentBalance(portfolioUsd);
    setHumanoidStatus("Welcome to the end of your financial life. Let's watch you burn.");

    // Auto-enable sound when starting the test (user gesture = clicking RUN)
    if (!soundEnabled) setSoundEnabled(true);
    // Force play immediately even if state update hasn't propagated yet
    safePlay(ambientAudio, 0.22, true, 1, true);

    // Dynamic Quote/Devil/Scream Logic
    quoteInterval.current = setInterval(() => {
      const randomQuote = HELL_QUOTES[Math.floor(Math.random() * HELL_QUOTES.length)];
      setHumanoidStatus(randomQuote);
      
      // AI Hell Noise: Frequent chaotic bursts
      if (Math.random() > 0.4) {
        triggerChaos(simTime > 300 ? 4 : 2);
      }
      
      // Randomly spawn a devil for a few seconds
      if (Math.random() > 0.5) {
        const devil = DEVILS[Math.floor(Math.random() * DEVILS.length)];
        const uniqueId = Date.now();
        setActiveDevils(prev => [...prev, { ...devil, id: uniqueId }]);
        playSound(devilAudio, 0.5);
        
        setTimeout(() => {
          setActiveDevils(prev => prev.filter(d => d.id !== uniqueId));
        }, 6000);
      }
    }, 8000); // Faster chaos (8s)

    // Main 10-minute logic loop
    simInterval.current = setInterval(() => {
      setSimTime(prev => {
        const nextTime = prev + 1;
        
        // Random Chaos Noises & Real-World Failures
        if (Math.random() > 0.96) {
          triggerHellScream(); // Use the new digital scream
          if (Math.random() > 0.6) {
            setLogs(l => [...l, "⚡ ERROR: AI CORE SCREAM DETECTED... ⚡", "⚠️ SYSTEM: JPMORGAN HAS DECLARED INSOLVENCY. ⚠️"]);
            setHumanoidStatus("The big banks are falling. Can you hear the sound of the digital abyss?");
          }
        }

        // Dynamic stage transitions
        if (nextTime === 1) { // Immediate transition to Stage 1 (Ecstasy)
          setSimStage(1);
        }
        if (nextTime === 60) {
          setSimStage(2);
          setLogs(l => [...l, "⚠️ ALERT: FED LOCKS ALL RETAIL WITHDRAWALS.", "⚠️ SYSTEM: TETHER PEG DROPPED TO 0.40."]);
          setHumanoidStatus("Panic stage: The banks are closed. Your money is just a digital ghost now.");
          setRealityTimeline(tl => [
            ...tl,
            { t: 'T+01:00', msg: 'Cash access is restricted. ATM limits hit. Payment rails start failing.' },
            { t: 'T+01:00', msg: 'Stablecoin liquidity thins. Spreads widen. Market makers pull quotes.' }
          ]);
          triggerChaos(1);
        }
        if (nextTime === 180) {
          setSimStage(3);
          setGlobalReveal(true);
          setLogs(l => [...l, "📉 CRITICAL: BITS INDEX DOWN 99.9%.", "🏥 NOTICE: HEALTH INSURANCE POLICIES VOIDED."]);
          setHumanoidStatus("Despair stage: Your car has been repossessed remotely. You are walking into the abyss.");
          setRealityTimeline(tl => [
            ...tl,
            { t: 'T+03:00', msg: 'Credit lines are pulled. Counterparty risk becomes the only chart.' },
            { t: 'T+03:00', msg: 'Insurance underwriting is automated. Claims are denied at scale.' },
            { t: 'T+03:00', msg: 'This is where mass psychology breaks: the curve turns into fear.' }
          ]);
          triggerChaos(2);
          if (soundEnabled) {
            safeStop(ambientAudio);
            safePlay(despairAudio, 0.28, true, 0.6);
          }
          triggerHellScream();
        }
        if (nextTime === 300) {
          setSimStage(4); 
          setLogs(l => [...l, "🦊 CRITICAL: METAMASK PRIVATE KEYS LEAKED.", "🏠 FORECLOSURE: MORTGAGE BAIL-IN PROTOCOL ACTIVE."]);
          setHumanoidStatus("ANNIHILATION: They took your house. Now they are taking your digital identity.");
          setRealityTimeline(tl => [
            ...tl,
            { t: 'T+05:00', msg: 'Wallet compromise wave: seed exposure → drain → irreversible loss.' },
            { t: 'T+05:00', msg: 'Banks enforce bail-ins. Deposits are “converted” to stabilize balance sheets.' }
          ]);
          triggerChaos(4);
          if (soundEnabled) {
            // switch to "war/cyber" soundscape: harsher, faster glitches + siren bursts
            safePlay(despairAudio, 0.24, true, 0.85);
            sirenBurst(1800);
          }
        }
        if (nextTime === 420) {
          setSimStage(5); 
          setLogs(l => [...l, "🍔 PRICE ALERT: POTATO IS NOW $15,000.", "🆔 SYSTEM: CBDC SOCIAL CREDIT SCORE: 0."]);
          setHumanoidStatus("Biological failure: Hunger, thirst, cold. Your debts have exceeded your life expectancy.");
          setRealityTimeline(tl => [
            ...tl,
            { t: 'T+07:00', msg: 'Food supply chains fracture. Prices jump. Shelves empty.' },
            { t: 'T+07:00', msg: 'CBDC enforcement: access gating begins (transport, utilities, groceries).' }
          ]);
          triggerChaos(5);
          if (soundEnabled) {
            safePlay(despairAudio, 0.32, true, 0.95);
            sirenBurst(2400);
          }
        }
        if (nextTime >= 600) {
          clearInterval(simInterval.current);
          clearInterval(quoteInterval.current);
          finishSimulation();
          return 600;
        }

        // Rapid balance decay logic based on stage
        setCurrentBalance(current => {
          let decay = 0;
          if (nextTime < 60) decay = current * 0.0005; 
          else if (nextTime < 180) decay = current * 0.005; 
          else if (nextTime < 420) decay = current * 0.02; 
          else decay = current * 0.08; 
          
          return Math.max(0, current - decay);
        });

        return nextTime;
      });
    }, 1000);
  };

  const finishSimulation = () => {
    const val = Number.isFinite(portfolioUsd) ? portfolioUsd : 0;

    playSound(strikeAudio, 1.0);
    setSimStage(6); // Final Death Fade
    setResult({
      verdict: "REAL-WORLD LIQUIDATION COMPLETE",
      lost: `-$${val.toLocaleString()}`,
      remaining: "$0.00",
      percent: "100%",
      advice: "Your house is gone. Your car is gone. Your medical insurance is void. You are now a zero-value biological entity.",
      comment: "Magnificent. The banks have taken your assets, the AI has taken your identity, and the NWO has taken your future. Enjoy the silence."
    });

    // Official certificate data
    const now = new Date();
    const zapCount = Number(tvZapCountRef.current || 0);
    const severity = Number(selectedScenario?.severity || 80);
    const watchFactor = 1; // completed the full run
    const wealthFactor = clamp(Math.log10(Math.max(1, val)) / 6, 0, 1); // 1k..1M-ish
    const zapFactor = clamp(zapCount / 25, 0, 1);
    const score = Math.round(clamp(
      35 * watchFactor
      + 35 * (severity / 100)
      + 20 * wealthFactor
      + 10 * zapFactor,
      0,
      100
    ));
    const grade = score >= 90 ? 'S' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D';
    const fit = score >= 70;
    const certId = `BSDX-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const nextCert = {
      certId,
      issuedAt: now.toISOString(),
      name: String(userName || '').trim(),
      email: String(userEmail || '').trim(),
      wallet: walletAddress || fallbackAddrRef.current,
      scenario: selectedScenario?.name || 'Unknown',
      startingWealthUsd: val,
      finalWealthUsd: 0,
      score,
      grade,
      fit,
      lang: certLang,
      attention: {
        status: attention.status,
        faceDetected: attention.faceDetected,
        lookingPct: attention.lookingPct,
        blinkPerMin: attention.blinkPerMin,
        engagementScore: attention.engagementScore
      },
      cameraVerified: !!faceEverDetectedRef.current,
      payment: null,
      disclaimer: (CERT_I18N[certLang] || CERT_I18N.en).disclaimer
    };

    if (wantsCertificate) {
      // Certificate requires camera evidence + payment (10,000 BITS)
      setPendingCertificate(nextCert);
      setCertificate(null);
    } else {
      setCertificate(null);
      setPendingCertificate(null);
    }

    setHumanoidStatus("Dissection complete. You have 0 food, 0 water, 0 shelter. You are officially extinct.");
    setLoading(false);
    safeStop(ambientAudio);
    safeStop(despairAudio);
    triggerHellScream(); // Final digital scream
    triggerChaos(5);
    if (newsTimerRef.current) window.clearTimeout(newsTimerRef.current);
    setNewsCaption('');
    speakFinalCollapse();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const printCertificate = useCallback(() => {
    if (!certificate) return;
    const c = certificate;
    const t = CERT_I18N[c.lang] || CERT_I18N.en;
    const txLine = c.payment?.txHash ? `<div class="sub">Payment TX: <strong>${c.payment.txHash}</strong></div>` : '';
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${t.certTitle}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #0b0b0b; color: #f5f5f5; margin: 0; padding: 24px; }
    .page { position: relative; max-width: 920px; margin: 0 auto; border: 2px solid rgba(0,255,102,0.45); padding: 28px; border-radius: 18px; background: linear-gradient(180deg, rgba(0,0,0,0.85), rgba(20,0,0,0.75)); overflow: hidden; }
    .watermark { position: absolute; inset: -90px; background:
        radial-gradient(circle at 20% 30%, rgba(0,255,102,0.12), transparent 55%),
        radial-gradient(circle at 75% 40%, rgba(112,0,255,0.10), transparent 55%),
        conic-gradient(from 180deg, rgba(255,0,51,0.08), rgba(0,255,102,0.06), rgba(255,255,255,0.04), rgba(112,0,255,0.06), rgba(255,0,51,0.08));
      mix-blend-mode: screen;
      opacity: 0.65;
      pointer-events: none;
    }
    .seal { position: absolute; right: 22px; top: 22px; width: 96px; height: 96px; border-radius: 50%;
      border: 2px solid rgba(0,255,102,0.55);
      box-shadow: 0 0 28px rgba(0,255,102,0.18), inset 0 0 22px rgba(255,255,255,0.08);
      background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.16), rgba(0,0,0,0.6));
    }
    .seal::after { content: "BSDX\\A AI"; white-space: pre; position: absolute; inset: 0; display: grid; place-items: center;
      font-weight: 900; letter-spacing: 2px; color: rgba(0,255,102,0.9); font-size: 18px; text-align: center; }
    h1 { margin: 0 0 8px; letter-spacing: 1px; }
    .sub { opacity: 0.85; margin-bottom: 18px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .box { border: 1px solid rgba(255,255,255,0.14); border-radius: 14px; padding: 12px 14px; background: rgba(0,0,0,0.35); }
    .k { font-size: 12px; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; }
    .v { font-size: 16px; margin-top: 6px; word-break: break-word; }
    .score { font-size: 44px; font-weight: 900; color: ${c.fit ? '#00ff66' : '#ff0033'}; }
    .badge { display: inline-block; padding: 8px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.18); margin-top: 8px; }
    .foot { margin-top: 18px; font-size: 12px; opacity: 0.7; }
    @media print { body { background: #fff; color: #000; } .page { background: #fff; border-color: #000; } .box { background: #fff; } .score { color: #000; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="watermark"></div>
    <div class="seal"></div>
    <h1>${t.certTitle}</h1>
    <div class="sub">${t.certId}: <strong>${c.certId}</strong> • ${t.issued}: <strong>${new Date(c.issuedAt).toUTCString()}</strong></div>
    ${txLine}

    <div class="grid">
      <div class="box">
        <div class="k">${t.participant}</div>
        <div class="v"><strong>${c.name}</strong></div>
        <div class="k" style="margin-top:10px;">${t.email}</div>
        <div class="v">${c.email}</div>
        <div class="k" style="margin-top:10px;">${t.wallet}</div>
        <div class="v">${c.wallet}</div>
      </div>
      <div class="box">
        <div class="k">${t.verdict}</div>
        <div class="v"><strong>${c.fit ? t.fit : t.unfit}</strong></div>
        <div class="k" style="margin-top:10px;">${t.score}</div>
        <div class="score">${c.score}/100</div>
        <div class="badge">${t.grade}: <strong>${c.grade}</strong></div>
      </div>
      <div class="box" style="grid-column: 1 / -1;">
        <div class="k">${t.summary}</div>
        <div class="v">
          ${t.scenario}: <strong>${c.scenario}</strong><br/>
          ${t.starting}: <strong>$${Number(c.startingWealthUsd || 0).toLocaleString()}</strong><br/>
          ${t.final}: <strong>$${Number(c.finalWealthUsd || 0).toLocaleString()}</strong><br/>
        </div>
      </div>
      <div class="box" style="grid-column: 1 / -1;">
        <div class="k">${t.attention}</div>
        <div class="v">
          Status: <strong>${c.attention?.status || 'OFF'}</strong> • ${t.face}: <strong>${c.attention?.faceDetected ? t.detected : t.notDetected}</strong><br/>
          ${t.looking}: <strong>${Number(c.attention?.lookingPct || 0)}%</strong> • ${t.blink}: <strong>${Number(c.attention?.blinkPerMin || 0)}</strong> • ${t.engagement}: <strong>${Number(c.attention?.engagementScore || 0)}/100</strong>
        </div>
      </div>
    </div>

    <div class="foot">${c.disclaimer}</div>
  </div>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

    const w = window.open('', '_blank', 'noopener,noreferrer,width=980,height=720');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }, [certificate]);

  const payForCertificate = useCallback(async () => {
    if (!pendingCertificate) return;
    if (!signer) {
      setCertPayState({ status: 'error', error: 'Wallet signer not available.', txHash: '' });
      return;
    }
    if (chainId && chainId !== 56) {
      try {
        await switchNetwork?.(56);
      } catch (_) {}
      setCertPayState({ status: 'error', error: 'Please switch to BSC Mainnet (chainId 56) and retry.', txHash: '' });
      return;
    }
    if (!pendingCertificate.cameraVerified) {
      setCertPayState({ status: 'error', error: 'Camera verification failed (no face detected). Certificate cannot be issued.', txHash: '' });
      return;
    }
    setCertPayState({ status: 'pending', error: '', txHash: '' });
    const res = await sendBitsToTreasury(signer, certificateFeeBits);
    if (res?.success && res?.hash) {
      const paid = {
        ...pendingCertificate,
        payment: {
          amountBits: certificateFeeBits,
          txHash: res.hash,
          paidAt: new Date().toISOString()
        }
      };
      setCertificate(paid);
      setPendingCertificate(null);
      setCertPayState({ status: 'paid', error: '', txHash: res.hash });
    } else {
      setCertPayState({ status: 'error', error: res?.error || 'Payment failed.', txHash: '' });
    }
  }, [pendingCertificate, signer, chainId, switchNetwork, certificateFeeBits]);

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(String(text || ''));
      playTvZap();
    } catch (_) {}
  }, [playTvZap]);

  const renderBreakingNews = useCallback((tpl) => {
    const pct = Math.max(3, Math.min(55, Math.round((Math.random() * 18 + (simStage >= 4 ? 18 : simStage >= 3 ? 12 : 7)))));
    return String(tpl).replace('{pct}', String(pct));
  }, [simStage]);

  const pickAggressiveEnglishVoice = () => {
    try {
      const voices = window.speechSynthesis?.getVoices?.() || [];
      const en = voices.filter(v => /en/i.test(v.lang));
      if (!en.length) return null;
      // Prefer non-female-sounding names heuristically; if not, pick random EN voice
      const preferred = en.find(v => /male|david|mark|guy|daniel|alex/i.test(v.name))
        || en.find(v => /en-US/i.test(v.lang) && /male|david|mark|guy|daniel|alex/i.test(v.name))
        || en.find(v => /en-US/i.test(v.lang))
        || en[Math.floor(Math.random() * en.length)];
      return preferred || null;
    } catch (_) {
      return null;
    }
  };

  const scrollToAttention = useCallback(() => {
    try {
      attentionPanelRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    } catch (_) {}
  }, []);

  useEffect(() => {
    // Auto-close ring info after a short read window
    if (!bioRingOpen) {
      if (bioRingTimerRef.current) window.clearTimeout(bioRingTimerRef.current);
      bioRingTimerRef.current = null;
      return;
    }
    if (bioRingTimerRef.current) window.clearTimeout(bioRingTimerRef.current);
    bioRingTimerRef.current = window.setTimeout(() => {
      setBioRingOpen(false);
    }, 12000);
    return () => {
      if (bioRingTimerRef.current) window.clearTimeout(bioRingTimerRef.current);
      bioRingTimerRef.current = null;
    };
  }, [bioRingOpen]);

  useEffect(() => {
    // Close "Read more" when attention moves away: click/tap outside, focus outside, or ESC.
    if (!bioRingOpen) return;
    const onOutside = (e) => {
      const root = bioRingRef.current;
      if (!root) return;
      if (root.contains(e.target)) return;
      setBioRingOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setBioRingOpen(false);
    };
    window.addEventListener('pointerdown', onOutside, true);
    window.addEventListener('focusin', onOutside, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onOutside, true);
      window.removeEventListener('focusin', onOutside, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [bioRingOpen]);

  const speakFinalCollapse = useCallback(() => {
    if (!soundEnabled) return;
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;

    const voice = pickAggressiveEnglishVoice();
    const lines = [
      "You have no money. It's over. Everything is finished.",
      "You're broke. You have nothing to eat.",
      "You have no money for your children. Your children will starve.",
      "No money for clothes. No money for water. What will you do? Where will you get it?"
    ];

    try { synth.cancel(); } catch (_) {}
    duckAmbient(4500);
    playSound(glitchAudio, 1.0);

    // Make the final lines clearly audible: stop music and mute TV briefly.
    try {
      const a0 = ambientAudio.current;
      const d0 = despairAudio.current;
      if (a0) { a0.volume = 0; a0.pause(); }
      if (d0) { d0.volume = 0; d0.pause(); }
    } catch (_) {}
    let prevMute = null;
    try {
      prevMute = tvMute;
      if (!tvMute) setTvMute(true);
    } catch (_) {}

    let i = 0;
    const speakNext = () => {
      if (i >= lines.length) return;
      const utter = new SpeechSynthesisUtterance(lines[i]);
      try { setNewsCaption(lines[i]); } catch (_) {}
      utter.lang = 'en-US';
      utter.rate = 1.12 + Math.random() * 0.08;
      utter.pitch = 0.72 + Math.random() * 0.06;
      utter.volume = 1.0;
      if (voice) utter.voice = voice;
      utter.onend = () => {
        i += 1;
        if (i >= lines.length) {
          window.setTimeout(() => setNewsCaption(''), 2400);
          try {
            if (typeof prevMute === 'boolean') setTvMute(prevMute);
          } catch (_) {}
        } else {
          window.setTimeout(speakNext, 420);
        }
      };
      utter.onerror = () => {
        i += 1;
        if (i >= lines.length) {
          window.setTimeout(() => setNewsCaption(''), 2400);
          try {
            if (typeof prevMute === 'boolean') setTvMute(prevMute);
          } catch (_) {}
        } else {
          window.setTimeout(speakNext, 420);
        }
      };
      try { synth.speak(utter); } catch (_) {}
    };
    speakNext();
  }, [soundEnabled, duckAmbient, playSound, glitchAudio, tvMute]);

  const speakBreakingNews = useCallback((text) => {
    if (!soundEnabled || !loading) return;
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;

    const now = Date.now();
    if (now - (newsGateRef.current.t || 0) < 9000) return; // more frequent
    if (newsGateRef.current.speaking) return;
    newsGateRef.current.t = now;
    newsGateRef.current.speaking = true;
    newsGateRef.current.musicDiffuse = true;
    setMusicDiffuse(true);

    // Stop music completely while the voice speaks (user requirement)
    try {
      const a0 = ambientAudio.current;
      const d0 = despairAudio.current;
      newsAudioRef.current.ambVol = a0?.volume ?? null;
      newsAudioRef.current.despairVol = d0?.volume ?? null;
      newsAudioRef.current.ambRate = a0?.playbackRate ?? null;
      newsAudioRef.current.despairRate = d0?.playbackRate ?? null;
      newsAudioRef.current.ambWasPlaying = !!(a0 && !a0.paused);
      newsAudioRef.current.despairWasPlaying = !!(d0 && !d0.paused);
      if (a0) { a0.volume = 0; a0.pause(); }
      if (d0) { d0.volume = 0; d0.pause(); }
    } catch (_) {}

    // Mute TV temporarily so the negative news voice is actually audible.
    try {
      newsAudioRef.current.prevTvMute = tvMute;
      if (!tvMute) setTvMute(true);
    } catch (_) {}

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    // Aggressive / panicked delivery
    utter.rate = 1.18 + Math.random() * 0.10;
    utter.pitch = 0.78 + Math.random() * 0.08;
    utter.volume = 1.0;

    // Best-effort voice selection
    try {
      const v = pickAggressiveEnglishVoice();
      if (v) utter.voice = v;
    } catch (_) {}

    const triggerTvTakeover = (ms = 7000) => {
      const nowT = Date.now();
      if (nowT - (tvTakeoverRef.current.t || 0) < 12000) return; // don't spam fullscreen
      tvTakeoverRef.current.t = nowT;
      if (tvTakeoverRef.current.timer) window.clearTimeout(tvTakeoverRef.current.timer);
      tvTakeoverRef.current.prev = { tvSize, tvMute, tvPower };

      // Ensure TV is visible and loud during takeover
      if (!tvPower) setTvPower(true);
      if (tvMute) setTvMute(false);
      setTvSize('fullscreen');
      duckAmbient(ms + 700);

      tvTakeoverRef.current.timer = window.setTimeout(() => {
        const prev = tvTakeoverRef.current.prev;
        if (prev) {
          setTvSize(prev.tvSize || 'normal');
          setTvMute(!!prev.tvMute);
          setTvPower(!!prev.tvPower);
        } else {
          setTvSize('normal');
        }
      }, ms);
    };

    const triggerChartTakeover = (ms = 5200) => {
      const nowT = Date.now();
      if (nowT - (chartTakeoverRef.current.t || 0) < 14000) return;
      chartTakeoverRef.current.t = nowT;
      if (chartTakeoverRef.current.timer) window.clearTimeout(chartTakeoverRef.current.timer);
      chartTakeoverRef.current.prev = { feedId: selectedFeed?.id, globalReveal };

      const btc = ASSET_FEEDS.find(a => a.id === 'btc') || ASSET_FEEDS[2];
      setSelectedFeed(btc);
      setGlobalReveal(true);
      setChartShock(1);
      setChartTakeover(true);
      duckAmbient(ms + 700);

      chartTakeoverRef.current.timer = window.setTimeout(() => {
        const prev = chartTakeoverRef.current.prev;
        setChartTakeover(false);
        setChartShock(0);
        if (prev?.feedId) {
          const back = ASSET_FEEDS.find(a => a.id === prev.feedId) || ASSET_FEEDS[0];
          setSelectedFeed(back);
        }
        if (typeof prev?.globalReveal === 'boolean') setGlobalReveal(prev.globalReveal);
      }, ms);
    };

    // When negative news voice speaks: keep music very diffuse (low volume), not fully stopped.
    const a = ambientAudio.current;
    const d = despairAudio.current;
    try {
      if (a) a.volume = 0.015;
      if (d) d.volume = 0.015;
    } catch (_) {}

    // Make it audible: extra ducking + siren/glitch cue + zap cue
    duckAmbient(4200);
    playSound(glitchAudio, 0.95);
    setNewsCaption(text);
    try { playTvZap(); } catch (_) {}
    // Occasionally take over the screen with TV + chart
    // TV takeover should stay up at least 7 seconds
    if (Math.random() < 0.65) triggerTvTakeover(7000 + Math.random() * 2500);
    if (Math.random() < 0.40) triggerChartTakeover(4200 + Math.random() * 2400);

    utter.onstart = () => {
      // Immediate audible duck + slight slowdown while the voice speaks
      try {
        const a2 = ambientAudio.current;
        const d2 = despairAudio.current;
        if (a2) {
          a2.volume = Math.min(a2.volume || 1, 0.015);
          a2.playbackRate = Math.min(a2.playbackRate || 1, 0.92);
        }
        if (d2) {
          d2.volume = Math.min(d2.volume || 1, 0.020);
          d2.playbackRate = Math.min(d2.playbackRate || 1, 0.82);
        }
      } catch (_) {}
    };

    utter.onend = () => {
      newsGateRef.current.speaking = false;
      newsGateRef.current.musicDiffuse = false;
      setMusicDiffuse(false);
      window.setTimeout(() => setNewsCaption(''), 2600);
      // restore TV mute state
      try {
        const prev = newsAudioRef.current.prevTvMute;
        if (typeof prev === 'boolean') setTvMute(prev);
      } catch (_) {}
    };
    utter.onerror = () => {
      newsGateRef.current.speaking = false;
      newsGateRef.current.musicDiffuse = false;
      setMusicDiffuse(false);
      try {
        const prev = newsAudioRef.current.prevTvMute;
        if (typeof prev === 'boolean') setTvMute(prev);
      } catch (_) {}
    };

    try {
      synth.cancel();
      synth.speak(utter);
    } catch (_) {
      newsGateRef.current.speaking = false;
      newsGateRef.current.musicDiffuse = false;
      setMusicDiffuse(false);
      try {
        const prev = newsAudioRef.current.prevTvMute;
        if (typeof prev === 'boolean') setTvMute(prev);
      } catch (_) {}
    }
  }, [soundEnabled, loading, duckAmbient, playTvZap, playSound, tvSize, tvMute, tvPower, selectedFeed, globalReveal]);

  useEffect(() => {
    // Schedule occasional breaking-news voice lines while the stress test runs.
    if (!soundEnabled || !loading) return;
    let cancelled = false;

    const schedule = () => {
      if (cancelled) return;
      const base = simStage >= 5 ? 7500 : simStage >= 4 ? 9000 : simStage >= 3 ? 11500 : 14500;
      const jitter = base + Math.random() * 6500;
      newsTimerRef.current = window.setTimeout(() => {
        if (cancelled) return;
        const tpl = NEGATIVE_NEWS_TEMPLATES[Math.floor(Math.random() * NEGATIVE_NEWS_TEMPLATES.length)];
        speakBreakingNews(renderBreakingNews(tpl));
        schedule();
      }, jitter);
    };

    schedule();
    return () => {
      cancelled = true;
      if (newsTimerRef.current) window.clearTimeout(newsTimerRef.current);
      try { window.speechSynthesis?.cancel?.(); } catch (_) {}
      setNewsCaption('');
    };
  }, [soundEnabled, loading, simStage, speakBreakingNews, renderBreakingNews]);

  // --- Attention Monitor (non-medical) ---
  const computeEAR = (pts) => {
    // Eye Aspect Ratio (EAR) using 6 points around the eye.
    // pts: [{x,y},...]
    const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const A = d(pts[1], pts[5]);
    const B = d(pts[2], pts[4]);
    const C = d(pts[0], pts[3]);
    return (A + B) / (2 * Math.max(1e-6, C));
  };

  useEffect(() => {
    // Start/stop MediaPipe only if user enabled AND consented (privacy).
    if (!cameraEnabled || !cameraConsent) {
      setAttention(a => ({ ...a, status: 'OFF', note: cameraEnabled && !cameraConsent ? 'Consent required.' : '' }));
      try { mpCameraRef.current?.stop?.(); } catch (_) {}
      mpCameraRef.current = null;
      mpFaceMeshRef.current = null;
      return;
    }

    let cancelled = false;
    setAttention(a => ({ ...a, status: 'STARTING', note: '' }));

    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;
    if (!videoEl || !canvasEl) {
      setAttention(a => ({ ...a, status: 'ERROR', note: 'Camera elements not ready.' }));
      return;
    }

    const ctx = canvasEl.getContext('2d');
    if (!ctx) {
      setAttention(a => ({ ...a, status: 'ERROR', note: 'Canvas not available.' }));
      return;
    }

    attRef.current = { frames: 0, lookFrames: 0, blinkCount: 0, lastEar: 0.3, blinkArmed: true, t0: Date.now() };

    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults((res) => {
      if (cancelled) return;
      const w = canvasEl.width = videoEl.videoWidth || 640;
      const h = canvasEl.height = videoEl.videoHeight || 360;
      ctx.save();
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(res.image, 0, 0, w, h);

      const lm = res.multiFaceLandmarks?.[0];
      const detected = !!lm;
      if (detected) {
        faceEverDetectedRef.current = true;
        // Draw minimal overlay
        drawConnectors(ctx, lm, FaceMesh.FACEMESH_TESSELATION, { color: 'rgba(0,255,102,0.12)', lineWidth: 1 });
        drawLandmarks(ctx, lm, { color: 'rgba(255,0,51,0.35)', radius: 1 });

        // EAR using approximate eye landmarks (MediaPipe indices)
        // Left eye: [33, 160, 158, 133, 153, 144]
        // Right eye: [362, 385, 387, 263, 373, 380]
        const pick = (i) => ({ x: lm[i].x, y: lm[i].y });
        const leftEye = [33, 160, 158, 133, 153, 144].map(pick);
        const rightEye = [362, 385, 387, 263, 373, 380].map(pick);
        const ear = (computeEAR(leftEye) + computeEAR(rightEye)) / 2;

        // Blink detection (threshold tuned empirically)
        const blinkThresh = 0.19;
        const st = attRef.current;
        if (ear < blinkThresh && st.blinkArmed) {
          st.blinkCount += 1;
          st.blinkArmed = false;
        }
        if (ear > blinkThresh + 0.03) st.blinkArmed = true;

        // "Looking at screen" approximation using iris center position ratio.
        // Use iris landmarks if available (refineLandmarks true): left iris [468..472], right iris [473..477]
        const irisCenter = (idxs) => {
          const pts = idxs.map(pick);
          const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
          const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
          return { x: cx, y: cy };
        };
        const leftIris = irisCenter([468, 469, 470, 471, 472]);
        const rightIris = irisCenter([473, 474, 475, 476, 477]);
        const eyeBox = (eye) => {
          const xs = eye.map(p => p.x);
          const ys = eye.map(p => p.y);
          return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
        };
        const lb = eyeBox(leftEye);
        const rb = eyeBox(rightEye);
        const lx = (leftIris.x - lb.minX) / Math.max(1e-6, (lb.maxX - lb.minX));
        const rx = (rightIris.x - rb.minX) / Math.max(1e-6, (rb.maxX - rb.minX));
        const looking = lx > 0.30 && lx < 0.70 && rx > 0.30 && rx < 0.70;

        st.frames += 1;
        if (looking) st.lookFrames += 1;

        const elapsedMin = Math.max(1e-6, (Date.now() - st.t0) / 60000);
        const blinkPerMin = st.blinkCount / elapsedMin;
        const lookingPct = (st.lookFrames / Math.max(1, st.frames)) * 100;
        const engagementScore = Math.round(clamp((lookingPct * 0.75 + Math.min(100, blinkPerMin * 4) * 0.25), 0, 100));

        setAttention({
          status: 'ACTIVE',
          faceDetected: true,
          lookingPct: Math.round(lookingPct),
          blinkPerMin: Math.round(blinkPerMin),
          engagementScore,
          note: 'Non-medical attention/engagement estimate.'
        });
      } else {
        setAttention(a => ({
          ...a,
          status: 'ACTIVE',
          faceDetected: false,
          note: 'No face detected.'
        }));
      }
      ctx.restore();
    });

    mpFaceMeshRef.current = faceMesh;

    const cam = new Camera(videoEl, {
      onFrame: async () => {
        if (cancelled) return;
        try { await faceMesh.send({ image: videoEl }); } catch (_) {}
      },
      width: 640,
      height: 360
    });
    mpCameraRef.current = cam;

    cam.start().catch((e) => {
      setAttention(a => ({ ...a, status: 'ERROR', note: 'Camera blocked or unavailable.' }));
    });

    return () => {
      cancelled = true;
      try { mpCameraRef.current?.stop?.(); } catch (_) {}
      mpCameraRef.current = null;
      mpFaceMeshRef.current = null;
    };
  }, [cameraEnabled, cameraConsent]);

  const tvIsOverlay = tvSize === 'popup' || tvSize === 'fullscreen';
  useEffect(() => {
    // When TV is in overlay mode, prevent it from being constrained by parent stacking contexts / scrolling.
    if (!tvIsOverlay) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [tvIsOverlay]);

  return (
    <div className={`hell-wrapper stage-${simStage} ${glitchLevel > 0 ? 'glitch-active' : ''} ${(focusMode || (loading && simStage >= 3)) ? 'takeover' : ''} ${tvIsOverlay ? 'tv-overlay-active' : ''}`}>
      <div className="hell-nebula"></div>
      <div className="static-noise-overlay"></div>
      
      {/* 👿 Floating Devils */}
      <div className="devil-containment">
        {activeDevils.map((d) => (
          <div key={d.id} className={`devil-entity ${d.type}`}>
            <span className="d-icon">{d.icon}</span>
            <div className="d-popup">"{d.msg}"</div>
          </div>
        ))}
      </div>

      <div className="stress-content">
        {/* 🎧 Sound + Focus Controls (moves with layout, not fixed to viewport) */}
        <div className="audio-control-v3">
          <button className={`sound-btn ${soundEnabled ? 'on' : 'off'}`} onClick={toggleSound}>
            {soundEnabled ? '🔊 AUDIO ACTIVE' : '🔇 ENABLE HELL NOISE'}
          </button>
          <button
            type="button"
            className={`sound-btn focus ${focusMode ? 'on' : 'off'}`}
            onClick={() => setFocusMode(v => !v)}
            title="Hide the app header/sidebar visually (without touching other components) for perfect symmetry."
          >
            {focusMode ? '🖥️ FOCUS: ON' : '🖥️ FOCUS MODE'}
          </button>
        </div>

        <div className="title-area">
          <h1 className="glitch-title" data-text="QUANTUM STRESS TEST">QUANTUM STRESS TEST</h1>
          <p className="subtitle">SACRIFICE: {AI_TOOLS_PRICING.portfolioStress.cost.toLocaleString()} BITS Essence</p>
        </div>

        <div className="simulation-core">
          {/* 🧟 Humanoid AI Nexus */}
          <div className="left-rail">
            <div className="humanoid-nexus compact">
              <div className={`ai-face-v3 ${loading ? 'possessed' : ''} mood-${avatarMood}`}>
                <div className="face-grid"></div>
                <div className="brow left"></div>
                <div className="brow right"></div>
                <div className="eye left"><div className="pupil"></div></div>
                <div className="eye right"><div className="pupil"></div></div>
                <div className="mouth"></div>
                <div className="scanline"></div>
              </div>
              <div className="status-bubble">
                <span className="label">AI ANALYST:</span>
                <p className="msg">{humanoidStatus}</p>
              </div>
            </div>

            {/* 👛 Wallet Panel (moved from floating drain) */}
            <div className={`glass-panel wallet-panel ${loading ? 'live' : ''} stage-${simStage}`}>
              {(() => {
                const skin = WALLET_SKINS[walletSkinIdx] || WALLET_SKINS[0];
                const compromised = loading && simStage >= 4;
                const connected = !!walletAddress;
                const displayAddr = connected ? walletAddress : fallbackAddrRef.current;
                const net =
                  skin.id === 'phantom' ? 'Solana' :
                  skin.id === 'metamask' ? 'Ethereum' :
                  skin.id === 'coinbase' ? 'Base / EVM' :
                  'Multi-chain';
                return (
                  <>
                    <div className="wallet-head">
                      <div className="wallet-brand" style={{ borderColor: skin.accent }}>
                        <span className="wallet-badge">{skin.badge}</span>
                        <div className="wallet-brand-text">
                          <div className="wallet-name">{skin.name}</div>
                          <div className="wallet-sub">{skin.sub} • {net}</div>
                        </div>
                      </div>
                      <div className={`wallet-state ${!connected ? 'off' : compromised ? 'bad' : 'ok'}`}>
                        {!connected ? 'NOT CONNECTED' : compromised ? 'COMPROMISED' : loading ? 'SYNCING' : 'IDLE'}
                      </div>
                    </div>

                    <div className="wallet-body">
                      <div className="wallet-row">
                        <span className="wk">Address</span>
                        <span className="wv" title={displayAddr}>{maskAddr(displayAddr)}</span>
                      </div>
                      <div className="wallet-row">
                        <span className="wk">Asset</span>
                        <span className="wv">USD Balance</span>
                      </div>
                      <div className="wallet-row">
                        <span className="wk">BITS</span>
                        <span className="wv">{Number(bitsBalance || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                      </div>

                      <div className="wallet-balance">
                        <div className="wb-label">YOUR REMAINING WEALTH (USD)</div>
                        <div className="wb-value">${currentBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                        {loading && (
                          <div className="wb-meta">
                            <span className="chip">LIVE DRAIN</span>
                            <span className="chip">RISK: {simStage >= 5 ? 'EXTREME' : simStage >= 3 ? 'HIGH' : 'ELEVATED'}</span>
                            {simStage >= 4 && <span className="chip chip-bad">SEED EXPOSED</span>}
                          </div>
                        )}
                        {loading && simStage >= 4 && (
                          <div className="debt-notice">⚠️ DEBT ACCRUING: ${(simTime * 1.5).toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* 🕒 Apocalypse Timer (moved under wallet) */}
            {loading && (
              <div className="apocalypse-timer inline glass-panel">
                <div className="t-label">TIME UNTIL FINANCIAL DEATH</div>
                <div className="t-value">{formatTime(600 - simTime)}</div>
                <div className="t-progress">
                  <div className="t-fill" style={{ width: `${(simTime / 600) * 100}%` }}></div>
                </div>
                <div className="t-sub">
                  Stage: <strong>{simStage}</strong> • Scenario: <strong>{selectedScenario?.name}</strong>
                </div>
              </div>
            )}

            {/* 📺 CRT WAR / MARKETS TV (moved under timer) */}
            <div className={`glass-panel tv-panel ${tvOn ? 'on' : 'off'} ${tvPower ? 'power-on' : 'power-off'} size-${tvSize}`}>
              <div
                className="tv-shell"
                onClick={(e) => {
                  // Don't toggle power accidentally while clicking around the TV; only allow click-to-power-on when OFF.
                  e.stopPropagation();
                  if (!tvPower) toggleTvPower();
                }}
                role="button"
                tabIndex={0}
              >
                <div className="tv-screen">
                  {/* Top controls are ATTACHED to the TV (single compact layout) */}
                  <div className="tv-topbar" onClick={(e) => e.stopPropagation()}>
                    <div className="tv-title">
                      <span className={`tv-live ${tvOn ? 'on' : ''}`}></span>
                      <span>LIVE</span>
                    </div>

                    <div className="tv-channel-ui">
                      <label className="tv-field">
                        <span className="tv-field-label">CHANNEL</span>
                        <select
                          className="tv-select"
                          value={tvChannelKey}
                          onChange={(e) => {
                            playTvZap();
                            setTvChannelKey(e.target.value);
                          }}
                        >
                          {tvOnlineChannels.map((c) => (
                            <option key={c.key} value={c.key}>{c.shortName || c.name}</option>
                          ))}
                        </select>
                      </label>
                      <div className="tv-favs" aria-label="Favorite channels">
                        {tvOnlineChannels.slice(0, 6).map((c) => (
                          <button
                            key={`fav-${c.key}`}
                            type="button"
                            className={`tv-fav ${tvChannelKey === c.key ? 'active' : ''}`}
                            onClick={() => {
                              playTvZap();
                              setTvChannelKey(c.key);
                            }}
                            title={c.name}
                          >
                            {c.shortName || c.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="tv-buttons">
                      <button
                        type="button"
                        className="tv-toggle"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTvPower();
                        }}
                        title={tvPower ? 'Power off TV' : 'Power on TV'}
                      >
                        {tvPower ? 'PWR: OFF' : 'PWR: ON'}
                      </button>
                      <button
                        type="button"
                        className="tv-toggle"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTvMute(m => !m);
                          playTvZap();
                        }}
                        title="YouTube iframe volume can't be smoothly controlled; this toggles mute on the embedded player."
                      >
                        {tvMute ? 'SND: OFF' : 'SND: ON'}
                      </button>
                      <button
                        type="button"
                        className="tv-toggle"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTvSize((s) => (s === 'normal' ? 'large' : s === 'large' ? 'popup' : s === 'popup' ? 'fullscreen' : 'normal'));
                        }}
                        title="Resize TV (Normal → Large → Popup → Fullscreen)"
                      >
                        {tvSize === 'normal' ? 'SIZE: N' : tvSize === 'large' ? 'SIZE: L' : tvSize === 'popup' ? 'SIZE: POP' : 'SIZE: FULL'}
                      </button>
                      <button
                        type="button"
                        className="tv-toggle"
                        onClick={(e) => { e.stopPropagation(); recheckTvChannels(); }}
                        title="Removes channels that are missing/unembeddable/restricted (based on YouTube oEmbed)."
                        disabled={tvCheck.running}
                      >
                        {tvCheck.running ? 'CHECKING…' : 'RE-CHECK'}
                      </button>
                      {(tvSize === 'popup' || tvSize === 'fullscreen') && (
                        <button
                          type="button"
                          className="tv-toggle"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTvSize('normal');
                          }}
                        >
                          CLOSE
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="tv-crt">
                      {tvPower ? (
                      <iframe
                          key={`tv-${tvChannelKey}-${tvPower ? 'on' : 'off'}-${tvMute ? 'muted' : 'sound'}`}
                        className="tv-iframe"
                        title={`Live channel: ${activeTvChannel?.name || 'External'}`}
                        src={tvEmbedUrl || 'about:blank'}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        sandbox="allow-same-origin allow-scripts allow-popups allow-presentation"
                      />
                    ) : (
                      <div className="tv-off-black" />
                    )}
                    <div className="tv-anchor">
                      <div className="tv-face"></div>
                      <div className="tv-mouth"></div>
                    </div>
                    <div className="tv-noise"></div>
                    <div className="tv-ghost"></div>
                    <div className="tv-hud">
                      <span className="tv-hud-left">LIVE</span>
                      <span className="tv-hud-right">{selectedFeed?.label} • {loading ? (simTime < 90 ? 'CALM' : simTime < 420 ? 'UNREST' : 'WAR') : 'STANDBY'}</span>
                    </div>
                    {!tvPower && (
                      <div className="tv-off-overlay">
                        <div className="tv-off-title">POWER OFF</div>
                        <div className="tv-off-sub">Click to power on.</div>
                      </div>
                    )}
                  </div>
                  <div className="tv-lowerthird">
                    <div className="tv-banner">
                      {loading ? (simTime < 90 ? 'MARKETS • NORMAL' : simTime < 240 ? 'VOLATILITY • CREDIT TIGHTENING' : simTime < 420 ? 'PANIC • LIQUIDITY CRISIS' : 'WAR • HUNGER • BLACKOUT') : 'STANDBY • READY'}
                    </div>
                      {(tvCheck.removed > 0 || tvCheck.error) && (
                        <div className="tv-line" style={{ opacity: 0.9 }}>
                          <span className="tv-topic">TV:</span>{' '}
                          {tvCheck.error ? `Re-check error: ${tvCheck.error}` : `Removed ${tvCheck.removed} broken/restricted channel(s).`}
                        </div>
                      )}
                    <div className="tv-crawl">
                      <div className="tv-crawl-track">
                        {(realityTimeline.length ? realityTimeline.slice(-10).map(l => l.msg).join(' • ') : 'No signal • ') + ' • '}
                        {(realityTimeline.length ? realityTimeline.slice(-10).map(l => l.msg).join(' • ') : 'No signal • ') + ' • '}
                      </div>
                    </div>
                    <div className="tv-subtitles">
                      {newsCaption && (
                        <div className="tv-line breaking">
                          <span className="tv-topic">BREAKING:</span> {newsCaption}
                        </div>
                      )}
                      {(tvPower && realityTimeline.length) ? realityTimeline.slice(-3).map((l, i) => (
                        <div key={`${l.t}-${i}`} className="tv-line">
                          <span className="tv-topic">{l.t}:</span> {l.msg}
                        </div>
                      )) : (
                        <div className="tv-line">
                          {!tvPower ? 'TV is off.' : 'Loading live channel…'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 📷 Attention Monitor (non-medical) */}
            <div ref={attentionPanelRef} className="glass-panel attention-panel">
              <div className="attention-head">
                <h3>Attention Monitor {wantsCertificate ? '(required for certificate)' : '(optional)'}</h3>
                <div className={`att-status ${attention.status.toLowerCase()}`}>{attention.status}</div>
              </div>
              <div className="attention-controls">
                <label className="att-toggle">
                  <input
                    type="checkbox"
                    checked={cameraEnabled}
                    onChange={(e) => setCameraEnabled(e.target.checked)}
                    disabled={loading && wantsCertificate}
                  />
                  <span>Enable camera (local)</span>
                </label>
                <label className="att-toggle">
                  <input
                    type="checkbox"
                    checked={cameraConsent}
                    onChange={(e) => setCameraConsent(e.target.checked)}
                    disabled={!cameraEnabled || (loading && wantsCertificate)}
                  />
                  <span>I consent to local webcam processing (non-medical).</span>
                </label>
              </div>

              <div className="attention-view">
                <video ref={videoRef} className="att-video" autoPlay playsInline muted />
                <canvas ref={canvasRef} className="att-canvas" />
              </div>

              <div className="attention-metrics">
                <div className="att-m">
                  <span className="k">Face</span>
                  <span className={`v ${attention.faceDetected ? 'ok' : 'bad'}`}>{attention.faceDetected ? 'Detected' : 'Not detected'}</span>
                </div>
                <div className="att-m">
                  <span className="k">Looking</span>
                  <span className="v">{attention.lookingPct}%</span>
                </div>
                <div className="att-m">
                  <span className="k">Blink/min</span>
                  <span className="v">{attention.blinkPerMin}</span>
                </div>
                <div className="att-m">
                  <span className="k">Engagement</span>
                  <span className="v">{attention.engagementScore}/100</span>
                </div>
              </div>
              <div className="att-note">{attention.note || 'This is an estimate. Not stress/health analysis.'}</div>
            </div>
          </div>

          {/* Center column */}
          <div className="center-rail">
            <div className="glass-panel scenario-selector">
              <h3>Select Real-World Financial Disaster</h3>
              <div className="scenario-grid">
                {SCENARIOS.map(s => (
                  <button
                    key={s.id}
                    className={`scenario-pill ${selectedScenario.id === s.id ? 'active' : ''}`}
                    onClick={() => !loading && setSelectedScenario(s)}
                  >
                    <span className="s-icon">{s.icon}</span>
                    <div className="s-info">
                      <span className="s-name">{s.name}</span>
                      <span className="s-severity">Severity: {s.severity}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel input-panel">
              <label>Your wallet value right now (USD / EUR / ETH) — before the crisis</label>
              <input
                type="number"
                value={wealthAmount}
                onChange={(e) => setWealthAmount(e.target.value)}
                placeholder="e.g., 450000 or 10"
                disabled={loading}
              />
              <div className="wealth-row">
                <label className="wealth-unit-label">Unit</label>
                <select
                  className="wealth-unit"
                  value={wealthUnit}
                  onChange={(e) => setWealthUnit(e.target.value)}
                  disabled={loading}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="ETH">ETH</option>
                </select>
                <div className="wealth-hint">
                  {wealthUnit === 'ETH'
                    ? `≈ $${portfolioUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })} (ETH≈$${ethUsdRef.toLocaleString(undefined, { maximumFractionDigits: 2 })})`
                    : wealthUnit === 'EUR'
                      ? `≈ $${portfolioUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })} (EUR→USD ref)`
                      : `≈ $${portfolioUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                </div>
              </div>

              <div className="cert-fields">
                <label className="cert-consent">
                  <input
                    type="checkbox"
                    checked={wantsCertificate}
                    onChange={(e) => setWantsCertificate(e.target.checked)}
                    disabled={loading}
                  />
                  <span>
                    Issue an official certificate after the test (cost: {certificateFeeBits.toLocaleString()} BITS).
                  </span>
                </label>

                {wantsCertificate && (
                  <div className="cert-camera-cta">
                    <div className="cta-title">Camera verification required</div>
                    <div className="cta-row">
                      <button
                        type="button"
                        className="tv-toggle"
                        onClick={() => { setCameraEnabled(true); setCameraConsent(true); scrollToAttention(); }}
                      >
                        Enable camera + consent
                      </button>
                      <button
                        type="button"
                        className="tv-toggle"
                        onClick={scrollToAttention}
                      >
                        Go to camera panel
                      </button>
                    </div>
                    <div className="cta-sub">
                      You can run the Stress Test without the camera, but you cannot receive a certificate unless the camera is enabled and a face is detected during the run.
                    </div>
                  </div>
                )}

                <div className="bio-ring-soon" ref={bioRingRef}>
                  <div className="br-title">BioSignal Ring Integration (coming soon)</div>
                  <div className="br-sub">
                    Optional advanced module for pulse + nervous system monitoring during Stress Test.
                    <br />
                    Certificate add-on cost: <strong>20,000 BITS</strong> (future release).
                  </div>
                  <div className="br-actions">
                    <button
                      type="button"
                      className="br-toggle"
                      onClick={() => setBioRingOpen(v => !v)}
                    >
                      {bioRingOpen ? 'Hide details' : 'Learn more'}
                    </button>
                    <div className="br-chip">Planned</div>
                  </div>

                  <div
                    className={`br-details ${bioRingOpen ? 'open' : ''}`}
                    onMouseLeave={() => { if (bioRingOpen) setBioRingOpen(false); }}
                  >
                    <div className="br-sub" style={{ marginTop: 8 }}>
                      <strong>Example supported devices (planned):</strong>
                    </div>
                    <ul className="br-list">
                      <li>
                        <strong>Samsung Galaxy Ring</strong> — HR/HRV/sleep signals via Samsung Health ecosystem.
                        <span className="br-links">
                          <a href="https://www.samsung.com/" target="_blank" rel="noreferrer noopener">Official</a>
                        </span>
                      </li>
                      <li>
                        <strong>Oura Ring (Gen 3/4)</strong> — HR/HRV/temp/sleep readiness (typically via cloud export/API or app bridge).
                        <span className="br-links">
                          <a href="https://ouraring.com/" target="_blank" rel="noreferrer noopener">Official / Buy</a>
                        </span>
                      </li>
                      <li>
                        <strong>Ultrahuman Ring Air</strong> — HR/HRV/sleep &amp; recovery metrics (app bridge/export).
                        <span className="br-links">
                          <a href="https://www.ultrahuman.com/ring/" target="_blank" rel="noreferrer noopener">Official / Buy</a>
                        </span>
                      </li>
                      <li>
                        <strong>RingConn (Gen 2)</strong> — HR/HRV/sleep metrics (app bridge/export).
                        <span className="br-links">
                          <a href="https://ringconn.com/" target="_blank" rel="noreferrer noopener">Official / Buy</a>
                        </span>
                      </li>
                      <li>
                        <strong>Circular Ring</strong> — HR/HRV/sleep metrics (app bridge/export).
                        <span className="br-links">
                          <a href="https://www.circular.xyz/" target="_blank" rel="noreferrer noopener">Official / Buy</a>
                        </span>
                      </li>
                      <li>
                        <strong>Huawei wearables (Watch/Band)</strong> — alternative pathway via BLE/app export (Huawei ring model is TBD).
                        <span className="br-links">
                          <a href="https://consumer.huawei.com/" target="_blank" rel="noreferrer noopener">Official</a>
                        </span>
                      </li>
                    </ul>
                    <div className="br-footnote">
                      Note: device support depends on available SDK/BLE characteristics and/or export APIs.
                    </div>
                  </div>
                  <label className="cert-consent disabled">
                    <input type="checkbox" disabled checked={false} readOnly />
                    <span>Enable Ring Monitor (requires compatible device) — Coming soon</span>
                  </label>
                </div>

                <div className="cert-row">
                  <label className="cert-label">Full Name (required)</label>
                  <input
                    className="cert-input"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="John Doe"
                    disabled={loading || !wantsCertificate}
                  />
                </div>
                <div className="cert-row">
                  <label className="cert-label">Email (required)</label>
                  <input
                    className="cert-input"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={loading || !wantsCertificate}
                  />
                </div>
                <div className="cert-row">
                  <label className="cert-label">Certificate language</label>
                  <select
                    className="cert-input"
                    value={certLang}
                    onChange={(e) => setCertLang(e.target.value)}
                    disabled={loading || !wantsCertificate}
                  >
                    <option value="en">{CERT_I18N.en.langName}</option>
                    <option value="ro">{CERT_I18N.ro.langName}</option>
                    <option value="fr">{CERT_I18N.fr.langName}</option>
                    <option value="de">{CERT_I18N.de.langName}</option>
                  </select>
                </div>
                <label className="cert-consent">
                  <input
                    type="checkbox"
                    checked={emailConsent}
                    onChange={(e) => setEmailConsent(e.target.checked)}
                    disabled={loading || !wantsCertificate}
                  />
                  <span>
                    I agree to receive updates about BitSwapDEX (required to issue the certificate).
                  </span>
                </label>
              </div>

              <div className="gate-note">
                <div><strong>Access requirement:</strong> {COST_BITS.toLocaleString()} BITS to run the Stress Test.</div>
                <div>
                  Your BITS balance: <strong>{Number(bitsBalance || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}</strong>
                  {bitsEnough ? <span className="ok"> • OK</span> : <span className="bad"> • INSUFFICIENT</span>}
                </div>
                {!walletAddress && <div className="bad">Connect a wallet to continue.</div>}
                {wantsCertificate && walletAddress && !emailOk && <div className="bad">Enter a valid email address.</div>}
                {wantsCertificate && walletAddress && !nameOk && <div className="bad">Enter your full name.</div>}
                {wantsCertificate && walletAddress && !emailConsent && <div className="bad">Consent is required to issue the certificate.</div>}
                {wantsCertificate && walletAddress && !(cameraEnabled && cameraConsent) && <div className="bad">Camera + consent are required for the certificate.</div>}
              </div>

              <button className="burn-btn" onClick={start10MinApocalypse} disabled={!canStart}>
                {loading ? 'SYSTEMIC FAILURE IN PROGRESS...' : 'RUN THE STRESS TEST'}
              </button>
            </div>

            {/* 📉 GLOBAL MARKET CRASH (moved down; no longer occupies the first/top row) */}
            <div className={`glass-panel global-market-panel ${globalReveal ? 'revealed' : 'hidden'} ${chartTakeover ? 'takeover' : ''}`}>
              <div className="gmp-header">
                <div className="gmp-title">
                  <span className="gmp-dot"></span>
                  <h3>Global Market Panic Index</h3>
                </div>
                <div className="gmp-stats">
                  <span className="gmp-k">Index</span>
                  <span className="gmp-v">{globalIndex.toFixed(2)}</span>
                  <span className="gmp-sep">|</span>
                  <span className="gmp-k">Crash</span>
                  <span className="gmp-v neg">-{globalCrashPct.toFixed(2)}%</span>
                </div>
              </div>
              <div className="gmp-body">
                <div className="gmp-chart">
                  <div className="asset-strip">
                    {ASSET_FEEDS.map(a => (
                      <button
                        key={a.id}
                        className={`asset-pill ${selectedFeed.id === a.id ? 'active' : ''}`}
                        onClick={() => !loading && setSelectedFeed(a)}
                      >
                        <span className="asset-label">{a.label}</span>
                        <span className="asset-sub">{a.sub}</span>
                      </button>
                    ))}
                  </div>

                  <div className="asset-values">
                    <div className="av-left">
                      <div className="av-k">Selected</div>
                      <div className="av-v">{selectedFeed.label}</div>
                    </div>
                    <div className="av-right">
                      <div className="av-k">Price</div>
                      <div className="av-v">${feedPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                      <div className={`av-d ${feedDeltaPct >= 0 ? 'pos' : 'neg'}`}>{feedDeltaPct >= 0 ? '+' : ''}{feedDeltaPct.toFixed(2)}%</div>
                    </div>
                  </div>

                  {BINANCE_SYMBOL_BY_FEED[selectedFeed.id] && (
                    <div className="gmp-caption" style={{ marginTop: 10 }}>
                      <strong>DATA:</strong>{' '}
                      <button
                        type="button"
                        className="asset-pill"
                        style={{ padding: '6px 10px', marginRight: 8 }}
                        onClick={() => setUseRealBinanceData(true)}
                        disabled={useRealBinanceData}
                      >
                        REAL (BINANCE)
                      </button>
                      <button
                        type="button"
                        className="asset-pill"
                        style={{ padding: '6px 10px' }}
                        onClick={() => setUseRealBinanceData(false)}
                        disabled={!useRealBinanceData}
                      >
                        SIM
                      </button>
                      {useRealBinanceData && (
                        <span style={{ marginLeft: 10, opacity: 0.75 }}>
                          {BINANCE_SYMBOL_BY_FEED[selectedFeed.id]} • 1m candles
                          {realDataError ? ` • FALLBACK (${realDataError})` : ''}
                        </span>
                      )}
                    </div>
                  )}

                  <svg viewBox="0 0 900 180" preserveAspectRatio="none" className="global-spark">
                    {/* grid */}
                    {(() => {
                      const lines = [];
                      for (let i = 1; i < 6; i++) {
                        const y = (i / 6) * 180;
                        lines.push(<line key={`h-${i}`} x1="0" x2="900" y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />);
                      }
                      for (let i = 1; i < 10; i++) {
                        const x = (i / 10) * 900;
                        lines.push(<line key={`v-${i}`} y1="0" y2="180" x1={x} x2={x} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />);
                      }
                      return lines;
                    })()}

                    {/* faint global polyline */}
                    <polyline points={makeSparkPoints(globalSeries, 900, 180)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />

                    {/* candlesticks for selected feed */}
                    {(() => {
                      const w = 900;
                      const h = 180;
                      const candles = feedCandles.slice(-60);
                      if (!candles.length) return null;
                      const { y, minV, maxV } = makeCandleScale(candles, h);
                      const cw = w / candles.length;
                      const bodyW = Math.max(3, cw * 0.7);
                      const last = candles[candles.length - 1];
                      const lastY = y(last.c);
                      const vol = (c) => Math.min(1, Math.max(0.05, (c.h - c.l) / Math.max(1e-9, c.o)));
                      const candleNodes = candles.map((c, i) => {
                        const x = i * cw + cw / 2;
                        const up = c.c >= c.o;
                        const stroke = up ? selectedFeed.colorUp : selectedFeed.colorDown;
                        const yO = y(c.o);
                        const yC = y(c.c);
                        const yH = y(c.h);
                        const yL = y(c.l);
                        const top = Math.min(yO, yC);
                        const bot = Math.max(yO, yC);
                        const bodyH = Math.max(1.5, bot - top);
                        return (
                          <g key={i} opacity={globalReveal ? 1 : 0.75}>
                            <line x1={x} x2={x} y1={yH} y2={yL} stroke={stroke} strokeWidth="2" opacity="0.75" />
                            <rect x={x - bodyW / 2} y={top} width={bodyW} height={bodyH} fill={stroke} opacity={up ? 0.8 : 0.9} />
                            {/* pseudo volume bars */}
                            <rect
                              x={x - bodyW / 2}
                              y={180 - vol(c) * 26}
                              width={bodyW}
                              height={vol(c) * 26}
                              fill={stroke}
                              opacity="0.20"
                            />
                          </g>
                        );
                      });

                      return candleNodes.concat([
                        // axis labels (min/max)
                        <g key="axislabels" opacity={0.8}>
                          <rect x="10" y="8" width="150" height="42" rx="10" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.14)" />
                          <text x="20" y="26" fill="rgba(255,255,255,0.75)" fontSize="12" fontFamily="Roboto Mono, monospace">
                            High {maxV.toFixed(2)}
                          </text>
                          <text x="20" y="44" fill="rgba(255,255,255,0.65)" fontSize="12" fontFamily="Roboto Mono, monospace">
                            Low  {minV.toFixed(2)}
                          </text>
                          <rect x="10" y="150" width="220" height="22" rx="10" fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.10)" />
                          <text x="20" y="166" fill="rgba(255,255,255,0.65)" fontSize="12" fontFamily="Roboto Mono, monospace">
                            Window: last 60s • candles=60
                          </text>
                        </g>,
                        // last price line
                        <g key="lastline" opacity={globalReveal ? 0.95 : 0.75}>
                          <line x1="0" x2="900" y1={lastY} y2={lastY} stroke="rgba(255,255,255,0.22)" strokeWidth="1" strokeDasharray="6 6" />
                          <rect x="768" y={Math.max(0, lastY - 10)} width="132" height="20" rx="10" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.14)" />
                          <text x="834" y={lastY + 5} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="12" fontFamily="Roboto Mono, monospace">
                            {selectedFeed.label} ${last.c.toFixed(2)}
                          </text>
                        </g>
                      ]);
                    })()}
                  </svg>
                  <div className="gmp-caption">
                    {globalReveal ? 'Mass psychology graph: confidence collapse in real-time.' : 'LOCKED: Awaiting systemic trigger (Stage 3).'}
                  </div>
                </div>
                <div className="gmp-callout">
                  <div className="callout-title">AI ANALYST:</div>
                  <div className="callout-text">
                    {globalReveal
                      ? "This is what a global liquidity vacuum looks like. Watch the curve. It will rewire your brain."
                      : "Your brain is still calm. It won't be, soon."}
                  </div>
                </div>
              </div>
            </div>

            {/* 🧾 REALITY TIMELINE */}
            <div className="glass-panel reality-panel">
              <div className="reality-head">
                <h3>Reality Timeline</h3>
                <div className="reality-sub">No fiction. Just systemic failure mechanics.</div>
              </div>
              <div className="reality-feed">
                {realityTimeline.slice(-8).map((e, idx) => (
                  <div key={idx} className="reality-line">
                    <span className="rt">{e.t}</span>
                    <span className="rm">{e.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="right-rail">
            {/* 📊 Global Exchange Collapse Monitor */}
            <div className={`glass-panel exchange-board stage-${simStage}`}>
              <div className="exchange-board-header">
                <h3>Global Exchange Collapse Monitor (Top 10)</h3>
                <div className="exchange-sub">Live feeds degrade from <strong>Ecstasy</strong> → <strong>Agony</strong></div>
              </div>
              <div className="exchange-grid">
                {EXCHANGES_TOP10.map((ex) => {
                  const row = exchangeBoard[ex.id];
                  const pts = makeSparkPoints(row?.spark || []);
                  const status = row?.status || 'GREEN';
                  const priceStr = (row?.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 });
                  const volStr = (row?.volume ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
                  const ch = row?.change24h ?? 0;
                  const chCls = ch >= 0 ? 'pos' : 'neg';
                  return (
                    <div key={ex.id} className={`exchange-card ${status.toLowerCase()}`}>
                      <div className="exchange-top">
                        <div className="exchange-logo" style={{ borderColor: ex.color }}>
                          <span className="exchange-badge">{ex.badge}</span>
                          <span className="exchange-name">{ex.name}</span>
                          <span className="exchange-ticker">{ex.ticker}</span>
                        </div>
                        <div className={`exchange-status ${status.toLowerCase()}`}>{status}</div>
                      </div>

                      <div className="exchange-metrics">
                        <div className="m-line">
                          <span className="m-k">Price</span>
                          <span className="m-v">${priceStr}</span>
                        </div>
                        <div className="m-line">
                          <span className="m-k">1s Change</span>
                          <span className={`m-v ${chCls}`}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</span>
                        </div>
                        <div className="m-line">
                          <span className="m-k">Volume</span>
                          <span className="m-v">${volStr}</span>
                        </div>
                      </div>

                      <div className="exchange-chart">
                        <svg viewBox="0 0 160 42" preserveAspectRatio="none" className="spark">
                          <polyline points={pts} fill="none" stroke={ex.color} strokeWidth="2" opacity="0.95" />
                        </svg>
                        <div className="chart-caption">Psychological collapse chart</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Result Reveal */}
        {result && !loading && (
          <div className="verdict-card glass-panel stage-5">
            <h2 className="verdict-title">{result.verdict}</h2>
            <div className="verdict-stats">
              <div className="stat"><span>Lost</span><strong>{result.lost}</strong></div>
              <div className="stat"><span>Remaining</span><strong>{result.remaining}</strong></div>
              <div className="stat highlight"><span>Loss %</span><strong>{result.percent}</strong></div>
            </div>
            <div className="real-world-consequences">
              <p>⚠️ <strong>IMPACT REPORT:</strong> No more trading. No more food. No more hope.</p>
            </div>
            <p className="v-comment">"{result.comment}"</p>
            <p className="v-advice">{result.advice}</p>
            <div className="real-world-consequences">
              <p>
                <strong>NEXT:</strong>{' '}
                {wantsCertificate
                  ? 'Scroll down to complete certificate issuance (camera verified + pay 10,000 BITS).'
                  : 'Test complete. You did not request a certificate.'}
              </p>
            </div>
          </div>
        )}

        {pendingCertificate && !loading && (
          <div className="glass-panel cert-panel">
            {(() => {
              const t = CERT_I18N[pendingCertificate.lang] || CERT_I18N.en;
              return (
                <>
                  <div className="cert-head">
                    <h2 className="cert-title">{t.certTitle}</h2>
                    <div className="cert-id">{t.certId}: <strong>{pendingCertificate.certId}</strong></div>
                  </div>
                  <div className="cert-grid">
                    <div className="cert-box wide">
                      <div className="ck">Certificate issuance</div>
                      <div className="cv">
                        This certificate requires a payment of <strong>{certificateFeeBits.toLocaleString()} BITS</strong> to the BitSwapDEX treasury wallet.
                        <br />
                        Treasury wallet: <strong>{BITS_TREASURY_WALLET}</strong>
                        <br />
                        Camera verification: <strong className={pendingCertificate.cameraVerified ? 'ok' : 'bad'}>{pendingCertificate.cameraVerified ? 'OK' : 'FAILED (no face detected)'}</strong>
                        {!bscOk && <><br /><strong className="bad">Network:</strong> Please use BSC Mainnet (chainId 56).</>}
                      </div>
                    </div>
                  </div>
                  <div className="cert-actions">
                    <button
                      type="button"
                      className="tv-toggle"
                      onClick={() => copyToClipboard(BITS_TREASURY_WALLET)}
                      title="Copy treasury wallet address"
                    >
                      Copy treasury
                    </button>
                    <button
                      type="button"
                      className="tv-toggle"
                      onClick={payForCertificate}
                      disabled={certPayState.status === 'pending' || !pendingCertificate.cameraVerified}
                      title="Requires wallet signature. Funds are transferred as an ERC-20 transfer."
                    >
                      {certPayState.status === 'pending' ? 'PAYING...' : `Pay ${certificateFeeBits.toLocaleString()} BITS`}
                    </button>
                  </div>
                  {certPayState.status === 'error' && (
                    <div className="cert-disclaimer" style={{ color: '#ff0033' }}>{certPayState.error}</div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {certificate && !loading && (
          <div className="glass-panel cert-panel">
            {(() => {
              const t = CERT_I18N[certificate.lang] || CERT_I18N.en;
              return (
                <>
                  <div className="cert-head">
                    <h2 className="cert-title">{t.certTitle}</h2>
                    <div className="cert-id">{t.certId}: <strong>{certificate.certId}</strong></div>
                  </div>
                  <div className="cert-grid">
                    <div className="cert-box">
                      <div className="ck">{t.participant}</div>
                      <div className="cv"><strong>{certificate.name}</strong></div>
                      <div className="ck">{t.email}</div>
                      <div className="cv">{certificate.email}</div>
                      <div className="ck">{t.wallet}</div>
                      <div className="cv">{maskAddr(certificate.wallet)}</div>
                    </div>
                    <div className="cert-box">
                      <div className="ck">{t.verdict}</div>
                      <div className={`cv ${certificate.fit ? 'ok' : 'bad'}`}>
                        <strong>{certificate.fit ? t.fit : t.unfit}</strong>
                      </div>
                      <div className="ck">{t.score}</div>
                      <div className={`cert-score ${certificate.fit ? 'ok' : 'bad'}`}>{certificate.score}/100</div>
                      <div className="cert-grade">{t.grade}: <strong>{certificate.grade}</strong></div>
                    </div>
                    <div className="cert-box wide">
                      <div className="ck">{t.summary}</div>
                      <div className="cv">
                        {t.scenario}: <strong>{certificate.scenario}</strong> • {t.issued}: <strong>{new Date(certificate.issuedAt).toUTCString()}</strong><br />
                        {t.starting}: <strong>${Number(certificate.startingWealthUsd || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong> • {t.final}: <strong>$0.00</strong>
                      </div>
                    </div>
                  </div>
                  <div className="cert-actions">
                    <button type="button" className="tv-toggle" onClick={printCertificate}>
                      {t.print}
                    </button>
                    {!!certificate?.payment?.txHash && (
                      <>
                        <button
                          type="button"
                          className="tv-toggle"
                          onClick={() => copyToClipboard(certificate.payment.txHash)}
                          title="Copy transaction hash"
                        >
                          Copy TX
                        </button>
                        <a
                          className="tv-toggle tv-link"
                          href={`https://bscscan.com/tx/${certificate.payment.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          title="View transaction on BscScan"
                        >
                          View on BscScan
                        </a>
                      </>
                    )}
                  </div>
                  <div className="cert-disclaimer">{certificate.disclaimer}</div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      <div className="hell-ticker">
        <div className="ticker-track">
          {HELL_NEWS_EXTENDED.map((n, i) => <span key={i}>{n} • </span>)}
          {HELL_NEWS_EXTENDED.map((n, i) => <span key={i + 'copy'}>{n} • </span>)}
        </div>
      </div>
    </div>
  );
};

export default StressTest;

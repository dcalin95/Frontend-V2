export const EXCHANGES_TOP10 = [
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

export const ASSET_FEEDS = [
  { id: 'binance', label: 'BINANCE', sub: 'Exchange Health', colorUp: '#0ECB81', colorDown: '#F6465D' },
  { id: 'bnb', label: 'BNB', sub: 'Binance Coin', colorUp: '#0ECB81', colorDown: '#F6465D' },
  { id: 'btc', label: 'BTC', sub: 'Bitcoin', colorUp: '#0ECB81', colorDown: '#F6465D' },
  { id: 'eth', label: 'ETH', sub: 'Ethereum', colorUp: '#0ECB81', colorDown: '#F6465D' }
];

export const BINANCE_SYMBOL_BY_FEED = {
  btc: 'BTCUSDT',
  eth: 'ETHUSDT',
  bnb: 'BNBUSDT'
};

export const WALLET_SKINS = [
  { id: 'metamask', name: 'MetaMask', badge: '🦊', accent: '#ff7a00', sub: 'EVM Wallet' },
  { id: 'trust', name: 'Trust Wallet', badge: '🛡️', accent: '#2a5bd7', sub: 'Multi-chain' },
  { id: 'phantom', name: 'Phantom', badge: '👻', accent: '#8b5cf6', sub: 'Solana Wallet' },
  { id: 'coinbase', name: 'Coinbase Wallet', badge: '🟦', accent: '#0052ff', sub: 'Self-custody' }
];

export const DEFAULT_TV_CHANNELS = [
  { key: 'btc_live_edu', name: 'BITCOIN LIVE EDUCATIONAL', kind: 'youtube_video', videoId: '7K1PzK0k5G8', listId: 'PLzyzk1IU5kTYMonZDlPT1Z49vLuEBXwnB' },
  { key: 'btc_live_edu_3', name: 'BITCOIN LIVE EDUCATIONAL (EP 3)', kind: 'youtube_video', videoId: 'y03FS0uF9Q4', listId: 'PLzyzk1IU5kTYMonZDlPT1Z49vLuEBXwnB' },
  { key: 'aljazeera', name: 'AL JAZEERA', kind: 'youtube', channelId: 'UCfiwzLy-8yKzIbsmZTzxDgw' },
  { key: 'dw', name: 'DW NEWS', kind: 'youtube', channelId: 'UCbbS1GE942k3UVqpLklyhIA' },
  { key: 'france24', name: 'FRANCE 24', kind: 'youtube', channelId: 'UCQfwfsi5VrQ8yKZ-UWmAEFg' },
  { key: 'sky', name: 'SKY NEWS', kind: 'youtube', channelId: 'UCkFclpi8U9VJjfxLYoms7Aw' },
  { key: 'euronews', name: 'EURONEWS', kind: 'youtube', channelId: 'UCSrZ3UV4jOidv8ppoVuvW9Q' },
  { key: 'reuters', name: 'REUTERS', kind: 'youtube', channelId: 'UChqUTb7kYRX8-EiaN3XFrSQ' },
  { key: 'ap', name: 'AP', kind: 'youtube', channelId: 'UC52X5wxOL_s5yw0dQk7NtgA' },
];

export const CERT_I18N = {
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

export const SCENARIOS = [
  { id: 'tether', name: "Tether (USDT) Total Depeg", severity: 95, desc: "Tether reserves are revealed as 0. USDT crashes to $0.00. Global exit liquidity vanishes instantly.", icon: "📉" },
  { id: 'bank_run', name: "Systemic Bank Run", severity: 90, desc: "Top 5 US banks freeze withdrawals. Federal reserve announces a 30-day 'Bank Holiday'.", icon: "🏦" },
  { id: 'cb_migration', name: "CBDC Forced Migration", severity: 80, desc: "Governments invalidate all physical cash and crypto. Forced migration to programmable FedCoin.", icon: "🆔" },
  { id: 'internet_kill', name: "Global Internet Kill-Switch", severity: 100, desc: "Undersea cables severed. Satellites jammed. The grid goes dark. Assets are frozen in the void.", icon: "🔌" }
];

export const HELL_NEWS_EXTENDED = [
  "🚨 TETHER DEPEG: USDT reserves confirmed as 0.00%. Trading at $0.0001 globally.",
  "🚨 BANK FREEZE: Chase and Wells Fargo announce 'Permanent Maintenance'. Bail-ins active.",
  "🚨 WAR ALERT: A regional conflict escalates. Shipping routes rerouted. Energy prices spike 300% overnight.",
  "🔥 ENERGY SHOCK: Fuel rationing begins. Supply chains fracture. Food delivery delays become permanent.",
  "💀 MEDICAL EXCLUSION: Health insurance canceled for anyone with a crypto wallet history.",
  "🏚️ EVICTION ALERT: Mortgage debt-swaps failed. You have 1 hour to leave your home.",
  "⚡ CYBER WARFARE: Satellites jammed. GPS degraded. Payment networks enter intermittent failure mode.",
  "🔗 CBDC SLAVERY: FedCoin is now the only legal tender. Your crypto is 'Contraband'.",
  "🕳️ METAMASK DRAIN: 1 million seed phrases leaked by 'AI Shadow Group'. Yours is next.",
  "🍞 STARVATION: A single loaf of bread costs more than your entire life savings.",
  "🛑 BINANCE SEIZURE: Global Interpol task force shuts down the last Binance node.",
  "👾 STACKS HACK: Layer 2 smart contracts remotely rewritten to drain all STX.",
  "🥩 MARGIN LIQUIDATION: Your biological assets (organs) have been collateralized.",
  "👁️ AI ANALYST: 'I'm watching your smart locks engage. You are now trapped outside.'",
  "🚱 UTILITY SHUTDOWN: Electricity and water cut off due to financial insolvency.",
  "🌑 BLACKOUT: Undersea internet cables severed. Global financial darkness starts now.",
  "🚔 REPO NOTICE: Your car has remotely locked its doors and is returning to the bank.",
  "💀 FINAL VERDICT: You are a zero-value biological node in the new controlled economy."
];

export const HELL_QUOTES = [
  "Did you really think the system would let you win?",
  "Hungry? The algorithm doesn't require calories. You do.",
  "The red candle is the only god here.",
  "Your seed phrase is a poem for the abyss.",
  "Liquidity is an illusion. Debt is the only reality.",
  "The screen is your cell. The exit is a lie.",
  "Smile for the attention monitor. It's the last value you have left.",
  "Your children will pay for your leverages.",
  "The simulation is closing. Your account is already zero."
];

export const SFX_GAIN = 0.5;
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export const makeSparkPoints = (values, w = 160, h = 42) => {
  if (!values?.length) return '';
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const span = Math.max(1e-9, maxV - minV);
  return values.map((v, i) => {
    const x = (i / (values.length - 1 || 1)) * w;
    const y = h - ((v - minV) / span) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
};

export const parseBinanceKlines = (klines) => {
  if (!Array.isArray(klines)) return [];
  return klines.map((k) => ({
    o: Number(k?.[1]),
    h: Number(k?.[2]),
    l: Number(k?.[3]),
    c: Number(k?.[4])
  })).filter((c) => [c.o, c.h, c.l, c.c].every(Number.isFinite));
};

export const pctChange = (from, to) => ((to - from) / Math.max(1e-9, from)) * 100;

export const makeFakeEvmAddr = () => {
  const hex = '0123456789abcdef';
  let out = '0x';
  for (let i = 0; i < 40; i++) out += hex[Math.floor(Math.random() * hex.length)];
  return out;
};

export const maskAddr = (addr) => {
  if (!addr) return '0xA3b1…9F2c';
  const a = String(addr);
  if (a.length <= 10) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
};

export const buildNextCandle = ({ prevClose, drift, vol, floor = 0.0001 }) => {
  const open = prevClose;
  const noise = (Math.random() - 0.5) * vol;
  const close = Math.max(floor, open * (1 + drift + noise));
  const high = Math.max(open, close) * (1 + Math.random() * (vol / 2));
  const low = Math.min(open, close) * (1 - Math.random() * (vol / 2));
  return { o: open, h: high, l: low, c: close };
};

export const makeCandleScale = (candles, h) => {
  const minV = Math.min(...candles.map(c => c.l));
  const maxV = Math.max(...candles.map(c => c.h));
  const span = Math.max(1e-9, maxV - minV);
  const y = (v) => h - ((v - minV) / span) * h;
  return { y, minV, maxV };
};

export const parseYouTubeEmbed = (rawUrl) => {
  if (!rawUrl) return '';
  const u = String(rawUrl).trim();
  if (u.includes('youtube.com/embed/')) return u;
  const short = u.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/i);
  if (short?.[1]) return `https://www.youtube-nocookie.com/embed/${short[1]}?autoplay=1&mute=0`;
  const watch = u.match(/[?&]v=([A-Za-z0-9_-]{6,})/i);
  if (watch?.[1]) return `https://www.youtube-nocookie.com/embed/${watch[1]}?autoplay=1&mute=0`;
  const live = u.match(/youtube\.com\/live\/([A-Za-z0-9_-]{6,})/i);
  if (live?.[1]) return `https://www.youtube-nocookie.com/embed/${live[1]}?autoplay=1&mute=0`;
  return '';
};

export const buildEmbedUrl = (ch, muted = true) => {
  if (!ch) return '';
  if (ch.kind === 'youtube') {
    if (!ch.channelId) return '';
    return `https://www.youtube-nocookie.com/embed/live_stream?channel=${encodeURIComponent(ch.channelId)}&autoplay=1&mute=${muted ? 1 : 0}&playsinline=1`;
  }
  if (ch.kind === 'youtube_video') {
    const vid = ch.videoId;
    if (!vid) return '';
    const list = ch.listId ? `&list=${encodeURIComponent(ch.listId)}` : '';
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(vid)}?autoplay=1&mute=${muted ? 1 : 0}&playsinline=1${list}`;
  }
  return '';
};

export const buildOEmbedProbeUrl = (ch) => {
  if (!ch) return '';
  if (ch.kind === 'youtube' && ch.channelId) {
    const url = `https://www.youtube.com/channel/${encodeURIComponent(ch.channelId)}/live`;
    return `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
  }
  if (ch.kind === 'youtube_video' && ch.videoId) {
    const url = `https://www.youtube.com/watch?v=${encodeURIComponent(ch.videoId)}`;
    return `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
  }
  return '';
};

export const shortTitle = (s, max = 10) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + '…';
};

export const getSpeechLang = (key) => {
  const map = {
    en: 'en-US',
    ro: 'ro-RO',
    fr: 'fr-FR',
    de: 'de-DE',
    es: 'es-ES',
    it: 'it-IT',
    nl: 'nl-NL',
    pl: 'pl-PL',
    pt: 'pt-BR',
    ru: 'ru-RU',
    ar: 'ar-SA'
  };
  return map[key] || 'en-US';
};

export const computeEAR = (pts) => {
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const A = d(pts[1], pts[5]);
  const B = d(pts[2], pts[4]);
  const C = d(pts[0], pts[3]);
  return (A + B) / (2 * Math.max(1e-6, C));
};

export const MUSIC_BG_CAP = 0.002;
export const TTS_DUCK_FACTOR = 0.12;
export const TTS_DUCK_MIN = 0.002;
export const TTS_DUCK_MAX = 0.012;


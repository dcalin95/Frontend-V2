/**
 * Inject markdown links `[term](#ota-brand-…)` pentru evidențiere discretă în chat (clasă .ota-chat-brand).
 * - Listă explicită (produse, lanțuri, tickere frecvente)
 * - Pas generic: acronime, expresii Title Case (EN/RO), fără dublări
 * Sare peste blocuri ``` fenced ``` și peste cod inline `...`.
 */

/** Ordinea contează: pattern-uri mai specifice / mai lungi primele. */
const BRAND_SPECS = [
  ['bitswapdex', /\bBitSwapDEX\b/gi],
  ['bitsawpdex', /\bBitSawpDEX\b/gi],
  ['bitswap-dex', /\bBitSwap\s+DEX\b/gi],
  ['openai', /\bOpenAI\b/g],
  ['chatgpt', /\bChatGPT\b/gi],
  ['anthropic', /\bAnthropic\b/g],
  ['claude-ai', /\bClaude\b/g],
  ['metamask', /\bMetaMask\b/g],
  ['walletconnect', /\bWalletConnect\b/g],
  ['pancakeswap', /\bPancakeSwap\b/gi],
  ['uniswap', /\bUniswap\b/gi],
  ['coinbase', /\bCoinbase\b/g],
  ['ethereum', /\bEthereum\b/g],
  ['bitcoin', /\bBitcoin\b/g],
  ['solana', /\bSolana\b/g],
  ['polygon', /\bPolygon\b/g],
  ['arbitrum', /\bArbitrum\b/g],
  ['avalanche', /\bAvalanche\b/g],
  ['cosmos', /\bCosmos\b/g],
  ['leverage', /\bLeverage\b/g],
  ['sei', /\bSEI\b/g],
  ['ota', /\bOTA\b/g],
  ['vault', /\bVault\b/g],
  ['binance', /\bBinance\b/g],
  ['dollar-bits', /\$BITS\b/g],
  ['bits-token', /\bBITS\b/g],
  ['dex-swap', /\bDEX\s+Swap\b/gi],
  ['presale', /\bPresale\b/g],
  ['defi', /\bDeFi\b/g],
  ['web3', /\bWeb3\b/gi],
  ['nft', /\bNFT\b/g],
  ['dao', /\bDAO\b/g],
  ['bsc', /\bBSC\b/g],
  ['bnb', /\bBNB\b/g],
  ['usdt', /\bUSDT\b/g],
  ['usdc', /\bUSDC\b/g],
  ['busd', /\bBUSD\b/g],
  ['dai', /\bDAI\b/g],
  ['weth', /\bWETH\b/g],
  ['wbnb', /\bWBNB\b/g],
  ['evm', /\bEVM\b/g],
  ['github', /\bGitHub\b/g],
  ['gitlab', /\bGitLab\b/g],
  ['telegram', /\bTelegram\b/g],
  ['discord', /\bDiscord\b/g],
  ['twitter-x', /\bTwitter\b/g],
  ['render', /\bRender\b/g],
  ['stripe', /\bStripe\b/g],
  ['stack-overflow', /\bStack\s+Overflow\b/gi],
  ['typescript', /\bTypeScript\b/g],
  ['javascript', /\bJavaScript\b/g],
  ['solidity', /\bSolidity\b/g],
  ['react-js', /\bReact\b/g],
  ['vite', /\bVite\b/g],
  ['npm', /\bnpm\b/g],
  ['nodejs', /\bNode\.js\b/gi],
  ['hardhat', /\bHardhat\b/g],
  ['foundry', /\bFoundry\b/g],
  ['remix-ide', /\bRemix\b/g],
  ['erc', /\bERC-\d+\b/gi],
  ['bep', /\bBEP-\d+\b/gi],
  ['eip', /\bEIP-\d+\b/gi],
];

/** Nu evidenția ca „nume propriu” (acronime scurte / articole / pronume). */
const ACRONYM_BLOCK = new Set(
  [
    'A', 'AN', 'AS', 'AT', 'BE', 'BY', 'DO', 'GO', 'HE', 'HI', 'IF', 'IN', 'IS', 'IT', 'ME', 'MY', 'NO',
    'OF', 'OK', 'ON', 'OR', 'SO', 'TO', 'UP', 'US', 'VS', 'WE', 'AM', 'PM', 'ET', 'UTC', 'GMT', 'EST',
    'THE', 'AND', 'BUT', 'FOR', 'NOT', 'ARE', 'WAS', 'OUR', 'ITS', 'HAS', 'HAD', 'HIM', 'HER', 'WHO',
    'HOW', 'WHY', 'MAY', 'CAN', 'DID', 'GET', 'GOT', 'SET', 'USE', 'NEW', 'OLD', 'WAY', 'DAY', 'YES',
    'YET', 'NOW', 'TOO', 'ANY', 'OWN', 'END', 'TRY', 'LET', 'VAR', 'ALL', 'ONE', 'TWO', 'SIX', 'TEN',
    'BAD', 'BIG', 'FEW', 'LOW', 'TOP', 'VIA', 'PER', 'CUM', 'SUM', 'MAX', 'MIN', 'LOG', 'RAW', 'TAB',
    'ROW', 'COL', 'KEY', 'MAP', 'SET', 'RUN', 'ADD', 'SUB', 'MUL', 'DIV', 'MOD', 'REF', 'SRC', 'DST',
    'ENV', 'DEV', 'PRO', 'STG', 'PRD', 'DOC', 'FAQ', 'TOS', 'SSL', 'TLS', 'TCP', 'UDP', 'DNS', 'CDN',
    'CPU', 'GPU', 'RAM', 'SSD', 'HDD', 'PDF', 'CSV', 'XML', 'PNG', 'JPG', 'GIF', 'SVG', 'CSS', 'DOM',
  ].map((s) => s.toUpperCase())
);

/** Primul cuvânt din Title Case — adesea început de propoziție (EN). */
const TITLE_WORD_BLOCK = new Set(
  [
    'the', 'this', 'that', 'these', 'those', 'when', 'where', 'what', 'which', 'while', 'with', 'from',
    'they', 'there', 'here', 'also', 'each', 'both', 'some', 'many', 'most', 'such', 'very', 'just',
    'like', 'make', 'take', 'come', 'go', 'get', 'got', 'see', 'sees', 'know', 'think', 'want', 'need', 'using',
    'use', 'uses',
    'being', 'having', 'doing', 'your', 'their', 'would', 'could', 'should', 'might', 'about', 'after',
    'before', 'under', 'over', 'again', 'never', 'always', 'maybe', 'even', 'only', 'into', 'onto',
    'than', 'then', 'thus', 'once', 'since', 'until', 'unless', 'though', 'although', 'because',
    'however', 'therefore', 'please', 'thanks', 'hello', 'every', 'another', 'other', 'same', 'such',
    'în', 'la', 'le', 'un', 'o', 'și', 'sau', 'dar', 'pentru', 'care', 'când', 'cum', 'fără', 'foarte',
    'acest', 'aceast', 'aceste', 'acolo', 'deci', 'poate', 'sunt', 'este', 'erau', 'suntem', 'aveți',
    'dacă', 'totuși', 'într', 'spre', 'prin', 'după', 'asupra', 'sub', 'peste', 'între', 'fiecare',
    'price', 'total', 'value', 'market', 'chain', 'token', 'wallet', 'trade', 'order', 'limit', 'swap',
    'pool', 'farm', 'stake', 'claim', 'lock', 'mint', 'burn', 'send', 'network', 'amount', 'balance',
    'source', 'target', 'public', 'private', 'common', 'single', 'double', 'first', 'second', 'third',
    'last', 'next', 'main', 'full', 'half', 'open', 'close', 'high', 'best', 'worst',
  ]
);

function slugFromMatch(s) {
  const h = fnv1a32(String(s));
  return `pn-${h.toString(36)}`;
}

function fnv1a32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function applyBrandSpecs(text) {
  let out = text;
  for (const [slug, pattern] of BRAND_SPECS) {
    out = out.replace(pattern, (match) => `[${match}](#ota-brand-${slug})`);
  }
  return out;
}

/** Placeholder fără litere A–Z (evită acronime / Title pe „LK” din vechiul §§LK0§§). */
const PM = '\uE000';
const PS = '\uE001';
/** Strat interior (applyGenericProperLayers): nu poate folosi același L ca masca exterioară — altfel unmask cu slots=[] șterge placeholder-ii externi. */
const PM_IN = '\uE002';
const PS_IN = '\uE003';

/** Înlocuiește [text](url) cu placeholder; păstrează array pentru restore. */
function maskMarkdownLinks(text) {
  const slots = [];
  const masked = text.replace(/\[[^\]]*\]\([^)]+\)/g, (m) => {
    slots.push(m);
    return `${PM}L${slots.length - 1}${PS}`;
  });
  return { masked, slots };
}

function unmaskMarkdownLinks(text, slots) {
  return text.replace(/\uE000L(\d+)\uE001/g, (_, i) => slots[Number(i)] ?? '');
}

function maskMarkdownLinksInner(text) {
  const slots = [];
  const masked = text.replace(/\[[^\]]*\]\([^)]+\)/g, (m) => {
    slots.push(m);
    return `${PM_IN}L${slots.length - 1}${PS_IN}`;
  });
  return { masked, slots };
}

function unmaskMarkdownLinksInner(text, slots) {
  return text.replace(/\uE002L(\d+)\uE003/g, (_, i) => slots[Number(i)] ?? '');
}

function maskInlineCode(text) {
  const slots = [];
  const masked = text.replace(/(`[^`]*`)/g, (m) => {
    slots.push(m);
    return `${PM}I${slots.length - 1}${PS}`;
  });
  return { masked, slots };
}

function unmaskInlineCode(text, slots) {
  return text.replace(/\uE000I(\d+)\uE001/g, (_, i) => slots[Number(i)] ?? '');
}

/**
 * Cuvânt: fie acronim (2+ majuscule), fie Title case (inclusiv diacritice RO).
 */
const W = '(?:[A-Z]{2,}|[A-ZÀ-ÝĂÂÎȘȚ][a-zà-ÿăâîșț]{2,})';
const RE_TITLE_WORD = '[A-ZÀ-ÝĂÂÎȘȚ][a-zà-ÿăâîșț]{2,}';
const RE_MULTI_TITLE = new RegExp(`\\b(${W}(?:\\s+${W}){1,4})\\b`, 'g');

function wrapMultiWordTitle(text) {
  return text.replace(RE_MULTI_TITLE, (match) => {
    const words = match.trim().split(/\s+/);
    if (words.length < 2) return match;
    const lower0 = words[0].toLowerCase();
    if (TITLE_WORD_BLOCK.has(lower0)) return match;
    if (words.some((w) => TITLE_WORD_BLOCK.has(w.toLowerCase()))) return match;
    return `[${match}](#ota-brand-${slugFromMatch(match)})`;
  });
}

const RE_ACRONYM = /\b([A-Z]{2,})\b/g;

function wrapAcronyms(text) {
  return text.replace(RE_ACRONYM, (match) => {
    if (ACRONYM_BLOCK.has(match)) return match;
    return `[${match}](#ota-brand-${slugFromMatch(match)})`;
  });
}

const RE_SINGLE_TITLE = new RegExp(`\\b(${RE_TITLE_WORD})\\b`, 'g');

function wrapSingleTitle(text) {
  return text.replace(RE_SINGLE_TITLE, (match) => {
    const low = match.toLowerCase();
    if (TITLE_WORD_BLOCK.has(low)) return match;
    if (match.length < 3) return match;
    return `[${match}](#ota-brand-${slugFromMatch(match)})`;
  });
}

/**
 * Ordine: multi-cuvânt → acronime → mască linkuri noi → cuvânt Title singur
 * (altfel „United” din „[United States](...)” e prins de single).
 */
function applyGenericProperLayers(masked) {
  let t = wrapMultiWordTitle(masked);
  t = wrapAcronyms(t);
  const mk = maskMarkdownLinksInner(t);
  t = wrapSingleTitle(mk.masked);
  t = unmaskMarkdownLinksInner(t, mk.slots);
  return t;
}

function processProseSegment(segment) {
  const ic = maskInlineCode(segment);
  let t = ic.masked;
  t = applyBrandSpecs(t);
  let lk = maskMarkdownLinks(t);
  lk.masked = applyGenericProperLayers(lk.masked);
  t = unmaskMarkdownLinks(lk.masked, lk.slots);
  t = unmaskInlineCode(t, ic.slots);
  return t;
}

/**
 * @param {string} md
 * @returns {string}
 */
export function injectOtaChatBrandAnchors(md) {
  if (typeof md !== 'string' || !md) return md;
  const reFence = /(```[\s\S]*?```)/g;
  const parts = [];
  let last = 0;
  let m;
  while ((m = reFence.exec(md)) !== null) {
    if (m.index > last) parts.push({ code: false, text: md.slice(last, m.index) });
    parts.push({ code: true, text: m[0] });
    last = m.index + m[0].length;
  }
  if (last < md.length) parts.push({ code: false, text: md.slice(last) });
  if (parts.length === 0) parts.push({ code: false, text: md });

  return parts
    .map((p) => (p.code ? p.text : processProseSegment(p.text)))
    .join('');
}

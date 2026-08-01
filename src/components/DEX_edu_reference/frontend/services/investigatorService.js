import { ethers } from 'ethers';
import { loadRuntimeConfig } from '../../../../config/runtimeConfig';
import { getBackendUrl } from '../../../../config/apiEndpoints';
import { TOKEN_LIST } from '../../../../utils/tokenList';
import { getOtaWalletAuthToken } from '../utils/otaWalletSession';

const SUPPORTED_CHAINS = {
  1: {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    explorer: 'https://etherscan.io',
    rpcs: ['https://eth.llamarpc.com', 'https://ethereum.publicnode.com', 'https://cloudflare-eth.com'],
  },
  56: {
    id: 56,
    name: 'BNB Chain',
    symbol: 'BNB',
    explorer: 'https://bscscan.com',
    rpcs: ['https://bsc.publicnode.com', 'https://bsc-rpc.publicnode.com', 'https://bsc-dataseed1.binance.org'],
  },
  8453: {
    id: 8453,
    name: 'Base',
    symbol: 'ETH',
    explorer: 'https://basescan.org',
    rpcs: ['https://mainnet.base.org', 'https://base.llamarpc.com', 'https://base.publicnode.com'],
  },
};

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

const ERC20_INTERFACE = new ethers.utils.Interface(ERC20_ABI);
const TRANSFER_TOPIC = ethers.utils.id('Transfer(address,address,uint256)');
const INVESTIGATOR_HISTORY_PREFIX = 'bits_investigator_history_v1';
const INVESTIGATOR_DRAFT_PREFIX = 'bits_investigator_draft_v1';
const INVESTIGATOR_RECORD_PREFIX = 'bits_investigator_record_v1';
const MAX_HISTORY_ITEMS = 24;
const MAX_FLOW_EDGES = 40;
const MAX_EVIDENCE_ITEMS = 80;
const MAX_HOLDINGS = 6;

function nowIso() {
  return new Date().toISOString();
}

function safeLower(value) {
  return String(value || '').trim().toLowerCase();
}

function safeTrim(value) {
  return String(value || '').trim();
}

function isAddressLike(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(safeTrim(value));
}

function isTxHashLike(value) {
  return /^0x[a-fA-F0-9]{64}$/.test(safeTrim(value));
}

function normalizeAddress(value) {
  const raw = safeTrim(value);
  if (!raw) return null;
  if (!isAddressLike(raw)) return null;
  try {
    return ethers.utils.getAddress(raw).toLowerCase();
  } catch {
    return raw.toLowerCase();
  }
}

function normalizeSubjectIdentifier(value) {
  const raw = safeTrim(value);
  if (!raw) return { kind: 'unknown', value: '', normalized: '', display: '' };
  if (isTxHashLike(raw)) {
    return { kind: 'transaction', value: raw, normalized: raw.toLowerCase(), display: `${raw.slice(0, 10)}…${raw.slice(-8)}` };
  }
  if (isAddressLike(raw)) {
    const normalized = normalizeAddress(raw) || raw.toLowerCase();
    return { kind: 'address', value: raw, normalized, display: normalized };
  }
  return { kind: 'unknown', value: raw, normalized: raw, display: raw };
}

function resolveChain(chainId) {
  const id = Number(chainId);
  return SUPPORTED_CHAINS[id] || null;
}

export function buildExplorerUrl(chainId, kind, value) {
  const chain = resolveChain(chainId);
  if (!chain) return '';
  const slug = kind === 'tx' ? 'tx' : kind === 'address' ? 'address' : 'token';
  return `${chain.explorer}/${slug}/${value}`;
}

function buildBackendUrl(path) {
  const base = String(getBackendUrl() || '').replace(/\/$/, '');
  return `${base}${path}`;
}

export function assertNonSyntheticInvestigatorPayload(payload) {
  if (!payload?.demoMode) return payload;
  const error = new Error('Live blockchain data is unavailable. Configure the server-side Moralis provider.');
  error.code = 'INVESTIGATOR_PROVIDER_NOT_CONFIGURED';
  error.missingEnvironmentVariable = 'MORALIS_API_KEY';
  throw error;
}

async function requestJson(url, { signal, method = 'GET', body = undefined, timeoutMs = 30_000, requestHeaders = {} } = {}) {
  await loadRuntimeConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }
  try {
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json', ...requestHeaders };
    const otaWalletToken = getOtaWalletAuthToken();
    if (otaWalletToken) {
      headers.Authorization = `Bearer ${otaWalletToken}`;
    }
    const response = await fetch(url, {
      method,
      credentials: 'include',
      headers,
      body: body == null ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(payload?.error || payload?.message || `HTTP ${response.status}`);
      err.status = response.status;
      err.payload = payload;
      throw err;
    }
    return payload;
  } finally {
    clearTimeout(timeout);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}

async function requestBlob(url, { signal, timeoutMs = 30_000 } = {}) {
  await loadRuntimeConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }
  try {
    const headers = {};
    const token = getOtaWalletAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(url, { credentials: 'include', headers, signal: controller.signal });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload?.message || `HTTP ${response.status}`);
    }
    return response.blob();
  } finally {
    clearTimeout(timeout);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}

function makePublicProvider(chainId) {
  const chain = resolveChain(chainId);
  if (!chain) return null;
  return new ethers.providers.FallbackProvider(
    chain.rpcs.map((rpc) => new ethers.providers.JsonRpcProvider(rpc, chain.id)),
    Math.min(chain.rpcs.length, 2),
  );
}

const providerCache = new Map();

async function getWorkingProvider(chainId) {
  const cached = providerCache.get(chainId);
  if (cached) return cached;
  const provider = makePublicProvider(chainId);
  if (!provider) throw new Error('Unsupported chain');
  await provider.getBlockNumber();
  providerCache.set(chainId, provider);
  return provider;
}

async function fetchTrackedTokenBalances(address, chainId, provider, signal) {
  if (chainId !== 56) return [];
  const tracked = TOKEN_LIST.filter((token) => token?.address && !token.isNative).slice(0, MAX_HOLDINGS);
  const rows = await Promise.allSettled(tracked.map(async (token) => {
    const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
    const [rawBalance, decimals, symbol, name] = await Promise.all([
      contract.balanceOf(address),
      contract.decimals().catch(() => token.decimals || 18),
      contract.symbol().catch(() => token.symbol),
      contract.name().catch(() => token.name),
    ]);
    const balance = Number(ethers.utils.formatUnits(rawBalance, decimals));
    return {
      symbol,
      name,
      address: token.address.toLowerCase(),
      decimals,
      balance,
      balanceHuman: Number.isFinite(balance) ? balance : 0,
      source: 'provider',
      sourceType: 'calculated',
      verifiedContract: true,
    };
  }));
  return rows
    .filter((entry) => entry.status === 'fulfilled' && entry.value && Number(entry.value.balance) > 0)
    .map((entry) => entry.value)
    .slice(0, MAX_HOLDINGS);
}

async function fetchAddressChainSnapshot(address, chainId, provider, signal) {
  const [balanceRaw, code] = await Promise.all([
    provider.getBalance(address),
    provider.getCode(address),
  ]);
  const chain = resolveChain(chainId);
  const balance = Number(ethers.utils.formatEther(balanceRaw));
  const isContract = code && code !== '0x';
  const tokenHoldings = await fetchTrackedTokenBalances(address, chainId, provider, signal).catch(() => []);
  return {
    chainId,
    chainName: chain?.name || `Chain ${chainId}`,
    nativeSymbol: chain?.symbol || 'ETH',
    nativeBalance: balance,
    nativeBalanceHuman: Number.isFinite(balance) ? balance : 0,
    isContract,
    codeHash: code && code !== '0x' ? ethers.utils.keccak256(code) : null,
    tokenHoldings,
    source: 'provider',
    sourceType: 'observed',
  };
}

function countByKey(rows, keyFn) {
  const map = new Map();
  for (const row of rows || []) {
    const key = keyFn(row);
    if (!key) continue;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

function aggregateAmounts(rows, keyFn, amountFn) {
  const map = new Map();
  for (const row of rows || []) {
    const key = keyFn(row);
    if (!key) continue;
    const amount = Number(amountFn(row) || 0);
    const next = (map.get(key) || 0) + (Number.isFinite(amount) ? amount : 0);
    map.set(key, next);
  }
  return map;
}

function deriveSignalsFromTransfers(transfers = [], subjectAddress = '') {
  const subject = safeLower(subjectAddress);
  const incoming = transfers.filter((row) => safeLower(row.recipient) === subject);
  const outgoing = transfers.filter((row) => safeLower(row.sender) === subject);
  const counterparties = new Set();
  transfers.forEach((row) => {
    const s = safeLower(row.sender);
    const r = safeLower(row.recipient);
    if (s && s !== subject) counterparties.add(s);
    if (r && r !== subject) counterparties.add(r);
  });
  const signals = [];
  const uniqueRecipients = new Set(outgoing.map((row) => safeLower(row.recipient)).filter(Boolean));
  const uniqueSenders = new Set(incoming.map((row) => safeLower(row.sender)).filter(Boolean));
  const totalIncoming = incoming.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const totalOutgoing = outgoing.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  if (outgoing.length >= 3 && uniqueRecipients.size >= 3) {
    signals.push({
      code: 'rapid-fund-movement',
      category: 'rapid fund movement',
      title: 'Rapid fund movement',
      severity: 'Medium',
      confidence: 'Medium',
      description: `Observed ${outgoing.length} outbound transfers to ${uniqueRecipients.size} distinct recipients.`,
      evidenceHint: 'Outbound transfer pattern',
      points: 22,
    });
  }
  if (transfers.length >= 8 && counterparties.size >= 5) {
    signals.push({
      code: 'high-fan-out',
      category: 'high fan-out',
      title: 'High fan-out',
      severity: 'Low',
      confidence: 'Medium',
      description: `The subject interacted with ${counterparties.size} counterparties in the observed sample.`,
      evidenceHint: 'Counterparty spread',
      points: 12,
    });
  }
  if (uniqueSenders.size >= 5) {
    signals.push({
      code: 'high-fan-in',
      category: 'high fan-in',
      title: 'High fan-in',
      severity: 'Low',
      confidence: 'Medium',
      description: `Inbound transfers were sourced from ${uniqueSenders.size} distinct senders.`,
      evidenceHint: 'Inbound transfer spread',
      points: 10,
    });
  }
  if (totalIncoming > 0 && totalOutgoing / totalIncoming >= 0.75) {
    signals.push({
      code: 'pass-through',
      category: 'circular movement',
      title: 'Pass-through movement',
      severity: 'Medium',
      confidence: 'Medium',
      description: `Outbound value is ${(totalOutgoing / totalIncoming * 100).toFixed(1)}% of observed inbound value.`,
      evidenceHint: 'Inbound/outbound ratio',
      points: 20,
    });
  }
  const repeatedAmounts = countByKey(transfers, (row) => `${row.tokenSymbol || 'TOKEN'}:${Number(row.amount || 0).toFixed(4)}`);
  if ([...repeatedAmounts.values()].some((count) => count >= 3)) {
    signals.push({
      code: 'repeated-transfers',
      category: 'repeated transfers to same counterparty',
      title: 'Repeated transfer size',
      severity: 'Low',
      confidence: 'Medium',
      description: 'At least one transfer size repeats across multiple events in the sample.',
      evidenceHint: 'Repeated amount pattern',
      points: 8,
    });
  }
  if (transfers.some((row) => Number(row.amount || 0) >= 100000)) {
    signals.push({
      code: 'large-balance-change',
      category: 'major balance change',
      title: 'Large value transfer',
      severity: 'Medium',
      confidence: 'High',
      description: 'The observed sample includes a transfer whose nominal amount is at least 100,000 units.',
      evidenceHint: 'Large nominal transfer',
      points: 15,
    });
  }

  return signals.sort((a, b) => b.points - a.points);
}

function buildFindingsFromSignals(signals, transfers, subjectAddress, chainId) {
  const findings = [];
  const subject = safeLower(subjectAddress);
  const txWindow = transfers.length
    ? {
        start: transfers[transfers.length - 1]?.timestamp || null,
        end: transfers[0]?.timestamp || null,
      }
    : { start: null, end: null };
  const topTransfers = [...transfers].slice(0, 12);

  for (const signal of signals || []) {
    findings.push({
      id: `finding-${signal.code}`,
      title: signal.title,
      severity: signal.severity || 'Info',
      confidence: signal.confidence || 'Medium',
      category: signal.category || signal.code,
      description: signal.description,
      supportingEvidence: topTransfers
        .slice(0, 3)
        .map((row) => row.txHash)
        .filter(Boolean),
      affectedEntities: [subject].filter(Boolean),
      timeRange: txWindow,
      method: 'deterministic detector',
      detectorVersion: '1.0.0',
      status: 'Needs Review',
      investigatorNotes: 'Auto-generated from bounded transfer heuristics.',
      sourceType: 'heuristic',
    });
  }
  return findings;
}

function mapBackendSignalsToFindings(signals = [], subjectAddress, chainId, transfers = []) {
  return (signals || []).map((signal, index) => ({
    id: `backend-signal-${index}`,
    title: signal.label || signal.title || signal.code || 'Signal',
    severity: signal.points >= 25 ? 'High' : signal.points >= 15 ? 'Medium' : 'Low',
    confidence: signal.points >= 25 ? 'High' : 'Medium',
    category: signal.label || signal.code || 'backend signal',
    description: signal.evidence || signal.description || 'Backend signal with evidence provided by the server.',
    supportingEvidence: transfers.slice(0, 3).map((row) => row.txHash).filter(Boolean),
    affectedEntities: [safeLower(subjectAddress)].filter(Boolean),
    timeRange: transfers.length ? { start: transfers.at(-1)?.timestamp || null, end: transfers[0]?.timestamp || null } : null,
    method: 'backend route /api/investigator/analyse',
    detectorVersion: 'backend-demo-1',
    status: 'Open',
    investigatorNotes: 'Source returned by backend investigator router.',
    sourceType: 'external-label',
  }));
}

function buildEvidenceFromTransfers(transfers = [], chainId, sourceProvider = 'backend') {
  return (transfers || []).slice(0, MAX_EVIDENCE_ITEMS).map((row, index) => ({
    id: `evidence-${index}`,
    evidenceType: 'token-transfer',
    chainId,
    transactionHash: row.txHash || null,
    blockNumber: row.blockNumber ?? null,
    logIndex: row.logIndex ?? index,
    subject: row.sender || row.recipient || null,
    source: row.source || sourceProvider,
    payload: row,
    collectedAt: row.collectedAt || nowIso(),
    contentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(JSON.stringify({
      txHash: row.txHash || '',
      sender: row.sender || '',
      recipient: row.recipient || '',
      tokenSymbol: row.tokenSymbol || '',
      amount: row.amount || '',
      timestamp: row.timestamp || '',
    }))),
    explorerUrl: buildExplorerUrl(chainId, 'tx', row.txHash || ''),
    sourceType: row.sourceType || 'observed',
  }));
}

function buildFlowRows(transfers = [], chainId) {
  return (transfers || []).slice(0, MAX_FLOW_EDGES).map((row, index) => ({
    id: `flow-${index}`,
    sourceEntity: row.sender,
    destinationEntity: row.recipient,
    asset: row.tokenSymbol || 'TOKEN',
    amount: Number(row.amount || 0),
    timestamp: row.timestamp || null,
    transactionHash: row.txHash || null,
    chainId,
    direction: safeLower(row.sender) === safeLower(row.subject) ? 'outbound' : 'transfer',
    knownLabel: row.label || row.knownLabel || null,
    expandableDetails: row,
  }));
}

function buildTimelineEntries(transfers = [], findings = [], analysis = {}) {
  const rows = [];
  for (const row of transfers || []) {
    rows.push({
      id: `timeline-transfer-${row.txHash || row.timestamp}`,
      ts: row.timestamp || nowIso(),
      type: 'Transfer',
      title: `${row.tokenSymbol || 'TOKEN'} transfer`,
      description: `${row.sender || 'Unknown'} → ${row.recipient || 'Unknown'} · ${row.amount || '0'}`,
      sourceType: 'observed',
      asset: row.tokenSymbol || 'TOKEN',
      severity: 'Info',
      reference: row.txHash || null,
    });
  }
  for (const finding of findings || []) {
    rows.push({
      id: `timeline-finding-${finding.id}`,
      ts: analysis.generatedAt || nowIso(),
      type: 'Finding',
      title: finding.title,
      description: finding.description,
      sourceType: finding.sourceType || 'heuristic',
      asset: null,
      severity: finding.severity || 'Info',
      reference: finding.id,
    });
  }
  return rows
    .filter((row) => row.ts)
    .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
    .slice(0, 100);
}

function summarizeParties(transfers = [], subjectAddress) {
  const subject = safeLower(subjectAddress);
  const outgoing = transfers.filter((row) => safeLower(row.sender) === subject);
  const incoming = transfers.filter((row) => safeLower(row.recipient) === subject);
  const counterpartyCounts = new Map();
  for (const row of transfers || []) {
    for (const address of [row.sender, row.recipient]) {
      const normalized = safeLower(address);
      if (!normalized || normalized === subject) continue;
      counterpartyCounts.set(normalized, (counterpartyCounts.get(normalized) || 0) + 1);
    }
  }
  const majorCounterparties = [...counterpartyCounts.entries()]
    .map(([address, count]) => ({
      address,
      count,
      outbound: outgoing.filter((row) => safeLower(row.recipient) === address).length,
      inbound: incoming.filter((row) => safeLower(row.sender) === address).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  return majorCounterparties;
}

function buildExecutiveSummary({ subject, chain, nativeBalance, transferCount, signals, backend }) {
  const parts = [];
  parts.push(`${subject.kind === 'transaction' ? 'Transaction-linked investigation' : 'Address investigation'} on ${chain.name}.`);
  if (Number.isFinite(nativeBalance)) parts.push(`Observed native balance: ${nativeBalance.toFixed(nativeBalance >= 1000 ? 2 : 6)} ${chain.symbol}.`);
  if (Number.isFinite(transferCount)) parts.push(`Observed ${transferCount} transfer events in the server sample.`);
  if (signals.length) {
    const top = signals[0];
    parts.push(`Top heuristic: ${top.title.toLowerCase()} (${top.severity.toLowerCase()}).`);
  }
  if (backend?.disclaimer) parts.push(`Backend note: ${backend.disclaimer}`);
  return parts.join(' ');
}

function getInvestigatorHistoryScope(scopeKey) {
  return `${INVESTIGATOR_HISTORY_PREFIX}:${safeTrim(scopeKey) || 'anon'}`;
}

function getInvestigatorDraftKey(scopeKey) {
  return `${INVESTIGATOR_DRAFT_PREFIX}:${safeTrim(scopeKey) || 'anon'}`;
}

function getInvestigatorRecordKey(scopeKey, investigationId) {
  return `${INVESTIGATOR_RECORD_PREFIX}:${safeTrim(scopeKey) || 'anon'}:${safeTrim(investigationId)}`;
}

function readJsonFromStorage(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJsonToStorage(key, value) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function loadInvestigatorHistory(scopeKey) {
  const history = readJsonFromStorage(getInvestigatorHistoryScope(scopeKey), []);
  return Array.isArray(history) ? history : [];
}

export function saveInvestigatorHistory(scopeKey, history) {
  const trimmed = Array.isArray(history) ? history.slice(0, MAX_HISTORY_ITEMS) : [];
  writeJsonToStorage(getInvestigatorHistoryScope(scopeKey), trimmed);
  return trimmed;
}

export function loadInvestigatorDraft(scopeKey) {
  return readJsonFromStorage(getInvestigatorDraftKey(scopeKey), null);
}

export function saveInvestigatorDraft(scopeKey, draft) {
  if (!draft) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(getInvestigatorDraftKey(scopeKey));
    } catch {
      /* ignore */
    }
    return null;
  }
  writeJsonToStorage(getInvestigatorDraftKey(scopeKey), draft);
  return draft;
}

export async function fetchAddressInvestigation({ address, chainId, signal }) {
  const chain = resolveChain(chainId);
  const normalized = normalizeAddress(address);
  if (!chain) throw new Error('Unsupported chain selected.');
  if (!normalized) throw new Error('A valid EVM address is required.');

  const backendUrl = buildBackendUrl(`/api/investigator/analyse/${normalized}?chainId=${chainId}`);
  const [backendResult, bscWalletResult, provider] = await Promise.all([
    requestJson(backendUrl, { signal, timeoutMs: 30_000 }).catch((error) => ({ error: error.message, status: error.status || 500 })),
    chainId === 56
      ? requestJson(buildBackendUrl(`/api/bsc/large-transfers/wallet/${normalized}`), { signal, timeoutMs: 30_000 }).catch((error) => ({ error: error.message, status: error.status || 500 }))
      : Promise.resolve(null),
    getWorkingProvider(chainId),
  ]);
  assertNonSyntheticInvestigatorPayload(backendResult);

  const providerSnapshot = await fetchAddressChainSnapshot(normalized, chainId, provider, signal).catch((error) => ({
    error: error.message,
    sourceType: 'unavailable',
  }));

  const transfers = Array.isArray(backendResult?.transfers) ? backendResult.transfers : [];
  const walletTransfers = Array.isArray(bscWalletResult?.transactions)
    ? bscWalletResult.transactions.map((row) => ({
        txHash: row.txHash,
        timestamp: row.timestamp ? new Date(Number(row.timestamp) * 1000).toISOString() : null,
        sender: row.from,
        recipient: row.to,
        tokenSymbol: row.token,
        amount: row.amount,
        blockNumber: row.blockNumber,
        logIndex: row.logIndex,
        explorerUrl: row.explorerUrl,
        recurrentRoute: row.recurrentRoute,
        routeRepeatCount: row.routeRepeatCount,
        source: 'bsc-large-transfers',
        sourceType: 'observed',
      }))
    : [];

  const mergedTransfers = [...transfers, ...walletTransfers].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
  const chainTransfers = mergedTransfers.slice(0, MAX_EVIDENCE_ITEMS);
  const signals = [...deriveSignalsFromTransfers(chainTransfers, normalized), ...(Array.isArray(backendResult?.signals) ? backendResult.signals : []).map((signal) => ({
    code: signal.code || signal.label || signal.title,
    category: signal.label || signal.code || 'backend signal',
    title: signal.label || signal.title || signal.code || 'Signal',
    severity: signal.points >= 25 ? 'High' : signal.points >= 15 ? 'Medium' : 'Low',
    confidence: signal.points >= 25 ? 'High' : 'Medium',
    description: signal.evidence || signal.description || 'Server-provided signal',
    evidenceHint: signal.evidence || null,
    points: signal.points || 0,
  }))];
  signals.sort((a, b) => (b.points || 0) - (a.points || 0));

  const findings = [
    ...mapBackendSignalsToFindings(backendResult?.signals || [], normalized, chainId, chainTransfers),
    ...buildFindingsFromSignals(signals, chainTransfers, normalized, chainId),
  ];

  const majorCounterparties = summarizeParties(chainTransfers, normalized);
  const firstSeen = chainTransfers.length ? [...chainTransfers].map((row) => row.timestamp).filter(Boolean).sort()[0] || null : null;
  const lastSeen = chainTransfers.length ? [...chainTransfers].map((row) => row.timestamp).filter(Boolean).sort().slice(-1)[0] || null : null;
  const transactionCount = Number(backendResult?.transferCount || chainTransfers.length || 0);
  const result = {
    subject: {
      kind: 'address',
      input: normalized,
      normalized,
      display: normalized,
      chainId,
      chainName: chain.name,
    },
    chain: {
      id: chain.id,
      name: chain.name,
      symbol: chain.symbol,
      explorer: chain.explorer,
    },
    backendResult,
    providerSnapshot,
    transfers: chainTransfers,
    findings,
    signals,
    evidence: buildEvidenceFromTransfers(chainTransfers, chainId, chainId === 56 ? 'backend/bsc' : 'backend/investigator'),
    flow: buildFlowRows(chainTransfers, chainId),
    timeline: buildTimelineEntries(chainTransfers, findings, backendResult || {}),
    overview: {
      entityType: providerSnapshot?.isContract ? 'Smart contract' : 'Wallet',
      normalizedAddress: normalized,
      chain: chain.name,
      nativeBalance: providerSnapshot?.nativeBalance ?? null,
      nativeBalanceSource: providerSnapshot?.source || 'provider',
      tokenHoldings: providerSnapshot?.tokenHoldings || [],
      firstSeen,
      lastSeen,
      transactionCount,
      majorCounterparties,
      labels: chainId === 56 && bscWalletResult?.classification ? [bscWalletResult.classification] : [],
      verifiedContractStatus: providerSnapshot?.isContract ? 'Code present' : 'Not a contract',
      deployer: bscWalletResult?.contractDeployments?.deployments?.[0]?.deployer || null,
      currentRiskAssessment: backendResult?.riskLevel || (findings[0]?.severity || 'Info'),
      executiveSummary: buildExecutiveSummary({
        subject: { kind: 'address' },
        chain,
        nativeBalance: providerSnapshot?.nativeBalance ?? NaN,
        transferCount: transactionCount,
        signals,
        backend: backendResult,
      }),
    },
    partial: Boolean(backendResult?.error || providerSnapshot?.error || bscWalletResult?.error),
    limitations: [
      providerSnapshot?.error ? `Provider snapshot unavailable: ${providerSnapshot.error}` : null,
      chainId === 56 && !bscWalletResult ? 'BSC wallet intelligence not requested.' : null,
    ].filter(Boolean),
    sources: {
      backend: 'backend',
      provider: providerSnapshot?.source || 'provider',
      walletIntel: chainId === 56 ? 'bsc-large-transfers' : null,
    },
    generatedAt: backendResult?.generatedAt || nowIso(),
  };

  return result;
}

export async function createInvestigationCase({ title, objective, subjects, scope = {}, signal }) {
  return requestJson(buildBackendUrl('/api/investigator/cases'), {
    method: 'POST',
    body: { title, objective, subjects, scope },
    signal,
    timeoutMs: 20_000,
  });
}

export async function listInvestigationCases({ limit = 25, offset = 0, signal } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return requestJson(buildBackendUrl(`/api/investigator/cases?${params}`), {
    signal,
    timeoutMs: 20_000,
  });
}

export async function getInvestigationCase(caseId, { signal } = {}) {
  return requestJson(buildBackendUrl(`/api/investigator/cases/${encodeURIComponent(caseId)}`), {
    signal,
    timeoutMs: 20_000,
  });
}

export async function runPersistedInvestigationCase(caseId, { signal } = {}) {
  return requestJson(buildBackendUrl(`/api/investigator/cases/${encodeURIComponent(caseId)}/run`), {
    method: 'POST',
    body: {},
    signal,
    timeoutMs: 60_000,
  });
}

export async function createInvestigationJob(caseId, { depth = 'bounded', cursor = null, signal, idempotencyKey } = {}) {
  return requestJson(buildBackendUrl(`/api/investigator/cases/${encodeURIComponent(caseId)}/jobs`), {
    method: 'POST',
    body: { depth, cursor },
    requestHeaders: { 'Idempotency-Key': idempotencyKey || `investigator-${caseId}-${Date.now()}` },
    signal,
    timeoutMs: 20_000,
  });
}

export async function getInvestigationJob(caseId, jobId, { signal } = {}) {
  return requestJson(buildBackendUrl(`/api/investigator/cases/${encodeURIComponent(caseId)}/jobs/${encodeURIComponent(jobId)}`), { signal, timeoutMs: 20_000 });
}

export async function cancelInvestigationJob(caseId, jobId, { signal } = {}) {
  return requestJson(buildBackendUrl(`/api/investigator/cases/${encodeURIComponent(caseId)}/jobs/${encodeURIComponent(jobId)}/cancel`), {
    method: 'POST', body: {}, signal, timeoutMs: 20_000,
  });
}

export async function retryInvestigationJob(caseId, jobId, { signal, idempotencyKey } = {}) {
  return requestJson(buildBackendUrl(`/api/investigator/cases/${encodeURIComponent(caseId)}/jobs/${encodeURIComponent(jobId)}/retry`), {
    method: 'POST', body: {}, signal,
    requestHeaders: { 'Idempotency-Key': idempotencyKey || `investigator-retry-${jobId}-${Date.now()}` },
    timeoutMs: 20_000,
  });
}

export async function getInvestigationSnapshot(caseId, { snapshotId, signal } = {}) {
  const params = snapshotId ? `?snapshotId=${encodeURIComponent(snapshotId)}` : '';
  return requestJson(buildBackendUrl(`/api/investigator/cases/${encodeURIComponent(caseId)}/report.json${params}`), { signal, timeoutMs: 30_000 });
}

export function mapCanonicalSnapshotToWorkspace({ manifest, snapshot }, investigation) {
  const categories = snapshot?.categories || {};
  const observations = categories.providerObservations || [];
  const transfers = observations.map((record) => record.observation || {}).filter(Boolean);
  const findings = (categories.heuristicFindings || []).map((finding) => ({
    id: finding.id || finding.findingId || finding.finding_identity,
    title: finding.title_key || finding.title || finding.detector || 'Observed pattern',
    description: finding.interpretation || finding.observations?.[0] || 'Bounded heuristic finding.',
    severity: String(finding.severity || 'info').replace(/^./, (letter) => letter.toUpperCase()),
    confidence: String(finding.confidence || 'medium').replace(/^./, (letter) => letter.toUpperCase()),
    category: finding.category || 'pattern',
    status: finding.status || 'needs_review',
    method: finding.detector || 'deterministic detector',
    detectorVersion: `${finding.detector || 'detector'}@${finding.detector_version || 'unknown'}`,
    supportingEvidence: finding.evidence_ids || [],
    limitations: finding.limitations || [],
    alternativeExplanations: finding.alternatives || [],
  }));
  const evidence = observations.map((record) => {
    const item = record.observation || {};
    return {
      id: record.evidenceId,
      evidenceType: 'token_transfer',
      chainId: snapshot.subject?.chainId,
      transactionHash: item.txHash,
      blockNumber: item.blockNumber,
      logIndex: item.logIndex,
      source: snapshot.coverage?.provider || 'provider',
      sourceType: 'observed',
      explorerUrl: buildExplorerUrl(snapshot.subject?.chainId, 'tx', item.txHash),
    };
  });
  const flow = transfers.map((item, index) => ({
    id: observations[index]?.evidenceId || `${item.txHash}:${item.logIndex}`,
    sourceEntity: item.sender,
    destinationEntity: item.recipient,
    asset: item.amount?.tokenSymbol || item.tokenSymbol,
    canonicalAssetId: item.amount?.canonicalAssetId,
    amount: item.amount?.normalizedValue,
    rawAmount: item.amount?.rawValue,
    timestamp: item.timestamp,
    transactionHash: item.txHash,
    chainId: snapshot.subject?.chainId,
    direction: item.sender === snapshot.subject?.identifier ? 'outbound' : 'inbound',
  }));
  const timeline = transfers.map((item, index) => ({
    id: observations[index]?.evidenceId || `${item.txHash}:${item.logIndex}`,
    type: 'Transfer',
    ts: item.timestamp,
    title: `${item.amount?.tokenSymbol || 'Token'} transfer`,
    description: `${item.sender} to ${item.recipient}`,
    severity: 'Info',
    sourceType: 'observed',
  }));
  const severityRank = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
  const overallRisk = findings.reduce((highest, finding) => {
    const current = String(finding.severity).toLowerCase();
    return (severityRank[current] || 0) > (severityRank[highest] || 0) ? current : highest;
  }, 'low');
  const firstSeen = transfers.map((item) => item.timestamp).filter(Boolean).sort()[0] || null;
  const lastSeen = transfers.map((item) => item.timestamp).filter(Boolean).sort().at(-1) || null;
  const subject = snapshot.subject || {};
  const subjectKind = ['contract', 'token'].includes(subject.type) ? subject.type : subject.type === 'transaction' ? 'transaction' : 'address';
  return {
    id: snapshot.snapshotId,
    serverCaseId: manifest.caseId,
    snapshotId: manifest.snapshotId,
    reportHash: manifest.reportHash,
    status: 'Completed',
    updatedAt: manifest.generatedAt,
    subjectValue: subject.identifier,
    subject: { kind: subjectKind, normalized: subject.identifier, display: subject.identifier },
    chainId: subject.chainId,
    chainName: resolveChain(subject.chainId)?.name || `Chain ${subject.chainId}`,
    overallRisk,
    partial: snapshot.coverage?.status !== 'complete',
    coverage: snapshot.coverage,
    sources: { backend: 'canonical-postgresql', provider: snapshot.coverage?.provider || 'provider', walletIntel: null },
    limitations: [...(snapshot.gaps || []), ...(snapshot.providerFailures || []).map((failure) => failure.code || String(failure))],
    result: {
      overview: {
        executiveSummary: `${transfers.length} provider-observed events and ${findings.length} heuristic findings in snapshot ${manifest.snapshotId}.`,
        entityType: subject.type || 'unknown', chain: resolveChain(subject.chainId)?.name || subject.chainId,
        transactionCount: transfers.length, firstSeen, lastSeen,
        nativeBalance: null, nativeBalanceSource: 'Unavailable', tokenHoldings: [], labels: [],
        verifiedContractStatus: 'Unavailable', deployer: null, currentRiskAssessment: overallRisk,
        majorCounterparties: [],
      },
      findings, evidence, flow, timeline, transfers,
      assetInventory: snapshot.assetInventory || null,
      tokenForensics: snapshot.contractToken || investigation?.tokenForensics || null,
    },
  };
}

export async function getInvestigationGraph(caseId, options = {}) {
  const params = new URLSearchParams();
  if (options.snapshotId) params.set('snapshotId', options.snapshotId);
  if (options.direction) params.set('direction', options.direction);
  if (options.canonicalAssetId) params.set('asset', options.canonicalAssetId);
  if (options.includeSpam) params.set('includeSpam', 'true');
  const queryString = params.toString();
  return requestJson(buildBackendUrl(`/api/investigator/cases/${encodeURIComponent(caseId)}/graph${queryString ? `?${queryString}` : ''}`), { signal: options.signal, timeoutMs: 30_000 });
}

export async function downloadInvestigationReport(caseId, { snapshotId, format = 'pdf', signal } = {}) {
  const params = snapshotId ? `?snapshotId=${encodeURIComponent(snapshotId)}` : '';
  return requestBlob(buildBackendUrl(`/api/investigator/cases/${encodeURIComponent(caseId)}/report.${format}${params}`), { signal, timeoutMs: 30_000 });
}

export async function createInvestigationLossClaim(caseId, claim, { signal } = {}) {
  return requestJson(buildBackendUrl(`/api/investigator/cases/${encodeURIComponent(caseId)}/loss-claims`), {
    method: 'POST',
    body: claim,
    signal,
    timeoutMs: 20_000,
  });
}

export async function fetchTransactionInvestigation({ txHash, chainId, signal }) {
  const chain = resolveChain(chainId);
  if (!chain) throw new Error('Unsupported chain selected.');
  const normalizedHash = safeTrim(txHash);
  if (!isTxHashLike(normalizedHash)) throw new Error('A valid transaction hash is required.');

  const provider = await getWorkingProvider(chainId);
  const tx = await provider.getTransaction(normalizedHash);
  if (!tx) throw new Error('Transaction not found on the selected chain.');
  const receipt = await provider.getTransactionReceipt(normalizedHash);
  const block = tx.blockNumber != null ? await provider.getBlock(tx.blockNumber) : null;
  const subjectAddress = normalizeAddress(tx.to || tx.from);
  if (!subjectAddress) throw new Error('Unable to derive a subject address from the selected transaction.');
  const base = await fetchAddressInvestigation({ address: subjectAddress, chainId, signal });

  const parsedTransfers = [];
  if (receipt?.logs?.length) {
    for (const [index, log] of receipt.logs.entries()) {
      if (!log?.topics?.length || log.topics[0] !== TRANSFER_TOPIC) continue;
      try {
        const parsed = ERC20_INTERFACE.parseLog(log);
        const from = normalizeAddress(parsed.args.from);
        const to = normalizeAddress(parsed.args.to);
        const value = Number(ethers.utils.formatUnits(parsed.args.value, 18));
        parsedTransfers.push({
          txHash: normalizedHash,
          timestamp: block?.timestamp ? new Date(Number(block.timestamp) * 1000).toISOString() : tx.timestamp ? new Date(Number(tx.timestamp) * 1000).toISOString() : nowIso(),
          sender: from,
          recipient: to,
          tokenSymbol: 'ERC20',
          amount: Number.isFinite(value) ? value : 0,
          blockNumber: receipt.blockNumber,
          logIndex: log.logIndex ?? index,
          source: 'receipt-log',
          sourceType: 'observed',
          contractAddress: log.address,
          explorerUrl: buildExplorerUrl(chainId, 'tx', normalizedHash),
        });
      } catch {
        /* ignore non-Transfer logs */
      }
    }
  }

  const transferCount = parsedTransfers.length || 1;
  const findings = [
    ...base.findings,
    {
      id: 'finding-transaction-link',
      title: 'Transaction anchor identified',
      severity: 'Info',
      confidence: 'High',
      category: 'transaction linkage',
      description: `The supplied transaction hash resolves to the subject address ${subjectAddress}.`,
      supportingEvidence: [normalizedHash],
      affectedEntities: [subjectAddress],
      timeRange: {
        start: block?.timestamp ? new Date(Number(block.timestamp) * 1000).toISOString() : null,
        end: block?.timestamp ? new Date(Number(block.timestamp) * 1000).toISOString() : null,
      },
      method: 'transaction resolution',
      detectorVersion: '1.0.0',
      status: 'Confirmed',
      investigatorNotes: 'Derived from chain transaction lookup.',
      sourceType: 'observed',
    },
  ];

  const txEvidence = [{
    id: 'evidence-transaction',
    evidenceType: 'transaction',
    chainId,
    transactionHash: normalizedHash,
    blockNumber: receipt?.blockNumber ?? tx.blockNumber ?? null,
    logIndex: null,
    subject: subjectAddress,
    source: 'provider',
    payload: {
      tx,
      receipt,
      block,
    },
    collectedAt: nowIso(),
    contentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(JSON.stringify({
      txHash: normalizedHash,
      from: tx.from || '',
      to: tx.to || '',
      blockNumber: receipt?.blockNumber || tx.blockNumber || '',
    }))),
    explorerUrl: buildExplorerUrl(chainId, 'tx', normalizedHash),
    sourceType: 'observed',
  }];

  return {
    ...base,
    subject: {
      kind: 'transaction',
      input: normalizedHash,
      normalized: normalizedHash.toLowerCase(),
      display: `${normalizedHash.slice(0, 10)}…${normalizedHash.slice(-8)}`,
      chainId,
      chainName: chain.name,
      derivedAddress: subjectAddress,
    },
    overview: {
      ...base.overview,
      entityType: 'Transaction anchor',
      normalizedAddress: subjectAddress,
      transactionHash: normalizedHash,
      transactionDirection: tx.from && tx.to ? `${safeLower(tx.from) === subjectAddress ? 'outbound' : 'inbound'} transaction` : 'transaction',
      nativeBalance: base.overview.nativeBalance,
      transactionCount: Math.max(base.overview.transactionCount || 0, transferCount),
      executiveSummary: `${base.overview.executiveSummary} Transaction hash ${normalizedHash} resolves to ${subjectAddress}.`,
    },
    findings,
    evidence: [
      ...txEvidence,
      ...base.evidence,
      ...buildEvidenceFromTransfers(parsedTransfers, chainId, 'receipt-log'),
    ],
    flow: [
      {
        id: 'flow-transaction',
        sourceEntity: tx.from || 'unknown',
        destinationEntity: tx.to || 'unknown',
        asset: chain.symbol,
        amount: Number(ethers.utils.formatEther(tx.value || 0)),
        timestamp: block?.timestamp ? new Date(Number(block.timestamp) * 1000).toISOString() : nowIso(),
        transactionHash: normalizedHash,
        chainId,
        direction: 'transfer',
        knownLabel: null,
        expandableDetails: { tx, receipt },
      },
      ...buildFlowRows(parsedTransfers, chainId),
      ...base.flow,
    ].slice(0, MAX_FLOW_EDGES),
    timeline: buildTimelineEntries([
      {
        txHash: normalizedHash,
        timestamp: block?.timestamp ? new Date(Number(block.timestamp) * 1000).toISOString() : nowIso(),
        sender: tx.from,
        recipient: tx.to,
        tokenSymbol: chain.symbol,
        amount: Number(ethers.utils.formatEther(tx.value || 0)),
        blockNumber: receipt?.blockNumber ?? tx.blockNumber ?? null,
        logIndex: 0,
        source: 'transaction',
        sourceType: 'observed',
      },
      ...parsedTransfers,
      ...base.transfers,
    ], findings, { generatedAt: nowIso() }),
    transfers: [
      {
        txHash: normalizedHash,
        timestamp: block?.timestamp ? new Date(Number(block.timestamp) * 1000).toISOString() : nowIso(),
        sender: tx.from,
        recipient: tx.to,
        tokenSymbol: chain.symbol,
        amount: Number(ethers.utils.formatEther(tx.value || 0)),
        blockNumber: receipt?.blockNumber ?? tx.blockNumber ?? null,
        logIndex: 0,
        source: 'transaction',
        sourceType: 'observed',
      },
      ...parsedTransfers,
      ...base.transfers,
    ].slice(0, MAX_EVIDENCE_ITEMS),
    partial: base.partial || false,
    limitations: [...base.limitations, 'Transaction hash resolution is bounded to the selected chain.'].filter(Boolean),
    generatedAt: nowIso(),
  };
}

export async function runInvestigation({
  input,
  chainId,
  objective = '',
  depth = 'bounded',
  scopeKey = 'anon',
  signal,
  onProgress,
}) {
  const normalized = normalizeSubjectIdentifier(input);
  if (!normalized.value) throw new Error('Please enter an address or transaction hash.');
  const chain = resolveChain(chainId);
  if (!chain) throw new Error('Unsupported chain selected.');

  const progress = (stage, percent, details = null) => {
    if (typeof onProgress === 'function') {
      onProgress({
        stage,
        percent,
        details,
      });
    }
  };

  progress('Validating input', 8, { inputType: normalized.kind });

  let result;
  if (normalized.kind === 'transaction') {
    progress('Resolving transaction subject', 18, { txHash: normalized.normalized });
    result = await fetchTransactionInvestigation({ txHash: normalized.normalized, chainId, signal });
  } else if (normalized.kind === 'address') {
    progress('Collecting on-chain data', 22, { address: normalized.normalized });
    result = await fetchAddressInvestigation({ address: normalized.normalized, chainId, signal });
  } else {
    throw new Error('The supplied identifier is not a supported EVM address or transaction hash.');
  }

  progress('Normalizing evidence', 60, { transferCount: result.transfers.length });
  const overallRiskScore = Math.min(100, (result.signals || []).reduce((sum, signalItem) => sum + Number(signalItem.points || 0), 0));
  const overallRisk = overallRiskScore < 30 ? 'low' : overallRiskScore < 60 ? 'moderate' : overallRiskScore < 80 ? 'high' : 'critical';
  const status = result.partial ? 'Needs Review' : 'Completed';
  const now = nowIso();
  const investigation = {
    id: `inv-${Date.now()}`,
    title: result.subject.kind === 'transaction'
      ? `Transaction investigation ${result.subject.display}`
      : `Investigation ${result.subject.display.slice(0, 12)}…${result.subject.display.slice(-8)}`,
    objective: safeTrim(objective),
    subjectType: result.subject.kind === 'transaction' ? 'transaction_hash' : result.overview.entityType.toLowerCase().includes('contract') ? 'contract' : 'wallet',
    subjectValue: result.subject.normalized,
    chainId,
    chainName: chain.name,
    status,
    requestedDepth: safeTrim(depth) || 'bounded',
    summary: result.overview.executiveSummary,
    overallRisk,
    createdAt: now,
    updatedAt: now,
    completedAt: status === 'Completed' ? now : null,
    errorCode: null,
    errorMessage: null,
    analysisVersion: 'investigator-v1',
    inputType: normalized.kind,
    partial: result.partial,
    limitations: result.limitations,
    result,
    notes: [],
  };

  progress('Generating findings', 82, { findings: investigation.result.findings.length });

  return investigation;
}

export function upsertInvestigationHistory(scopeKey, investigation, { archive = false } = {}) {
  const history = loadInvestigatorHistory(scopeKey);
  const item = {
    id: investigation.id,
    title: investigation.title,
    primarySubject: investigation.subjectValue,
    chainId: investigation.chainId,
    chainName: investigation.chainName,
    status: archive ? 'Archived' : investigation.status,
    findingCount: Array.isArray(investigation.result?.findings) ? investigation.result.findings.length : 0,
    riskLevel: investigation.overallRisk,
    createdAt: investigation.createdAt,
    updatedAt: nowIso(),
    partial: Boolean(investigation.partial),
    objective: investigation.objective || '',
  };
  const next = [item, ...history.filter((row) => row.id !== item.id)].slice(0, MAX_HISTORY_ITEMS);
  saveInvestigatorHistory(scopeKey, next);
  return next;
}

export function storeInvestigatorDraftState(scopeKey, draft) {
  return saveInvestigatorDraft(scopeKey, draft);
}

export function clearInvestigatorDraftState(scopeKey) {
  return saveInvestigatorDraft(scopeKey, null);
}

export function getInvestigatorStorageKeys(scopeKey) {
  return {
    history: getInvestigatorHistoryScope(scopeKey),
    draft: getInvestigatorDraftKey(scopeKey),
  };
}

export function loadInvestigationRecord(scopeKey, investigationId) {
  return readJsonFromStorage(getInvestigatorRecordKey(scopeKey, investigationId), null);
}

export function saveInvestigationRecord(scopeKey, investigation) {
  if (!investigation?.id) return null;
  const snapshot = {
    ...investigation,
    result: investigation.result || null,
  };
  writeJsonToStorage(getInvestigatorRecordKey(scopeKey, investigation.id), snapshot);
  return snapshot;
}

export function deleteInvestigationRecord(scopeKey, investigationId) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(getInvestigatorRecordKey(scopeKey, investigationId));
  } catch {
    /* ignore */
  }
}

export function exportInvestigationJson(investigation) {
  return JSON.stringify(investigation, null, 2);
}

export function supportedChainsList() {
  return Object.values(SUPPORTED_CHAINS);
}

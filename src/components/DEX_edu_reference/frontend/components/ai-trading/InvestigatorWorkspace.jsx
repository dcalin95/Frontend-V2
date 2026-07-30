import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  Brain,
  Copy,
  Download,
  ExternalLink,
  FileSearch,
  Clock3,
  History,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { useAIChat } from '../../../../../hooks/useAIChat';
import {
  clearInvestigatorDraftState,
  deleteInvestigationRecord,
  exportInvestigationJson,
  fetchAddressInvestigation,
  loadInvestigationRecord,
  loadInvestigatorDraft,
  loadInvestigatorHistory,
  runInvestigation,
  saveInvestigationRecord,
  saveInvestigatorDraft,
  storeInvestigatorDraftState,
  supportedChainsList,
  upsertInvestigationHistory,
  buildExplorerUrl,
} from '../../services/investigatorService';
import { getBackendUrl } from '../../../../../config/apiEndpoints';
import { useWallet } from '../../hooks/useWallet';
import { useDexAuth } from '../../context/DexAuthContext';
import './investigator-workspace.css';

const DEFAULT_CHAIN_ID = 56;
const DEFAULT_DEPTH = 'bounded';

const statusTone = {
  Draft: 'muted',
  Running: 'warn',
  'Needs Review': 'warn',
  Completed: 'ok',
  Failed: 'danger',
  Archived: 'muted',
};

const severityTone = {
  Info: 'muted',
  Low: 'ok',
  Medium: 'warn',
  High: 'danger',
  Critical: 'danger',
};

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function formatNumber(value, fractionDigits = 4) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: n >= 1000 ? 2 : fractionDigits,
  }).format(n);
}

function formatRisk(value) {
  if (!value) return '—';
  return String(value).replace(/_/g, ' ');
}

function safeLabel(value) {
  const s = String(value || '').trim();
  return s ? s : '—';
}

function subjectDisplay(subject) {
  if (!subject) return '—';
  if (subject.kind === 'transaction') return subject.display || subject.normalized || 'Transaction';
  return subject.display || subject.normalized || 'Address';
}

function shortHash(value) {
  const s = String(value || '');
  if (!s) return '—';
  if (s.length <= 18) return s;
  return `${s.slice(0, 10)}…${s.slice(-8)}`;
}

function copyToClipboard(value) {
  const text = String(value || '');
  if (!text) return;
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

function sectionTitle(text) {
  return (
    <div className="investigator-section__title-row">
      <h2>{text}</h2>
    </div>
  );
}

function Pill({ tone = 'muted', children, title }) {
  return (
    <span className={`investigator-pill investigator-pill--${tone}`} title={title}>
      {children}
    </span>
  );
}

function Panel({ title, subtitle, actions, children, className = '', ...rest }) {
  return (
    <section className={`investigator-panel ${className}`.trim()} {...rest}>
      <header className="investigator-panel__header">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions ? <div className="investigator-panel__actions">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

function MetricCard({ label, value, source, tone = 'muted', detail }) {
  return (
    <article className="investigator-metric-card">
      <span>{label}</span>
      <strong className={`investigator-metric-card__value investigator-metric-card__value--${tone}`}>{value}</strong>
      {detail ? <small>{detail}</small> : source ? <small>{source}</small> : null}
    </article>
  );
}

function SourceTag({ sourceType }) {
  const tone =
    sourceType === 'observed'
      ? 'ok'
      : sourceType === 'calculated'
        ? 'warn'
        : sourceType === 'external-label'
          ? 'muted'
          : sourceType === 'manual'
            ? 'manual'
            : 'muted';
  return <Pill tone={tone}>{safeLabel(sourceType || 'unavailable')}</Pill>;
}

function EvidenceRow({ row }) {
  return (
    <tr>
      <td>{row.evidenceType || '—'}</td>
      <td>{safeLabel(row.chainId)}</td>
      <td className="investigator-table__clip" title={row.transactionHash || row.subject || ''}>
        {shortHash(row.transactionHash || row.subject)}
      </td>
      <td>{safeLabel(row.blockNumber)}</td>
      <td>{safeLabel(row.logIndex)}</td>
      <td>{safeLabel(row.source)}</td>
      <td>
        {row.explorerUrl ? (
          <a href={row.explorerUrl} target="_blank" rel="noreferrer noopener">
            Open
          </a>
        ) : (
          '—'
        )}
      </td>
    </tr>
  );
}

function TimelineRow({ row }) {
  return (
    <li className="investigator-timeline__item">
      <div className="investigator-timeline__meta">
        <strong>{row.type}</strong>
        <span>{formatDateTime(row.ts)}</span>
      </div>
      <div className="investigator-timeline__body">
        <p>{row.title}</p>
        <small>{row.description}</small>
      </div>
      <div className="investigator-timeline__chips">
        <Pill tone={severityTone[row.severity] || 'muted'}>{row.severity || 'Info'}</Pill>
        <SourceTag sourceType={row.sourceType} />
      </div>
    </li>
  );
}

function FindingCard({ finding, expanded, onToggle }) {
  return (
    <article className="investigator-finding">
      <button type="button" className="investigator-finding__head" onClick={onToggle}>
        <div>
          <h4>{finding.title}</h4>
          <p>{finding.description}</p>
        </div>
        <div className="investigator-finding__meta">
          <Pill tone={severityTone[finding.severity] || 'muted'}>{finding.severity}</Pill>
          <Pill tone={finding.confidence === 'High' ? 'ok' : finding.confidence === 'Low' ? 'muted' : 'warn'}>{finding.confidence}</Pill>
          <span aria-hidden>{expanded ? <X size={16} /> : <ArrowRight size={16} />}</span>
        </div>
      </button>
      {expanded && (
        <div className="investigator-finding__body">
          <dl>
            <div>
              <dt>Category</dt>
              <dd>{finding.category}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{finding.status}</dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd>{finding.method}</dd>
            </div>
            <div>
              <dt>Detectors</dt>
              <dd>{finding.detectorVersion}</dd>
            </div>
          </dl>
          <div className="investigator-finding__evidence">
            <strong>Supporting evidence</strong>
            <div>{Array.isArray(finding.supportingEvidence) && finding.supportingEvidence.length ? finding.supportingEvidence.map((ref) => <Pill key={ref}>{shortHash(ref)}</Pill>) : <span>—</span>}</div>
          </div>
          {finding.investigatorNotes ? <p className="investigator-finding__notes">{finding.investigatorNotes}</p> : null}
        </div>
      )}
    </article>
  );
}

function buildAssistantPrompt(investigation, question) {
  const summary = {
    subject: investigation?.subject,
    overview: investigation?.overview,
    findings: investigation?.result?.findings?.slice(0, 12) || [],
    evidence: investigation?.result?.evidence?.slice(0, 16) || [],
    timeline: investigation?.result?.timeline?.slice(0, 12) || [],
    limitations: investigation?.limitations || [],
  };
  return [
    'You are BITS Investigator assistant.',
    'Use only the provided investigation data.',
    'Never invent identities, labels, transfers, or sources.',
    'Return a concise answer using these sections exactly:',
    '1. Observed facts',
    '2. Interpretation',
    '3. Confidence',
    '4. Missing information',
    '5. Suggested next steps',
    '6. Evidence references',
    '',
    `Question: ${question || 'Summarize this investigation.'}`,
    `Investigation JSON:\n${JSON.stringify(summary, null, 2)}`,
  ].join('\n');
}

function getReportDownloadName(investigation) {
  const slug = safeLabel(investigation?.subjectValue || investigation?.id).replace(/[^a-z0-9-_]+/gi, '_').slice(0, 40);
  return `bits-investigator-${slug || 'report'}.json`;
}

export default function InvestigatorWorkspace({
  mode = 'embedded',
  scopeKey: scopeKeyProp = 'anon',
  initialChainId = DEFAULT_CHAIN_ID,
}) {
  const { postChat, provider: aiProvider } = useAIChat();
  const { walletAddress } = useWallet() || {};
  const dexAuth = useDexAuth() || {};
  const scopeKey = scopeKeyProp || walletAddress || dexAuth?.user?.walletAddress || 'anon';
  const chains = useMemo(() => supportedChainsList(), []);
  const initialDraft = useMemo(() => loadInvestigatorDraft(scopeKey), [scopeKey]);
  const [query, setQuery] = useState(initialDraft?.query || '');
  const [chainId, setChainId] = useState(initialDraft?.chainId || initialChainId || DEFAULT_CHAIN_ID);
  const [objective, setObjective] = useState(initialDraft?.objective || '');
  const [depth, setDepth] = useState(initialDraft?.depth || DEFAULT_DEPTH);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState(() => loadInvestigatorHistory(scopeKey));
  const [status, setStatus] = useState('Draft');
  const [progress, setProgress] = useState({ stage: 'Idle', percent: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [selectedTimelineType, setSelectedTimelineType] = useState('all');
  const [noteInput, setNoteInput] = useState('');
  const [notes, setNotes] = useState(initialDraft?.notes || []);
  const [archivePrompt, setArchivePrompt] = useState(false);
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantAnswer, setAssistantAnswer] = useState(null);
  const [assistantError, setAssistantError] = useState('');
  const abortRef = useRef(null);
  const firstRenderRef = useRef(true);

  const activeInvestigation = current;
  const findings = activeInvestigation?.result?.findings || [];
  const evidence = activeInvestigation?.result?.evidence || [];
  const timeline = activeInvestigation?.result?.timeline || [];
  const flow = activeInvestigation?.result?.flow || [];
  const overview = activeInvestigation?.result?.overview || null;

  useEffect(() => {
    saveInvestigatorDraft(scopeKey, {
      query,
      chainId,
      objective,
      depth,
      notes,
    });
  }, [scopeKey, query, chainId, objective, depth, notes]);

  useEffect(() => {
    if (!firstRenderRef.current) return;
    firstRenderRef.current = false;
    if (initialDraft?.currentId) {
      const record = loadInvestigationRecord(scopeKey, initialDraft.currentId);
      if (record) {
        setCurrent(record);
        setStatus(record.status || 'Draft');
        setNotes(Array.isArray(record.notes) ? record.notes : []);
      }
    }
  }, [initialDraft, scopeKey]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const persistCurrent = useCallback((nextInvestigation) => {
    if (!nextInvestigation) return;
    saveInvestigationRecord(scopeKey, nextInvestigation);
    setHistory(() => upsertInvestigationHistory(scopeKey, nextInvestigation));
  }, [scopeKey]);

  const handleNewInvestigation = useCallback(() => {
    if (loading && abortRef.current) abortRef.current.abort();
    setCurrent(null);
    setStatus('Draft');
    setProgress({ stage: 'Idle', percent: 0 });
    setError('');
    setSelectedFinding(null);
    setAssistantAnswer(null);
    setAssistantError('');
    setAssistantQuestion('');
    clearInvestigatorDraftState(scopeKey);
  }, [loading, scopeKey]);

  const handleLoadHistory = useCallback((record) => {
    const saved = loadInvestigationRecord(scopeKey, record.id);
    if (saved) {
      setCurrent(saved);
      setStatus(saved.status || 'Completed');
      setNotes(Array.isArray(saved.notes) ? saved.notes : []);
      setAssistantAnswer(null);
      setAssistantError('');
      setSelectedFinding(null);
      setHistoryOpen(false);
      return;
    }
    setError('That investigation snapshot is no longer available in local storage.');
  }, [scopeKey]);

  const handleArchiveOrClear = useCallback(() => {
    if (!activeInvestigation) {
      handleNewInvestigation();
      return;
    }
    setArchivePrompt(true);
  }, [activeInvestigation, handleNewInvestigation]);

  const confirmArchive = useCallback(() => {
    if (!activeInvestigation) return;
    const archived = {
      ...activeInvestigation,
      status: 'Archived',
      updatedAt: new Date().toISOString(),
      notes,
    };
    saveInvestigationRecord(scopeKey, archived);
    setHistory(() => upsertInvestigationHistory(scopeKey, archived, { archive: true }));
    setCurrent(archived);
    setStatus('Archived');
    setArchivePrompt(false);
  }, [activeInvestigation, notes, scopeKey]);

  const handleExport = useCallback(() => {
    if (!activeInvestigation) return;
    const blob = new Blob([exportInvestigationJson(activeInvestigation)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getReportDownloadName(activeInvestigation);
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [activeInvestigation]);

  const openBackendPdf = useCallback(() => {
    if (!activeInvestigation || activeInvestigation.subject?.kind === 'transaction') return;
    const url = `${getBackendUrl().replace(/\/$/, '')}/api/investigator/report/${activeInvestigation.subjectValue}.pdf?chainId=${activeInvestigation.chainId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [activeInvestigation]);

  const handleRun = useCallback(async (event) => {
    event.preventDefault();
    if (loading) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Enter a wallet address or transaction hash.');
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError('');
    setAssistantAnswer(null);
    setAssistantError('');
    setSelectedFinding(null);
    setStatus('Running');
    setProgress({ stage: 'Starting', percent: 2 });

    try {
      const investigation = await runInvestigation({
        input: trimmed,
        chainId,
        objective,
        depth,
        scopeKey,
        signal: controller.signal,
        onProgress: setProgress,
      });
      const finalized = {
        ...investigation,
        notes,
      };
      setCurrent(finalized);
      setStatus(finalized.status || 'Needs Review');
      setProgress({ stage: 'Completed', percent: 100 });
      persistCurrent(finalized);
      storeInvestigatorDraftState(scopeKey, {
        query: trimmed,
        chainId,
        objective,
        depth,
        notes,
        currentId: finalized.id,
      });
    } catch (runError) {
      setCurrent((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          status: 'Failed',
          errorMessage: runError?.message || 'Investigation failed.',
        };
      });
      setStatus('Failed');
      setError(runError?.message || 'Investigation failed.');
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [chainId, depth, loading, notes, objective, persistCurrent, query, scopeKey]);

  const handleCancel = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setLoading(false);
    setStatus('Draft');
    setProgress((currentProgress) => ({ ...currentProgress, stage: 'Cancelled' }));
  }, []);

  const addNote = useCallback(() => {
    const text = noteInput.trim();
    if (!text || !activeInvestigation) return;
    const nextNotes = [
      {
        id: `note-${Date.now()}`,
        author: 'investigator',
        noteType: 'manual',
        content: text,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceType: 'manual',
      },
      ...notes,
    ];
    setNotes(nextNotes);
    setNoteInput('');
    const updated = {
      ...activeInvestigation,
      notes: nextNotes,
      updatedAt: new Date().toISOString(),
    };
    setCurrent(updated);
    saveInvestigationRecord(scopeKey, updated);
    setHistory(() => upsertInvestigationHistory(scopeKey, updated));
  }, [activeInvestigation, noteInput, notes, scopeKey]);

  const runAssistant = useCallback(async () => {
    if (!activeInvestigation) return;
    const question = assistantQuestion.trim() || 'Summarize this investigation and suggest next steps.';
    setAssistantLoading(true);
    setAssistantError('');
    setAssistantAnswer(null);
    try {
      const prompt = buildAssistantPrompt(activeInvestigation, question);
      const response = await postChat({
        systemPrompt: 'You are a grounded on-chain investigation assistant.',
        messages: [
          { role: 'user', content: prompt },
        ],
        walletAddress: walletAddress || dexAuth?.user?.walletAddress || undefined,
      });
      const content = String(response?.content || response?.response || '').trim();
      setAssistantAnswer({
        question,
        content,
        provider: aiProvider || 'unknown',
        createdAt: new Date().toISOString(),
      });
    } catch (assistantRunError) {
      setAssistantError(assistantRunError?.message || 'Assistant failed.');
    } finally {
      setAssistantLoading(false);
    }
  }, [activeInvestigation, aiProvider, assistantQuestion, dexAuth?.user?.walletAddress, postChat, walletAddress]);

  const filteredTimeline = useMemo(() => {
    if (selectedTimelineType === 'all') return timeline;
    return timeline.filter((row) => row.type.toLowerCase() === selectedTimelineType.toLowerCase());
  }, [selectedTimelineType, timeline]);

  const storageStatus = useMemo(() => {
    const updatedAt = activeInvestigation?.updatedAt || current?.updatedAt || null;
    return {
      saved: Boolean(activeInvestigation),
      updatedAt,
    };
  }, [activeInvestigation, current?.updatedAt]);

  const historyItems = history || [];
  const backendReportAvailable = Boolean(activeInvestigation && activeInvestigation.subject?.kind !== 'transaction');
  const subjectValue = activeInvestigation?.subjectValue || activeInvestigation?.subject?.normalized || '';
  const subjectExplorerUrl = useMemo(() => {
    if (!activeInvestigation?.subject || !subjectValue) return '';
    const kind = activeInvestigation.subject.kind === 'transaction' ? 'tx' : 'address';
    return buildExplorerUrl(activeInvestigation.chainId || chainId, kind, subjectValue);
  }, [activeInvestigation, chainId, subjectValue]);

  const riskTone = activeInvestigation?.overallRisk === 'critical'
    ? 'danger'
    : activeInvestigation?.overallRisk === 'high'
      ? 'danger'
      : activeInvestigation?.overallRisk === 'moderate'
        ? 'warn'
        : 'ok';

  const heroStats = useMemo(() => [
    {
      label: 'Risk posture',
      value: formatRisk(activeInvestigation?.overallRisk || 'draft'),
      hint: activeInvestigation ? `${findings.length} findings` : 'No analysis yet',
      tone: riskTone,
    },
    {
      label: 'Evidence rows',
      value: safeLabel(evidence.length),
      hint: `${timeline.length} timeline items`,
      tone: evidence.length ? 'ok' : 'muted',
    },
    {
      label: 'Flow edges',
      value: safeLabel(flow.length),
      hint: `${notes.length} notes`,
      tone: flow.length ? 'warn' : 'muted',
    },
    {
      label: 'Source mode',
      value: activeInvestigation?.sources?.backend === 'demo' ? 'Demo backend' : 'Live backend',
      hint: activeInvestigation?.partial ? 'Partial data' : 'Full workspace',
      tone: activeInvestigation?.partial ? 'warn' : 'ok',
    },
  ], [activeInvestigation, evidence.length, findings.length, flow.length, notes.length, riskTone, timeline.length]);

  const quickFillFromWallet = useCallback(() => {
    if (!walletAddress) return;
    setQuery(walletAddress);
    setObjective((currentValue) => currentValue || 'Inspect connected wallet');
  }, [walletAddress]);

  const quickFillFromHistory = useCallback(() => {
    const latestHistorySubject = historyItems?.[0]?.primarySubject || '';
    if (latestHistorySubject) {
      setQuery(latestHistorySubject);
      setObjective((currentValue) => currentValue || 'Continue previous investigation');
    }
  }, [historyItems]);

  const clearQueryInput = useCallback(() => {
    setQuery('');
  }, []);

  const scrollToSection = useCallback((sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <main className={`investigator-workspace investigator-workspace--${mode}`}>
      <header className="investigator-hero">
        <div className="investigator-hero__eyebrow">BITS AI · ON-CHAIN INVESTIGATION WORKSPACE</div>
        <div className="investigator-hero__grid">
          <div className="investigator-hero__title-copy">
            <h1>Bits Investigator</h1>
            <p>
              Analyze wallets, contracts, transactions, fund flows, counterparties, and suspicious patterns in a bounded and auditable way.
            </p>
            <div className="investigator-hero__meta-line">
              <span>{activeInvestigation?.chainName || chains.find((chain) => chain.id === chainId)?.name || 'Select a chain'}</span>
              <span>{subjectDisplay(activeInvestigation?.subject) !== '—' ? subjectDisplay(activeInvestigation?.subject) : 'No subject loaded'}</span>
              <span>{activeInvestigation?.limitations?.length ? `${activeInvestigation.limitations.length} limits flagged` : 'Evidence-only workspace'}</span>
            </div>
          </div>
          <aside className="investigator-hero__status-panel" aria-label="Investigation status">
            <span className="investigator-hero__status-kicker">Case file</span>
            <strong>{subjectDisplay(activeInvestigation?.subject) !== '—' ? subjectDisplay(activeInvestigation?.subject) : 'Awaiting subject'}</strong>
            <p>
              <Pill tone={statusTone[status] || 'muted'}>{status}</Pill>
              <Pill tone={activeInvestigation?.partial ? 'warn' : 'ok'}>{activeInvestigation?.partial ? 'Partial' : 'Full'}</Pill>
            </p>
            <div className="investigator-hero__status-stack">
              <div>
                <span>Chain</span>
                <strong>{activeInvestigation?.chainName || chains.find((chain) => chain.id === chainId)?.name || 'Select a chain'}</strong>
              </div>
              <div>
                <span>Storage</span>
                <strong>{storageStatus.saved ? `Saved ${formatDateTime(storageStatus.updatedAt)}` : 'Not saved yet'}</strong>
              </div>
              <div>
                <span>Mode</span>
                <strong>{activeInvestigation?.limitations?.length ? `${activeInvestigation.limitations.length} limits` : 'Evidence-only'}</strong>
              </div>
            </div>
          </aside>
        </div>
        <div className="investigator-hero__signals">
          {heroStats.map((card, index) => (
            <article
              key={card.label}
              className={`investigator-hero__signal-card ${index === 0 ? 'investigator-hero__signal-card--lead' : ''}`}
            >
              <span>{card.label}</span>
              <strong className={`investigator-hero__signal-value investigator-hero__signal-value--${card.tone}`}>{card.value}</strong>
              <small>{card.hint}</small>
            </article>
          ))}
        </div>
        <div className="investigator-hero__actions">
          <button type="button" className="investigator-btn investigator-btn--ghost" onClick={() => setHistoryOpen(true)}>
            <History size={16} />
            Open previous
          </button>
          <button type="button" className="investigator-btn investigator-btn--ghost" onClick={handleNewInvestigation}>
            <Plus size={16} />
            New investigation
          </button>
          <button type="button" className="investigator-btn investigator-btn--ghost" onClick={handleExport} disabled={!activeInvestigation}>
            <Download size={16} />
            Export
          </button>
          {backendReportAvailable ? (
            <button type="button" className="investigator-btn investigator-btn--ghost" onClick={openBackendPdf}>
              <ExternalLink size={16} />
              Backend PDF
            </button>
          ) : null}
          <button type="button" className="investigator-btn investigator-btn--danger" onClick={handleArchiveOrClear}>
            <Archive size={16} />
            {activeInvestigation ? 'Archive' : 'Clear'}
          </button>
          <button type="button" className="investigator-btn investigator-btn--ghost" onClick={() => copyToClipboard(subjectValue)} disabled={!subjectValue}>
            <Copy size={16} />
            Copy subject
          </button>
          <button type="button" className="investigator-btn investigator-btn--ghost" onClick={() => scrollToSection('investigator-overview')} disabled={!activeInvestigation}>
            <Sparkles size={16} />
            Jump overview
          </button>
          <button type="button" className="investigator-btn investigator-btn--ghost" onClick={() => scrollToSection('investigator-findings')} disabled={!activeInvestigation}>
            <ArrowRight size={16} />
            Jump findings
          </button>
          {subjectExplorerUrl ? (
            <a href={subjectExplorerUrl} target="_blank" rel="noreferrer noopener" className="investigator-btn investigator-btn--ghost">
              <ExternalLink size={16} />
              Explorer
            </a>
          ) : null}
        </div>
      </header>

      <section id="investigator" className="investigator-grid">
        <Panel
          title="Start a new investigation"
          subtitle="Enter a wallet address, contract address, or transaction hash. The workspace keeps the analysis bounded and clearly marks source quality."
          actions={<Pill tone="muted">{chains.length} chains supported</Pill>}
          >
          <form className="investigator-form" onSubmit={handleRun}>
            <label>
              <span>Chain</span>
              <select value={chainId} onChange={(e) => setChainId(Number(e.target.value))} aria-label="Chain selector">
                {chains.map((chain) => (
                  <option key={chain.id} value={chain.id}>
                    {chain.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="investigator-form__field investigator-form__field--wide">
              <span>Address or transaction hash</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="0x..."
                spellCheck="false"
                autoComplete="off"
              />
            </label>
            <label className="investigator-form__field investigator-form__field--wide">
              <span>Investigation objective</span>
              <input
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Investigate fund flow / deployer / liquidity event ..."
              />
            </label>
            <label>
              <span>Depth</span>
              <select value={depth} onChange={(e) => setDepth(e.target.value)} aria-label="Depth selector">
                <option value="bounded">Bounded</option>
                <option value="focused">Focused</option>
              </select>
            </label>
            <div className="investigator-form__actions">
              <button type="submit" className="investigator-btn investigator-btn--primary" disabled={loading}>
                {loading ? <Loader2 size={16} className="is-spinning" /> : <Search size={16} />}
                {loading ? 'Running…' : 'Start investigation'}
              </button>
              {loading ? (
                <button type="button" className="investigator-btn investigator-btn--ghost" onClick={handleCancel}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
          <div className="investigator-form__assist">
            <button type="button" className="investigator-chip investigator-chip--button" onClick={quickFillFromWallet} disabled={!walletAddress}>
              Use connected wallet
            </button>
            <button type="button" className="investigator-chip investigator-chip--button" onClick={quickFillFromHistory} disabled={!historyItems.length}>
              Load recent case
            </button>
            <button type="button" className="investigator-chip investigator-chip--button" onClick={clearQueryInput} disabled={!query.trim()}>
              Clear input
            </button>
          </div>
          <div className="investigator-form__progress" role="status" aria-live="polite">
            <div className="investigator-form__progress-bar">
              <span style={{ width: `${Math.min(100, Math.max(0, progress.percent || 0))}%` }} />
            </div>
            <p>
              <strong>{progress.stage}</strong>
              {' · '}
              {Math.round(progress.percent || 0)}%
              {activeInvestigation?.limitations?.length ? ` · ${activeInvestigation.limitations.join(' · ')}` : ''}
            </p>
          </div>
          {error ? (
            <div className="investigator-alert investigator-alert--danger" role="alert">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          ) : null}
          {activeInvestigation?.partial ? (
            <div className="investigator-alert investigator-alert--warn" role="status">
              <ShieldAlert size={16} />
              <span>Partial results are visible. One or more providers returned incomplete data, so the workspace marks the analysis honestly instead of filling gaps.</span>
            </div>
          ) : null}
        </Panel>

        {overview ? (
          <Panel
            id="investigator-overview"
            title="Investigation overview"
            subtitle={activeInvestigation?.summary || 'Current evidence summary.'}
          >
            <div className="investigator-overview__deck">
              <div className="investigator-overview__primary">
                <div className="investigator-overview__summary investigator-overview__summary--hero">
                  <div className="investigator-overview__summary-head">
                    <div>
                      <span className="investigator-overview__kicker">Executive summary</span>
                      <h4>{subjectDisplay(activeInvestigation?.subject)}</h4>
                    </div>
                    <Pill tone={riskTone}>{formatRisk(activeInvestigation?.overallRisk || 'draft')}</Pill>
                  </div>
                  <p>{overview.executiveSummary}</p>
                  <div className="investigator-overview__summary-meta">
                    <span><strong>{safeLabel(overview.transactionCount)}</strong> backend transfers</span>
                    <span><strong>{formatDateTime(overview.firstSeen)}</strong> first seen</span>
                    <span><strong>{formatDateTime(overview.lastSeen)}</strong> last seen</span>
                  </div>
                </div>

                <div className="investigator-overview__metric-grid">
                  <MetricCard label="Entity type" value={overview.entityType} source="Observed / calculated" tone="ok" />
                  <MetricCard label="Chain" value={overview.chain} source="Selected chain" />
                  <MetricCard label="Native balance" value={`${formatNumber(overview.nativeBalance, 6)} ${activeInvestigation?.chain?.symbol || ''}`} source={overview.nativeBalanceSource} />
                  <MetricCard label="Token holdings" value={Array.isArray(overview.tokenHoldings) && overview.tokenHoldings.length ? `${overview.tokenHoldings.length} tracked assets` : 'Unavailable'} source="Provider" />
                  <MetricCard label="Current labels" value={Array.isArray(overview.labels) && overview.labels.length ? overview.labels.join(', ') : 'None'} source="External label" />
                  <MetricCard label="Verified contract" value={overview.verifiedContractStatus} source="Provider code check" />
                  <MetricCard label="Deployer / creator" value={overview.deployer || 'Unavailable'} source="External / provider" />
                  <MetricCard label="Risk assessment" value={formatRisk(overview.currentRiskAssessment)} source="Heuristic" tone={riskTone} />
                </div>
              </div>

              <aside className="investigator-overview__aside">
                <article className="investigator-overview__side-card">
                  <div className="investigator-overview__side-card-head">
                    <h4>Source integrity</h4>
                    <Pill tone={activeInvestigation?.partial ? 'warn' : 'ok'}>{activeInvestigation?.partial ? 'Partial' : 'Complete'}</Pill>
                  </div>
                  <ul className="investigator-overview__source-list">
                    <li><span>Backend</span><strong>{activeInvestigation?.sources?.backend || 'backend'}</strong></li>
                    <li><span>Provider</span><strong>{activeInvestigation?.sources?.provider || 'provider'}</strong></li>
                    <li><span>Wallet intel</span><strong>{activeInvestigation?.sources?.walletIntel || 'n/a'}</strong></li>
                  </ul>
                  {activeInvestigation?.limitations?.length ? (
                    <div className="investigator-overview__limits">
                      <strong>Limitations</strong>
                      <ul>
                        {activeInvestigation.limitations.map((limitation) => (
                          <li key={limitation}>{limitation}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="investigator-overview__muted">No explicit limitations recorded for this case.</p>
                  )}
                </article>

                <article className="investigator-overview__side-card">
                  <div className="investigator-overview__side-card-head">
                    <h4>Top counterparties</h4>
                    <Pill tone="muted">{overview.majorCounterparties?.length || 0}</Pill>
                  </div>
                  <div className="investigator-counterparty-list">
                    {overview.majorCounterparties?.length ? overview.majorCounterparties.map((counterparty) => (
                      <div key={counterparty.address} className="investigator-counterparty">
                        <strong>{shortHash(counterparty.address)}</strong>
                        <span>{counterparty.count} interactions</span>
                        <small>{counterparty.inbound} inbound · {counterparty.outbound} outbound</small>
                      </div>
                    )) : (
                      <div className="investigator-empty investigator-empty--compact">
                        <Sparkles size={16} />
                        <p>No counterparties observed yet.</p>
                      </div>
                    )}
                  </div>
                </article>
              </aside>
            </div>
          </Panel>
        ) : (
          <Panel title="Investigation overview" subtitle="Run an investigation to populate the evidence-backed summary." className="investigator-panel--empty">
            <div className="investigator-empty investigator-empty--hero">
              <FileSearch size={18} />
              <p>No investigation loaded yet.</p>
              <small>Use a wallet address or transaction hash to unlock the case file.</small>
            </div>
          </Panel>
        )}

        <div className="investigator-duo">
          <Panel
            id="investigator-findings"
            title="Findings"
            subtitle="Each finding is structured, severity-tagged, and linked to evidence."
            actions={<Pill tone="muted">{findings.length} findings</Pill>}
          >
            <div className="investigator-finding-list">
              {findings.length ? findings.map((finding) => (
                <FindingCard
                  key={finding.id}
                  finding={finding}
                  expanded={selectedFinding === finding.id}
                  onToggle={() => setSelectedFinding((currentId) => (currentId === finding.id ? null : finding.id))}
                />
              )) : (
                <div className="investigator-empty">
                  <Sparkles size={18} />
                  <p>No findings yet. Start an investigation or load a saved one.</p>
                </div>
              )}
            </div>
          </Panel>

          <Panel
            id="investigator-flow"
            title="Fund flow"
            subtitle="Bounded list of transfer edges and transaction links."
            actions={
              <select value={selectedTimelineType} onChange={(e) => setSelectedTimelineType(e.target.value)}>
                <option value="all">All events</option>
                <option value="transfer">Transfer</option>
                <option value="finding">Finding</option>
              </select>
            }
          >
            <div className="investigator-table-wrap">
              <table className="investigator-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Destination</th>
                    <th>Asset</th>
                    <th>Amount</th>
                    <th>Timestamp</th>
                    <th>Tx hash</th>
                    <th>Chain</th>
                    <th>Label</th>
                  </tr>
                </thead>
                <tbody>
                  {flow.length ? flow.map((row) => (
                    <tr key={row.id}>
                      <td className="investigator-table__clip" title={row.sourceEntity}>{shortHash(row.sourceEntity)}</td>
                      <td className="investigator-table__clip" title={row.destinationEntity}>{shortHash(row.destinationEntity)}</td>
                      <td>{row.asset}</td>
                      <td>{formatNumber(row.amount)}</td>
                      <td>{formatDateTime(row.timestamp)}</td>
                      <td className="investigator-table__clip" title={row.transactionHash}>{shortHash(row.transactionHash)}</td>
                      <td>{safeLabel(row.chainId)}</td>
                      <td>{safeLabel(row.knownLabel)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="8" className="investigator-table__empty">No transfer flow available yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="investigator-duo">
          <Panel id="investigator-timeline" title="Timeline" subtitle="A chronological record of observed activity and generated findings.">
            <div className="investigator-timeline__filters">
              {['all', 'Transfer', 'Finding'].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`investigator-chip ${selectedTimelineType === item.toLowerCase() ? 'investigator-chip--active' : ''}`}
                  onClick={() => setSelectedTimelineType(item.toLowerCase())}
                >
                  {item}
                </button>
              ))}
            </div>
            <ul className="investigator-timeline">
              {filteredTimeline.length ? filteredTimeline.map((row) => <TimelineRow key={row.id} row={row} />) : (
                <li className="investigator-empty">
                  <Clock3 />
                  <p>No timeline entries yet.</p>
                </li>
              )}
            </ul>
          </Panel>

          <Panel id="investigator-evidence" title="Evidence" subtitle="Evidence rows are explicit and never treated as LLM output.">
            <div className="investigator-table-wrap">
              <table className="investigator-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Chain</th>
                    <th>Transaction / subject</th>
                    <th>Block</th>
                    <th>Log</th>
                    <th>Source</th>
                    <th>Link</th>
                  </tr>
                </thead>
                <tbody>
                  {evidence.length ? evidence.map((row) => <EvidenceRow key={row.id} row={row} />) : (
                    <tr>
                      <td colSpan="7" className="investigator-table__empty">No evidence rows available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="investigator-duo investigator-duo--support">
          <Panel id="investigator-notebook" title="Notebook" subtitle="Manual notes are clearly marked as investigator-provided.">
            <div className="investigator-notebook">
              <label className="investigator-notebook__composer">
                <span>Add note, hypothesis, bookmark, or finding decision</span>
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Manual note..."
                  rows={4}
                />
              </label>
              <button type="button" className="investigator-btn investigator-btn--primary" onClick={addNote} disabled={!activeInvestigation || !noteInput.trim()}>
                <Save size={16} />
                Save note
              </button>
            </div>
            <div className="investigator-note-list">
              {notes.length ? notes.map((note) => (
                <article key={note.id} className="investigator-note">
                  <div className="investigator-note__head">
                    <strong>{note.noteType === 'manual' ? 'Manual note' : safeLabel(note.noteType)}</strong>
                    <SourceTag sourceType={note.sourceType || 'manual'} />
                  </div>
                  <p>{note.content}</p>
                  <small>{formatDateTime(note.createdAt)}</small>
                </article>
              )) : (
                <div className="investigator-empty">
                  <Lock size={18} />
                  <p>No manual notes saved yet.</p>
                </div>
              )}
            </div>
          </Panel>

          <Panel
            id="investigator-assistant"
            title="AI assistant"
            subtitle="Grounded responses only. The assistant sees structured evidence and cannot mutate the investigation without an explicit user action."
            actions={<Pill tone={aiProvider === 'ota' ? 'warn' : 'ok'}>{aiProvider || 'AI not selected'}</Pill>}
          >
            <div className="investigator-assistant">
              <label className="investigator-notebook__composer">
                <span>Question</span>
                <textarea
                  value={assistantQuestion}
                  onChange={(e) => setAssistantQuestion(e.target.value)}
                  placeholder="What should I look at next?"
                  rows={3}
                />
              </label>
              <button type="button" className="investigator-btn investigator-btn--primary" onClick={runAssistant} disabled={!activeInvestigation || assistantLoading}>
                {assistantLoading ? <Loader2 size={16} className="is-spinning" /> : <Brain size={16} />}
                {assistantLoading ? 'Thinking…' : 'Ask assistant'}
              </button>
            </div>
            {assistantError ? (
              <div className="investigator-alert investigator-alert--danger" role="alert">
                <AlertTriangle size={16} />
                <span>{assistantError}</span>
              </div>
            ) : null}
            {assistantAnswer ? (
              <article className="investigator-assistant__answer">
                <div className="investigator-assistant__answer-head">
                  <strong>{assistantAnswer.question}</strong>
                  <small>{formatDateTime(assistantAnswer.createdAt)}</small>
                </div>
                <pre>{assistantAnswer.content || 'No response.'}</pre>
              </article>
            ) : (
              <div className="investigator-empty">
                <Brain size={18} />
                <p>Ask a question to get an evidence-grounded interpretation.</p>
              </div>
            )}
          </Panel>
        </div>
      </section>

      {historyOpen && (
        <div className="investigator-modal" role="dialog" aria-modal="true" aria-labelledby="investigator-history-title">
          <div className="investigator-modal__body">
            <div className="investigator-modal__header">
              <div>
                <h3 id="investigator-history-title">Previous investigations</h3>
                <p>Reopen a saved snapshot without recomputing it.</p>
              </div>
              <button type="button" className="investigator-btn investigator-btn--ghost" onClick={() => setHistoryOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="investigator-history-list">
              {historyItems.length ? historyItems.map((item) => (
                <button key={item.id} type="button" className="investigator-history-card" onClick={() => handleLoadHistory(item)}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.primarySubject}</p>
                  </div>
                  <div className="investigator-history-card__meta">
                    <Pill tone={statusTone[item.status] || 'muted'}>{item.status}</Pill>
                    <Pill tone={item.partial ? 'warn' : 'ok'}>{item.findingCount} findings</Pill>
                    <small>{formatDateTime(item.updatedAt)}</small>
                  </div>
                </button>
              )) : (
                <div className="investigator-empty">
                  <History size={18} />
                  <p>No saved investigations yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {archivePrompt && (
        <div className="investigator-modal" role="dialog" aria-modal="true" aria-labelledby="investigator-archive-title">
          <div className="investigator-modal__body investigator-modal__body--compact">
            <h3 id="investigator-archive-title">Archive current investigation?</h3>
            <p>This keeps the snapshot in your local history and marks it as archived.</p>
            <div className="investigator-modal__actions">
              <button type="button" className="investigator-btn investigator-btn--ghost" onClick={() => setArchivePrompt(false)}>
                Cancel
              </button>
              <button type="button" className="investigator-btn investigator-btn--danger" onClick={confirmArchive}>
                <Archive size={16} />
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

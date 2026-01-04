import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { trackTikTokEvent } from '../../utils/tiktok';
import './MiniQuizGPT.css';

const QUESTIONS = [
  {
    id: 'q1',
    prompt: 'What unique problem does Bitcoin solve in the digital world?',
    difficulty: 'Beginner',
    options: [
      { k: 'a', label: 'Zero fees for all transactions' },
      { k: 'b', label: 'Double‑spend problem without a central entity' },
      { k: 'c', label: 'Protocol‑level guaranteed anonymity' },
    ],
    correct: 'b',
    explain:
      'The key innovation is preventing double‑spending via distributed consensus and a public blockchain.',
  },
  {
    id: 'q2',
    prompt: 'What is the role of Proof‑of‑Work in Bitcoin?',
    difficulty: 'Beginner',
    options: [
      { k: 'a', label: 'Increases network speed' },
      { k: 'b', label: 'Secures ordering and history via energy expenditure' },
      { k: 'c', label: 'Stores users’ private keys' },
    ],
    correct: 'b',
    explain:
      'PoW makes rewriting history costly, preserving block integrity and transaction ordering.',
  },
  {
    id: 'q3',
    prompt: 'What is Bitcoin’s programmed maximum supply?',
    difficulty: 'Beginner',
    options: [
      { k: 'a', label: '21 million BTC' },
      { k: 'b', label: '100 million BTC' },
      { k: 'c', label: 'Unlimited, controlled by miners' },
    ],
    correct: 'a',
    explain:
      'The protocol caps supply at 21M BTC, emitted gradually through ~4‑year halvings.',
  },
  {
    id: 'q4',
    prompt: 'What does Lightning Network add on top of Bitcoin Layer 1?',
    difficulty: 'Intermediate',
    options: [
      { k: 'a', label: 'Perfect privacy' },
      { k: 'b', label: 'Fast, low‑fee payments via channels' },
      { k: 'c', label: 'Increases total BTC supply' },
    ],
    correct: 'b',
    explain: 'LN shifts most activity off‑chain with periodic on‑chain settlement.',
  },
  {
    id: 'q5',
    prompt: 'What risk do hardware wallets primarily mitigate?',
    difficulty: 'Intermediate',
    options: [
      { k: 'a', label: 'Price volatility' },
      { k: 'b', label: 'Theft of private keys on insecure devices' },
      { k: 'c', label: 'High network fees' },
    ],
    correct: 'b',
    explain: 'Keys remain isolated on‑device; signing happens securely.',
  },
  {
    id: 'q6',
    prompt: 'Which statement about blockchain transactions is correct?',
    difficulty: 'Intermediate',
    options: [
      { k: 'a', label: 'They can be canceled by the sender within 24h' },
      { k: 'b', label: 'They are irreversible after confirmation' },
      { k: 'c', label: 'They process only on business days' },
    ],
    correct: 'b',
    explain: 'Irreversibility is a core property; always double‑check addresses and amounts.',
  },
];

function AnimIcon({ qid }) {
  // mini SVG animat diferit per întrebare
  switch (qid) {
    case 'q1':
      return (
        <svg width="28" height="28" viewBox="0 0 40 40" aria-hidden>
          <circle cx="20" cy="20" r="10" fill="none" stroke="#00c2ff" strokeWidth="2">
            <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      );
    case 'q2':
      return (
        <svg width="28" height="28" viewBox="0 0 40 40" aria-hidden>
          <rect x="10" y="10" width="20" height="20" fill="none" stroke="#00FF88" strokeWidth="2">
            <animate attributeName="x" values="9;10;9" dur="1.6s" repeatCount="indefinite" />
          </rect>
        </svg>
      );
    default:
      return (
        <svg width="28" height="28" viewBox="0 0 40 40" aria-hidden>
          <line x1="8" y1="32" x2="32" y2="8" stroke="#9aa" strokeWidth="2">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1.8s" repeatCount="indefinite" />
          </line>
        </svg>
      );
  }
}

export default function MiniQuizGPT({ variant = 'default' }) {
  const [answersById, setAnswersById] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const storageKey = variant === 'warmup' ? 'bp_quiz_warmup' : 'bp_quiz_default';

  // Load/save progres localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setAnswersById(parsed.answers || {});
          setSubmitted(!!parsed.submitted);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ answers: answersById, submitted }));
    } catch {}
  }, [answersById, submitted, storageKey]);

  const numCorrect = useMemo(() => {
    return QUESTIONS.reduce((acc, q) => (answersById[q.id] === q.correct ? acc + 1 : acc), 0);
  }, [answersById]);

  const allAnswered = useMemo(() => QUESTIONS.every((q) => !!answersById[q.id]), [answersById]);

  const handleSelect = (questionId, optionKey) => {
    if (submitted) return;
    setAnswersById((prev) => ({ ...prev, [questionId]: optionKey }));
  };

  return (
    <div className="mini-quiz">
      <div className="quiz-header">
        <div className="bits-badge">BITS</div>
        <h3 className="quiz-title">{variant === 'warmup' ? 'Warm‑up Quiz' : 'BitPulse® Lightning Quiz'}</h3>
        <div className="quiz-sub">3 questions • instant feedback • ~60s</div>
      </div>

      {/* Decorative AI strip */}
      <div className="ai-banner" aria-hidden>
        <span className="ai-chip" /><span className="ai-node" /><span className="ai-chip" /><span className="ai-node" /><span className="ai-chip" />
      </div>

      <div className="progress-rail" aria-label="quiz-progress">
        <div className="progress-fill" style={{ width: `${(Object.keys(answersById).length / QUESTIONS.length) * 100}%` }} />
      </div>

      <div className="quiz-grid">
        {QUESTIONS.map((q, idx) => {
          const chosen = answersById[q.id];
          const isCorrect = submitted && chosen === q.correct;
          const isIncorrect = submitted && !!chosen && chosen !== q.correct;

          return (
            <div key={q.id} className={`quiz-card ${isCorrect ? 'correct' : ''} ${isIncorrect ? 'incorrect' : ''}`}>
              <div className="quiz-index">{idx + 1}</div>
              <div className="quiz-prompt">
                <AnimIcon qid={q.id} />
                <div className="prompt-text">{q.prompt}</div>
                <div className="difficulty">{q.difficulty}</div>
              </div>
              <div className="quiz-options">
                {q.options.map((opt) => {
                  const selected = chosen === opt.k;
                  return (
                    <button
                      key={opt.k}
                      type="button"
                  className={`quiz-option ${selected ? 'selected' : ''}`}
                      onClick={() => handleSelect(q.id, opt.k)}
                    >
                  <span className="bullet" />{opt.label}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div className="quiz-explain">
                  {isCorrect ? 'Correct. ' : 'Correct answer: ' + q.options.find((o) => o.k === q.correct)?.label + '. '}
                  {q.explain}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="quiz-actions">
        {!submitted && (
          <button
            className="quiz-submit"
            disabled={!allAnswered}
            onClick={() => {
              setSubmitted(true);
              try {
                if (window.gtag) {
                  window.gtag('event', 'education_quiz_submit', {
                    score: QUESTIONS.reduce((acc, q) => (answersById[q.id] === q.correct ? acc + 1 : acc), 0),
                    total: QUESTIONS.length,
                    variant,
                  });
                }
                trackTikTokEvent('CompleteRegistration', { 
                  content_name: 'Education Quiz Submit', 
                  score: QUESTIONS.reduce((acc, q) => (answersById[q.id] === q.correct ? acc + 1 : acc), 0) 
                }, { retry: true });
              } catch {}
            }}
          >
            Check answers
          </button>
        )}

        {submitted && (
          <div className="quiz-result">
            <div className="score">Score: {numCorrect}/{QUESTIONS.length}</div>
            <Link className="continue-btn" to="/bitcoin-academy" onClick={() => {
              try {
                if (window.gtag) {
                  window.gtag('event', 'education_continue_bitcoin_academy', { source: 'quiz_result', variant });
                }
                if (window.ttq && window.ttq.track) {
                  window.ttq.track('ViewContent', { content_name: 'Continue to Bitcoin Academy', source: 'quiz' });
                }
              } catch {}
            }}>Continue learning in Bitcoin Academy →</Link>
          </div>
        )}
      </div>
    </div>
  );
}



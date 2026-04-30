/**
 * Quick jump to operator sections + sticky + scroll spy + keyboard shortcuts.
 * Anchors: futures-ops-open-positions, futures-ops-hold-block, futures-ops-manual-actions.
 */
import React, { useCallback, useEffect, useState } from 'react';
import FuturesOpsAiIntelGlyph from './FuturesOpsAiIntelGlyph';

const HOLD_ID = 'futures-ops-hold-block';

const ANCHORS = [
  {
    id: 'futures-ops-open-positions',
    label: 'Positions',
    variant: 'positions',
    title: 'Jump to open positions',
  },
  {
    id: HOLD_ID,
    label: 'Hold',
    variant: 'hold',
    title: 'Jump to Hold / token block',
  },
  {
    id: 'futures-ops-manual-actions',
    label: 'Manual',
    variant: 'manual',
    title: 'Kill switch, manual close',
  },
];

function syncUrlHash(activeTab, id) {
  const path = '/dex-edu/ota/short-ops';
  const q = activeTab === 'long' ? '?tab=long' : '';
  try {
    window.history.replaceState(null, '', `${path}${q}#${id}`);
  } catch {
    /* ignore */
  }
}

function orderedSectionIds(holdOk) {
  const o = ['futures-ops-open-positions'];
  if (holdOk) o.push(HOLD_ID);
  o.push('futures-ops-manual-actions');
  return o;
}

/** Real focus; avoid global keys inside editing fields. */
function isTypingInField(el) {
  if (!el || typeof el !== 'object') return false;
  if (!el.tagName) return false;
  const tag = el.tagName.toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  try {
    if (el.isContentEditable) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export default function FuturesOpsOperatorQuickNav({ activeTab = 'short', holdBlockAvailable = false }) {
  const [activeSectionId, setActiveSectionId] = useState('futures-ops-open-positions');

  const jumpTo = useCallback(
    (rawId) => {
      let id = rawId;
      if (id === HOLD_ID && !holdBlockAvailable) {
        id = 'futures-ops-open-positions';
      }
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      syncUrlHash(activeTab, id);
    },
    [activeTab, holdBlockAvailable],
  );

  useEffect(() => {
    if (!holdBlockAvailable && activeSectionId === HOLD_ID) {
      setActiveSectionId('futures-ops-open-positions');
    }
  }, [holdBlockAvailable, activeSectionId]);

  /** Scroll spy: active section = last one whose top passed the reference line. */
  useEffect(() => {
    const ACTIVATION_LINE = 120;
    const ids = orderedSectionIds(holdBlockAvailable);

    const measure = () => {
      let current = ids[0] || 'futures-ops-open-positions';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= ACTIVATION_LINE) current = id;
      }
      setActiveSectionId((prev) => (prev === current ? prev : current));
    };

    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    return () => {
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [activeTab, holdBlockAvailable]);

  /** 1/2/3 and g -> p|h|m. */
  useEffect(() => {
    let gTimer = null;
    let awaitingG = false;

    const clearG = () => {
      if (gTimer) clearTimeout(gTimer);
      gTimer = null;
      awaitingG = false;
    };

    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const focusEl = typeof document !== 'undefined' ? document.activeElement : null;
      if (isTypingInField(focusEl)) return;

      if (awaitingG) {
        const k = (e.key || '').toLowerCase();
        const code = e.code || '';
        const pick =
          k === 'p' || code === 'KeyP'
            ? 'futures-ops-open-positions'
            : k === 'h' || code === 'KeyH'
              ? HOLD_ID
              : k === 'm' || code === 'KeyM'
                ? 'futures-ops-manual-actions'
                : null;
        if (pick) {
          e.preventDefault();
          e.stopPropagation();
          clearG();
          jumpTo(pick);
          return;
        }
        clearG();
      }

      if (e.code === 'KeyG') {
        e.preventDefault();
        e.stopPropagation();
        clearG();
        awaitingG = true;
        gTimer = setTimeout(clearG, 1500);
        return;
      }

      const code = e.code || '';
      const digitToId =
        code === 'Digit1' || code === 'Numpad1'
          ? 'futures-ops-open-positions'
          : code === 'Digit2' || code === 'Numpad2'
            ? holdBlockAvailable
              ? HOLD_ID
              : 'futures-ops-open-positions'
            : code === 'Digit3' || code === 'Numpad3'
              ? 'futures-ops-manual-actions'
              : null;

      if (digitToId) {
        e.preventDefault();
        e.stopPropagation();
        jumpTo(digitToId);
        return;
      }

      if (e.key === '1' || e.key === '2' || e.key === '3') {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === '1') jumpTo('futures-ops-open-positions');
        else if (e.key === '2') jumpTo(holdBlockAvailable ? HOLD_ID : 'futures-ops-open-positions');
        else jumpTo('futures-ops-manual-actions');
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      clearG();
    };
  }, [holdBlockAvailable, jumpTo]);

  const onJumpClick = useCallback(
    (e, id) => {
      e.preventDefault();
      jumpTo(id);
    },
    [jumpTo],
  );

  const linkClass = (variant, { active, disabled }) => {
    const parts = [
      'futures-ops-operator-quick-nav__link',
      `futures-ops-operator-quick-nav__link--${variant}`,
    ];
    if (active) parts.push('futures-ops-operator-quick-nav__link--active');
    if (disabled) parts.push('futures-ops-operator-quick-nav__link--disabled');
    return parts.join(' ');
  };

  return (
    <div className="futures-ops-operator-quick-nav-sticky">
      <nav className="futures-ops-operator-quick-nav" aria-label="Quick jump - Positions, Hold, Manual">
        {ANCHORS.map(({ id, label, title, variant }) => {
          const isHold = id === HOLD_ID;
          const holdMissing = isHold && !holdBlockAvailable;
          const isActive = !holdMissing && activeSectionId === id;

          if (holdMissing) {
            return (
              <button
                key={id}
                type="button"
                className={linkClass('hold', { active: false, disabled: true })}
                title="Hold appears after live status loads. Click to jump to Positions."
                onClick={() => jumpTo('futures-ops-open-positions')}
              >
                <span className="futures-ops-operator-quick-nav__ai-wrap" aria-hidden>
                  <FuturesOpsAiIntelGlyph size={16} className="futures-ops-operator-quick-nav__ai-svg" />
                </span>
                <span>{label}</span>
              </button>
            );
          }

          return (
            <a
              key={id}
              href={`/dex-edu/ota/short-ops${activeTab === 'long' ? '?tab=long' : ''}#${id}`}
              className={linkClass(variant, { active: isActive, disabled: false })}
              title={title}
              aria-current={isActive ? 'location' : undefined}
              onClick={(e) => onJumpClick(e, id)}
            >
              <span className="futures-ops-operator-quick-nav__ai-wrap" aria-hidden>
                <FuturesOpsAiIntelGlyph size={16} className="futures-ops-operator-quick-nav__ai-svg" />
              </span>
              <span>{label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}

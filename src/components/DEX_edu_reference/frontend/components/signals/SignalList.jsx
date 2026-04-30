/**
 * Signal list — layout/styling only; data from useSignals unchanged.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSignals } from '../../hooks/useSignals';
import SignalCard from './SignalCard';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Button } from '../ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../../styles/components/signal-list.css';

const SignalList = React.memo(({ userId, onSelectSignal, onExecuteSignal, filters = {} }) => {
  const {
    signals,
    loading,
    error,
    refreshing,
    pagination,
    validateSignal,
    loadNextPage,
    loadPreviousPage,
    refresh
  } = useSignals(userId, { autoRefresh: true, ...filters });

  const [validating, setValidating] = useState({});
  const { handleError, handleSuccess } = useErrorHandler();

  useEffect(() => {
    if (error && !loading) {
      handleError(error, {
        title: 'Failed to Load Signals',
        showToast: true
      });
    }
  }, [error, loading, handleError]);

  const handleValidate = useCallback(
    async (signalId) => {
      try {
        setValidating((prev) => ({ ...prev, [signalId]: true }));
        await validateSignal(signalId);
        await refresh();
        handleSuccess('Signal validated successfully');
      } catch (err) {
        handleError(err, {
          title: 'Failed to Validate Signal',
          showToast: true
        });
      } finally {
        setValidating((prev) => ({ ...prev, [signalId]: false }));
      }
    },
    [validateSignal, refresh, handleError, handleSuccess]
  );

  const handleSelectSignal = useCallback(
    (signal) => {
      onSelectSignal?.(signal);
    },
    [onSelectSignal]
  );

  const paginationInfo = useMemo(() => {
    if (!pagination) return null;
    return {
      showing: `${pagination.offset + 1} - ${pagination.offset + (signals?.length || 0)}`,
      total: pagination.total || signals?.length || 0,
      hasPrevious: pagination.offset > 0,
      hasNext: pagination.hasMore || false
    };
  }, [pagination, signals]);

  if (loading && !signals) {
    return (
      <div className="signal-list signal-list--premium">
        <LoadingSpinner message="Loading signals…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="signal-list signal-list--premium signal-list-error">
        <p>{error}</p>
        <Button variant="primary" size="md" onClick={refresh} disabled={loading}>
          Retry
        </Button>
      </div>
    );
  }

  if (!signals || signals.length === 0) {
    return (
      <div className="signal-list signal-list--premium signal-list-empty">
        <EmptyState
          title="No signals for this wallet yet"
          message="The Signals API loaded successfully, but it returned zero rows for the connected wallet and current filters."
        />
        <div className="signal-list-empty-hint">
          <div className="signal-list-empty-hint-title">What this means</div>
          <ul>
            <li>Source: GET /ai-trading/signals returned an empty list.</li>
            <li>New OTA Auto, LONG, SHORT, or manual analyses will appear here after the backend stores them.</li>
            <li>Filters can also hide existing rows; reset filters or retry the request.</li>
          </ul>
          <Button variant="primary" size="md" onClick={refresh} disabled={loading || refreshing}>
            {refreshing ? 'Refreshing…' : 'Retry'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section className="signal-list signal-list--premium" aria-label="Trading signals list">
      {refreshing ? (
        <div className="signal-list-refreshing">
          <LoadingSpinner size="small" message="Refreshing…" />
        </div>
      ) : null}

      <div className="signal-list-inner">
        <div className="signal-list-grid">
          {signals.map((signal, index) => (
            <SignalCard
              key={
                signal.id != null && signal.id !== ''
                  ? String(signal.id)
                  : `signal-${signal.token || 'x'}-${signal.createdAt || signal.timestamp || index}`
              }
              signal={signal}
              validating={validating[signal.id]}
              onSelect={() => handleSelectSignal(signal)}
              onValidate={() => handleValidate(signal.id)}
              onExecuteSignal={onExecuteSignal}
            />
          ))}
        </div>
      </div>

      {pagination ? (
        <footer className="signal-list-pagination">
          <Button
            variant="secondary"
            size="sm"
            icon={<ChevronLeft size={16} />}
            onClick={loadPreviousPage}
            disabled={!paginationInfo?.hasPrevious || loading}
          >
            Previous
          </Button>
          <span className="signal-list-pagination-info">
            {paginationInfo ? (
              <>
                Showing {paginationInfo.showing} of {paginationInfo.total}
              </>
            ) : (
              <>Showing {signals.length} signals</>
            )}
          </span>
          <Button
            variant="secondary"
            size="sm"
            icon={<ChevronRight size={16} />}
            iconPosition="right"
            onClick={loadNextPage}
            disabled={!paginationInfo?.hasNext || loading}
          >
            Next
          </Button>
        </footer>
      ) : null}
    </section>
  );
});

SignalList.displayName = 'SignalList';

export default SignalList;

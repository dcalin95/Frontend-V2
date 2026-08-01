import React from 'react';

function dateRange(coverage) {
  if (!coverage?.oldestCollectedTimestamp && !coverage?.newestCollectedTimestamp) return 'Not available';
  const format = (value) => value ? new Date(value).toLocaleDateString() : 'unknown';
  return `${format(coverage.oldestCollectedTimestamp)} - ${format(coverage.newestCollectedTimestamp)}`;
}

export default function CoverageSummaryBar({ job, coverage }) {
  const finalCoverage = coverage || job?.final_result?.coverage || job?.partial_result?.coverage || null;
  const execution = job?.status || 'not run';
  const coverageStatus = finalCoverage?.status || 'not started';
  return (
    <section className="investigator-coverage-bar" aria-label="Execution and blockchain coverage">
      <div><span>Execution</span><strong>{execution}</strong></div>
      <div><span>Coverage</span><strong>{coverageStatus}</strong></div>
      <div><span>Pages</span><strong>{finalCoverage?.pagesCollected ?? 0}</strong></div>
      <div><span>Events</span><strong>{finalCoverage?.recordsCollected ?? 0}</strong></div>
      <div><span>Period</span><strong>{dateRange(finalCoverage)}</strong></div>
      <div><span>More pages</span><strong>{finalCoverage?.hasMoreData ? 'Yes' : 'No'}</strong></div>
      <div><span>Failures</span><strong>{finalCoverage?.providerFailures?.length ?? 0}</strong></div>
      <div><span>Stop reason</span><strong>{finalCoverage?.stopReason || '—'}</strong></div>
    </section>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cancelInvestigationJob,
  createInvestigationJob,
  getInvestigationJob,
} from '../services/investigatorService';

const TERMINAL_STATES = new Set(['completed', 'failed', 'cancelled']);

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timeout);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

export default function useInvestigationJob({ pollIntervalMs = 900 } = {}) {
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const controllerRef = useRef(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const run = useCallback(async ({ caseId, depth, signal: parentSignal }) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const abortFromParent = () => controller.abort();
    parentSignal?.addEventListener('abort', abortFromParent, { once: true });
    setError('');
    try {
      const created = await createInvestigationJob(caseId, { depth, signal: controller.signal });
      let current = created.job;
      setJob(current);
      while (!TERMINAL_STATES.has(current.status)) {
        await wait(pollIntervalMs, controller.signal);
        const response = await getInvestigationJob(caseId, current.id, { signal: controller.signal });
        current = response.job;
        setJob(current);
      }
      if (current.status === 'failed') {
        const runError = new Error(current.error_message || 'Investigation job failed.');
        runError.code = current.error_code;
        throw runError;
      }
      if (current.status === 'cancelled') throw new DOMException('Investigation cancelled.', 'AbortError');
      return current;
    } catch (runError) {
      if (runError?.name !== 'AbortError') setError(runError?.message || 'Investigation job failed.');
      throw runError;
    } finally {
      parentSignal?.removeEventListener('abort', abortFromParent);
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, [pollIntervalMs]);

  const cancel = useCallback(async (caseId) => {
    const activeJob = job;
    if (caseId && activeJob?.id && !TERMINAL_STATES.has(activeJob.status)) {
      await cancelInvestigationJob(caseId, activeJob.id).catch(() => {});
    }
    controllerRef.current?.abort();
  }, [job]);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setJob(null);
    setError('');
  }, []);

  return { job, error, run, cancel, reset };
}

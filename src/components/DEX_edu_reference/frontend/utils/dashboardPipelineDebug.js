/**
 * Debug structurat pentru traseul Dashboard aggregate — activare:
 *   REACT_APP_DASHBOARD_PIPELINE_DEBUG=true
 * (Vite injectează REACT_APP_* din .env; vezi vite.config.js `define` + loadEnv.)
 */

function enabled() {
  try {
    return String(process.env.REACT_APP_DASHBOARD_PIPELINE_DEBUG || '').trim() === 'true';
  } catch {
    return false;
  }
}

/**
 * @param {string} stage
 * @param {object} data - fără secrete; payload-uri deja în memorie în UI
 */
export function logDashboardPipeline(stage, data) {
  if (!enabled() || typeof console === 'undefined' || !console.groupCollapsed) return;
  try {
    console.groupCollapsed(`[dashboard pipeline] ${stage}`);
    console.log(data);
    console.groupEnd();
  } catch {
    /* noop */
  }
}

export function isDashboardPipelineDebugEnabled() {
  return enabled();
}

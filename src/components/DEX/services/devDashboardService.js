/**
 * DEV MODE – Dashboard Service
 * ⚠️ TEMPORARY: This service fetches live data from backend
 * 
 * Purpose: Read-only service to fetch /api/live-data endpoint
 * All dashboard API calls should go through this service
 */

import backendClient from './backendClient';

/**
 * Fetch live data from backend
 * Returns { ok: boolean, data: any, error: string | null }
 */
const fetchLiveData = async () => {
  try {
    console.log('📊 [devDashboardService] Fetching live data from /api/live-data...');
    const result = await backendClient.fetchJson('/live-data', {
      timeoutMs: 8000,
      method: 'GET'
    });

    if (!result.ok) {
      console.warn('⚠️ [devDashboardService] Live data fetch failed:', result.error);
      return result;
    }

    console.log('✅ [devDashboardService] Live data fetched successfully');
    return result;
  } catch (error) {
    console.error('❌ [devDashboardService] Live data fetch error:', error);
    return {
      ok: false,
      data: null,
      error: error.message || 'Unknown error'
    };
  }
};

/**
 * DEV MODE – Dashboard Service
 */
const devDashboardService = {
  fetchLiveData
};

export default devDashboardService;

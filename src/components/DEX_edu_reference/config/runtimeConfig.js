/**
 * Runtime Configuration Loader
 * 
 * Loads configuration from runtime-config.json at app startup.
 * This allows changing backend URL without rebuilding the app.
 * 
 * Fallback order:
 * 1. runtime-config.json (fetched at runtime)
 * 2. REACT_APP_* environment variables (build-time)
 * 3. Development fallback (localhost) - only if NODE_ENV !== 'production'
 * 
 * @module runtimeConfig
 */

let cachedConfig = null;
let configLoadPromise = null;
const DEX_EDU_BACKEND_URL = 'https://backend-server-eu.onrender.com';

/**
 * Loads runtime configuration from runtime-config.json
 * Returns cached config if already loaded
 */
async function loadRuntimeConfig() {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig;
  }

  // Return existing promise if already loading
  if (configLoadPromise) {
    return configLoadPromise;
  }

  // Start loading
  configLoadPromise = (async () => {
    try {
      // Always use runtime-config.json (no localhost config needed)
      // Frontend local connects to Render backend, but stays on localhost after login
      const configFile = '/runtime-config.json';
      
      // Fetch runtime-config.json from public directory
      // Use no-store to bypass cache and always fetch fresh
      // Add timeout (3 seconds) to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      try {
        const response = await fetch(configFile, {
          cache: 'no-store', // Always fetch fresh config (bypasses HTTP cache)
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          let config;
          try {
            config = await response.json();
          } catch (jsonError) {
            throw new Error(`Invalid JSON: ${jsonError.message}`);
          }
          
          // Validate minimal schema
          if (typeof config !== 'object' || config === null) {
            throw new Error('Config must be a JSON object');
          }
          
          // Validate required keys exist and are non-empty strings
          if (!config.BACKEND_URL || typeof config.BACKEND_URL !== 'string' || config.BACKEND_URL.trim() === '') {
            throw new Error('BACKEND_URL is required and must be a non-empty string');
          }
          
          if (!config.API_BASE_URL || typeof config.API_BASE_URL !== 'string' || config.API_BASE_URL.trim() === '') {
            throw new Error('API_BASE_URL is required and must be a non-empty string');
          }
          
          // Validate URLs are absolute
          if (!config.BACKEND_URL.match(/^https?:\/\//)) {
            throw new Error('BACKEND_URL must be an absolute URL');
          }
          
          if (!config.API_BASE_URL.match(/^https?:\/\//)) {
            throw new Error('API_BASE_URL must be an absolute URL');
          }
          
          const wrapEnabled = config.USE_BITSWAP_WRAPPER === true || config.USE_BITSWAP_WRAPPER === 'true';
          const wrapAddr = (config.BITSWAP_WRAPPER_ADDRESS && String(config.BITSWAP_WRAPPER_ADDRESS).trim()) || '';
          const shortOpsSecretRaw =
            config.OTA_SHORT_OPS_SECRET != null
              ? String(config.OTA_SHORT_OPS_SECRET).trim()
              : config.REACT_APP_OTA_SHORT_OPS_SECRET != null
                ? String(config.REACT_APP_OTA_SHORT_OPS_SECRET).trim()
                : '';
          const longOpsSecretRaw =
            config.OTA_LONG_OPS_SECRET != null
              ? String(config.OTA_LONG_OPS_SECRET).trim()
              : config.REACT_APP_OTA_LONG_OPS_SECRET != null
                ? String(config.REACT_APP_OTA_LONG_OPS_SECRET).trim()
                : '';
          /** Baza doar pentru redirect OAuth (Google etc.): domeniu first-party (ex. api.bits-ai.io), fără *.onrender.com în URL-ul vizibil userului. */
          let authBackendUrl = '';
          if (config.AUTH_BACKEND_URL != null && String(config.AUTH_BACKEND_URL).trim()) {
            const raw = String(config.AUTH_BACKEND_URL).trim();
            if (raw.match(/^https?:\/\//)) {
              authBackendUrl = raw.replace(/\/$/, '');
            } else {
              console.warn('[RuntimeConfig] AUTH_BACKEND_URL must be absolute (https://...); ignored.');
            }
          }
          cachedConfig = {
            BACKEND_URL: config.BACKEND_URL,
            API_BASE_URL: config.API_BASE_URL,
            LEVERAGE_TRADING_ADDRESS: (config.LEVERAGE_TRADING_ADDRESS && String(config.LEVERAGE_TRADING_ADDRESS).trim()) || '',
            ...(config.USE_BITSWAP_WRAPPER !== undefined && { USE_BITSWAP_WRAPPER: wrapEnabled }),
            ...(wrapAddr && { BITSWAP_WRAPPER_ADDRESS: wrapAddr }),
            ...(shortOpsSecretRaw ? { OTA_SHORT_OPS_SECRET: shortOpsSecretRaw } : {}),
            ...(longOpsSecretRaw ? { OTA_LONG_OPS_SECRET: longOpsSecretRaw } : {}),
            ...(authBackendUrl ? { AUTH_BACKEND_URL: authBackendUrl } : {}),
            source: 'runtime-config.json'
          };
          return cachedConfig;
        } else {
          throw new Error(`Failed to load ${configFile}: ${response.status}`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error(`Timeout fetching ${configFile} (3s)`);
        }
        throw fetchError;
      }
    } catch (error) {
      // Log concise warning and fall back to env vars
      const reason = error.message || 'Unknown error';
      console.warn(`[RuntimeConfig] Invalid runtime-config.json: ${reason}. Falling back.`);
      return null;
    }
  })();

  return configLoadPromise;
}

/**
 * Gets backend URL with fallback chain
 */
function getBackendUrl() {
  if (typeof window !== 'undefined') {
    if (cachedConfig?.BACKEND_URL) {
      return cachedConfig.BACKEND_URL;
    }
  }

  return DEX_EDU_BACKEND_URL;
}

/**
 * Bază URL pentru începutul flow-ului OAuth (browser navighează la {base}/api/auth/{provider}/start).
 * Separat de BACKEND_URL: poate indica un domeniu first-party (ex. api.bits-ai.io) proxy către același serviciu,
 * astfel încât utilizatorul nu vede host Render brut (interstițial Safe Browsing pe unele domenii *.onrender.com).
 * Fallback: getBackendUrl().
 */
function getAuthBackendUrl() {
  if (typeof window !== 'undefined' && cachedConfig?.AUTH_BACKEND_URL) {
    return cachedConfig.AUTH_BACKEND_URL;
  }
  return getBackendUrl();
}

/**
 * Gets API base URL with fallback chain
 */
function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    if (cachedConfig?.API_BASE_URL) {
      return cachedConfig.API_BASE_URL;
    }
  }

  const backendUrl = getBackendUrl();
  return `${backendUrl}/api`;
}

/**
 * Gets Leverage Trading contract address (runtime-config > env > '')
 */
export function getLeverageTradingAddress() {
  if (typeof window !== 'undefined' && cachedConfig?.LEVERAGE_TRADING_ADDRESS) {
    return cachedConfig.LEVERAGE_TRADING_ADDRESS;
  }
  return (process.env.REACT_APP_LEVERAGE_TRADING_ADDRESS || '').trim();
}

/** Wrapper enabled = true: swap-uri trec prin BitSwapDEXWrapper și se colectează 0.1%. */
export function getUseBitSwapWrapper() {
  if (typeof window !== 'undefined' && cachedConfig && 'USE_BITSWAP_WRAPPER' in cachedConfig) {
    return !!cachedConfig.USE_BITSWAP_WRAPPER;
  }
  const env = process.env.REACT_APP_USE_BITSWAP_WRAPPER;
  if (env === 'false') return false;
  if (env === 'true') return true;
  return true; // default ON – contract deployat, colectare fee
}

export function getBitSwapWrapperAddress() {
  if (typeof window !== 'undefined' && cachedConfig?.BITSWAP_WRAPPER_ADDRESS) {
    return cachedConfig.BITSWAP_WRAPPER_ADDRESS;
  }
  return (process.env.REACT_APP_BITSWAP_WRAPPER_ADDRESS || '0x5dC470e76AB02190491a2d1a110c6e067623a761').trim();
}

/**
 * Secret pentru header X-Ota-Short-Ops-Secret: runtime-config.json (OTA_SHORT_OPS_SECRET) apoi REACT_APP_* la build.
 * Aliniat cu OTA_SHORT_OPS_SECRET pe backend.
 */
export function getOtaShortOpsSecret() {
  const fromRc =
    typeof window !== 'undefined' && cachedConfig?.OTA_SHORT_OPS_SECRET
      ? String(cachedConfig.OTA_SHORT_OPS_SECRET).trim()
      : '';
  if (fromRc) return fromRc;
  return (process.env.REACT_APP_OTA_SHORT_OPS_SECRET || '').trim();
}

function getOtaLongOpsSecretFromUrl() {
  if (typeof window === 'undefined') return '';

  const readParams = (rawParams) => {
    if (!rawParams) return '';
    const params = new URLSearchParams(rawParams.startsWith('?') ? rawParams.slice(1) : rawParams);
    return (
      params.get('otaLongOpsSecret') ||
      params.get('longOpsSecret') ||
      params.get('secret') ||
      ''
    ).trim();
  };

  const fromSearch = readParams(window.location.search);
  if (fromSearch) return fromSearch;

  const hashQueryIndex = String(window.location.hash || '').indexOf('?');
  if (hashQueryIndex >= 0) {
    return readParams(window.location.hash.slice(hashQueryIndex + 1));
  }

  return '';
}

/**
 * Secret pentru header X-Ota-Long-Ops-Secret: runtime-config.json (OTA_LONG_OPS_SECRET),
 * URL-ul paginii (?otaLongOpsSecret=, ?longOpsSecret= sau ?secret=), apoi REACT_APP_* la build.
 * Dacă lipsește explicit, folosește același secret ca SHORT (deploy-uri cu un singur secret în RC / același string pe Render).
 */
export function getOtaLongOpsSecret() {
  const fromRc =
    typeof window !== 'undefined' && cachedConfig?.OTA_LONG_OPS_SECRET
      ? String(cachedConfig.OTA_LONG_OPS_SECRET).trim()
      : '';
  if (fromRc) return fromRc;
  const fromUrl = getOtaLongOpsSecretFromUrl();
  if (fromUrl) return fromUrl;
  const fromEnv = (process.env.REACT_APP_OTA_LONG_OPS_SECRET || '').trim();
  if (fromEnv) return fromEnv;
  return getOtaShortOpsSecret();
}

/**
 * Gets the source of the current configuration
 */
function getConfigSource() {
  if (cachedConfig && cachedConfig.source) {
    return cachedConfig.source;
  }

  return 'DEX edu backend default';
}

/**
 * Initializes runtime configuration
 * Call this at app startup (in index.js or AppWrapper.js)
 */
async function initRuntimeConfig() {
  try {
    await loadRuntimeConfig();
    
    const backendUrl = getBackendUrl();
    const apiBaseUrl = getApiBaseUrl();
    const source = getConfigSource();
    
    return {
      BACKEND_URL: backendUrl,
      API_BASE_URL: apiBaseUrl,
      source
    };
  } catch (error) {
    console.error('[RuntimeConfig] Failed to initialize:', error);
    // Return fallback config
    const backendUrl = getBackendUrl();
    const apiBaseUrl = getApiBaseUrl();
    const source = getConfigSource();
    
    return {
      BACKEND_URL: backendUrl,
      API_BASE_URL: apiBaseUrl,
      source
    };
  }
}

// Export synchronous getters (for immediate use)
export { getBackendUrl, getAuthBackendUrl, getApiBaseUrl, getConfigSource, initRuntimeConfig, loadRuntimeConfig };

// Export async getters (for when runtime config is loaded)
export async function getBackendUrlAsync() {
  await loadRuntimeConfig();
  return getBackendUrl();
}

export async function getApiBaseUrlAsync() {
  await loadRuntimeConfig();
  return getApiBaseUrl();
}

export async function getAuthBackendUrlAsync() {
  await loadRuntimeConfig();
  return getAuthBackendUrl();
}

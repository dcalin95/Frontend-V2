import { ethers } from "ethers";

/**
 * BSC MAINNET RPC Endpoints - Extended list with reliable providers
 */
const BSC_MAINNET_RPC_ENDPOINTS = [
  // Primary Binance endpoints
  "https://bsc-dataseed1.binance.org",
  "https://bsc-dataseed2.binance.org",
  "https://bsc-dataseed3.binance.org",
  "https://bsc-dataseed4.binance.org",
  
  // Public node providers (often more reliable)
  "https://bsc.publicnode.com",
  "https://bsc-rpc.publicnode.com",
  
  // Alternative providers
  "https://rpc.ankr.com/bsc",
  "https://bsc-dataseed1.defibit.io",
  "https://bsc-dataseed1.ninicoin.io",
  "https://bsc.rpc.blxrbdn.com",
  "https://bsc.blockpi.network/v1/rpc/public",
  "https://bscrpc.com",
  
  // Additional fallbacks
  "https://binance.nodereal.io",
  "https://rpc-bsc.48.club",
  "https://bsc.meowrpc.com"
];

/**
 * Try multiple RPC endpoints until one works
 * @returns {ethers.providers.JsonRpcProvider} Working provider
 */
export const getRobustProvider = async () => {
  let lastError = null;

  console.log(`🚀 [RPC FALLBACK] Starting robust provider search across ${BSC_MAINNET_RPC_ENDPOINTS.length} endpoints...`);

  for (let i = 0; i < BSC_MAINNET_RPC_ENDPOINTS.length; i++) {
    const rpcUrl = BSC_MAINNET_RPC_ENDPOINTS[i];
    
    try {
      console.log(`🌐 [RPC ${i + 1}/${BSC_MAINNET_RPC_ENDPOINTS.length}] Testing: ${rpcUrl}`);
      
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      
      // Test connection with 6-second timeout (BSC mainnet can be slow)
      const blockNumber = await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('6s timeout')), 6000))
      ]);
      
      console.log(`✅ [RPC SUCCESS] Connected to ${rpcUrl} - Block: ${blockNumber}`);
      
      // Double-check with network call
      const network = await provider.getNetwork();
      console.log(`🔗 [RPC VERIFY] Network ID: ${network.chainId}, Name: ${network.name}`);
      
      return provider;
      
    } catch (error) {
      const shortUrl = rpcUrl.replace('https://', '').split('/')[0];
      console.warn(`❌ [RPC FAIL] ${shortUrl}: ${error.message}`);
      lastError = error;
    }
  }
  
  // If all RPC endpoints fail, try MetaMask as fallback
  if (window.ethereum) {
    console.log("🔄 [METAMASK FALLBACK] All RPC endpoints failed, trying MetaMask...");
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.getBlockNumber(); // Test connection
      console.log("✅ [METAMASK SUCCESS] Using MetaMask as RPC fallback");
      return provider;
    } catch (mmError) {
      console.error("❌ [METAMASK FAIL]:", mmError.message);
    }
  }
  
  console.error(`💥 [TOTAL FAILURE] All ${BSC_MAINNET_RPC_ENDPOINTS.length} RPC endpoints + MetaMask failed!`);
  throw new Error(`🌐 Complete RPC Failure: All endpoints unreachable. Last error: ${lastError?.message}`);
};

/**
 * Execute contract call with RPC fallback
 * @param {Function} contractCallFn - Function that takes provider and returns promise
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise} Contract call result
 */
export const executeWithFallback = async (contractCallFn, maxRetries = 3) => {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const provider = await getRobustProvider();
      return await contractCallFn(provider);
    } catch (error) {
      attempt++;
      const currentAttempt = attempt; // capture to avoid no-loop-func issues
      console.warn(`⚠️ [RPC] Attempt ${currentAttempt}/${maxRetries} failed:`, error.message);
      
      if (currentAttempt >= maxRetries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * currentAttempt));
    }
  }
};

const rpcFallbackApi = { getRobustProvider, executeWithFallback, BSC_MAINNET_RPC_ENDPOINTS };
export default rpcFallbackApi;

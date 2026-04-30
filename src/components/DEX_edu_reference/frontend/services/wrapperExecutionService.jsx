/**
 * 🔄 BitSwapDEXWrapper Execution Service
 * 
 * Construiește și execută tranzacții direct prin BitSwapDEXWrapper
 * pentru colectarea reală a fee-urilor de 0.1%
 * 
 * @module wrapperExecutionService
 */

import { ethers } from 'ethers';
import { getTokenAddress, getTokenDecimals } from './tokenRegistry';
import { getBitSwapWrapperAddress } from '../../config/runtimeConfig.js';
import { getInjectedProvider } from './injectedProvider';

// BitSwapDEXWrapper ABI (funcțiile de swap)
const BITSWAP_WRAPPER_ABI = [
  'function swapETHForTokens(address tokenOut, uint256 amountOutMin, uint256 deadline) external payable returns (uint[] memory amounts)',
  'function swapTokensForETH(address tokenIn, uint256 amountIn, uint256 amountOutMin, uint256 deadline) external returns (uint[] memory amounts)',
  'function swapTokensForTokens(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMin, uint256 deadline) external returns (uint[] memory amounts)',
  'function calculateFee(uint256 amount) external pure returns (uint256)',
  'function isConfigured() external view returns (bool)'
];

function decodeRevertReason(data) {
  if (!data || typeof data !== 'string') return null;
  const hex = data.startsWith('0x') ? data.slice(2) : data;
  if (hex.length < 8) return null;
  try {
    const sig = ('0x' + hex.slice(0, 8)).toLowerCase();
    if (sig === '0x08c379a0') {
      const abiCoder = new ethers.utils.AbiCoder();
      const decoded = abiCoder.decode(['string'], '0x' + hex.slice(8));
      return decoded?.[0] || null;
    }
    if (sig === '0x4e487b71') {
      const code = parseInt(hex.slice(8, 72), 16);
      const panicReasons = { 17: 'overflow', 18: 'div by zero', 1: 'assert', 49: 'uninitialized' };
      return `Panic(${panicReasons[code] || code})`;
    }
  } catch (_) {}
  return null;
}

/**
 * Execute swap through BitSwapDEXWrapper (LOCAL - no backend)
 * @param {string} tokenIn - Token in symbol  
 * @param {string} tokenOut - Token out symbol
 * @param {string} amountIn - Amount to swap
 * @param {string} recipient - Recipient address
 * @param {number} slippage - Slippage percentage
 * @param {number} deadline - Deadline in minutes
 * @param {string|null} expectedMinOut - Min amount out from quote (human string, e.g. "298.5") – avoids wrong BNB/USDT calc
 * @returns {Promise<Object>} Transaction result
 */
export async function executeSwapThroughWrapper(tokenIn, tokenOut, amountIn, recipient, slippage = 0.5, deadline = 20, expectedMinOut = null, signerOverride = null) {
  try {
    const wrapperAddress = getBitSwapWrapperAddress();
    if (!wrapperAddress) {
      throw new Error('BitSwapDEXWrapper address not configured');
    }
    
    // Preferă signer din wagmi/WalletContext (merge cu WalletConnect, MetaMask injectat pe S3)
    let signer = signerOverride;
    if (!signer) {
      const eth = getInjectedProvider();
      if (!eth) throw new Error('Wallet not connected – please connect your wallet');
      const provider = new ethers.providers.Web3Provider(eth, 'any');
      const accounts = await eth.request({ method: 'eth_accounts' }).catch(() => []);
      if (!accounts?.length) throw new Error('Wallet not connected – please connect your wallet');
      signer = provider.getSigner(accounts[0]);
    }
    
    // Create wrapper contract instance
    const wrapperContract = new ethers.Contract(wrapperAddress, BITSWAP_WRAPPER_ABI, signer);
    
    // Check if wrapper is configured
    const isConfigured = await wrapperContract.isConfigured();
    if (!isConfigured) {
      throw new Error('BitSwapDEXWrapper is not properly configured');
    }
    
    console.log('[WRAPPER] Executing swap through wrapper:', {
      wrapper: wrapperAddress,
      tokenIn,
      tokenOut,
      amountIn,
      slippage,
      deadline,
      expectedMinOut
    });
    
    // Calculate amounts
    const amountInWei = ethers.utils.parseEther(amountIn.toString());
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);
    
    // Min amount out: use quote minOut when provided (correct BNB/USDT calc); else fallback
    // Wrapper takes 0.1% fee → we swap 99.9% of amount; 1% buffer ensures achievable minOut
    let minAmountOut;
    if (expectedMinOut != null && expectedMinOut !== '') {
      const decimals = getTokenDecimals(tokenOut);
      const rawMin = ethers.utils.parseUnits(String(expectedMinOut).trim(), decimals);
      minAmountOut = rawMin.mul(99).div(100);
    } else {
      minAmountOut = ethers.utils.parseEther('0.1'); // fallback – may cause revert for small swaps
    }

    console.log('[WRAPPER_DEBUG] Params:', {
      tokenIn,
      tokenOut,
      amountIn: amountIn.toString(),
      amountInWei: amountInWei.toString(),
      minAmountOutWei: minAmountOut.toString(),
      minAmountOutHuman: ethers.utils.formatEther(minAmountOut),
      deadlineTimestamp,
      expectedMinOut
    });
    
    let txResponse;
    
    if (tokenIn === 'BNB') {
      // BNB → Token swap
      const tokenOutAddress = getTokenAddress(tokenOut);
      if (!tokenOutAddress) {
        throw new Error(`Unknown token: ${tokenOut}`);
      }
      
      console.log('[WRAPPER] BNB → Token swap');
      txResponse = await wrapperContract.swapETHForTokens(
        tokenOutAddress,
        minAmountOut,
        deadlineTimestamp,
        { 
          value: amountInWei,
          gasLimit: 200000 // Higher gas for wrapper
        }
      );
      
    } else if (tokenOut === 'BNB') {
      // Token → BNB swap  
      const tokenInAddress = getTokenAddress(tokenIn);
      if (!tokenInAddress) {
        throw new Error(`Unknown token: ${tokenIn}`);
      }
      
      console.log('[WRAPPER] Token → BNB swap', { tokenInAddress, amountInWei: amountInWei.toString(), minAmountOut: minAmountOut.toString() });
      
      // Pre-flight: simulate to get revert reason before wallet prompt
      try {
        await wrapperContract.callStatic.swapTokensForETH(
          tokenInAddress,
          amountInWei,
          minAmountOut,
          deadlineTimestamp
        );
        console.log('[WRAPPER_DEBUG] Static call OK – simulation passed');
      } catch (simErr) {
        const reason = decodeRevertReason(simErr.data || simErr.error?.data) || simErr.reason || simErr.message;
        console.error('[WRAPPER_DEBUG] Static call failed (pre-flight):', {
          message: simErr.message,
          reason: simErr.reason,
          data: simErr.data,
          decodedReason: reason
        });
        throw new Error(reason ? `Swap would revert: ${reason}` : `Swap would revert. ${simErr.message || ''}`);
      }
      
      const gasEstimate = await wrapperContract.estimateGas.swapTokensForETH(
        tokenInAddress,
        amountInWei,
        minAmountOut,
        deadlineTimestamp
      ).catch(() => null);
      const gasLimit = gasEstimate ? gasEstimate.mul(130).div(100) : 300000;
      console.log('[WRAPPER_DEBUG] Gas:', { estimated: gasEstimate?.toString(), using: gasLimit.toString() });
      txResponse = await wrapperContract.swapTokensForETH(
        tokenInAddress,
        amountInWei,
        minAmountOut,
        deadlineTimestamp,
        { gasLimit }
      );
      
    } else {
      // Token → Token swap (e.g. CAKE → USDT)
      const tokenInAddress = getTokenAddress(tokenIn);
      const tokenOutAddress = getTokenAddress(tokenOut);
      
      if (!tokenInAddress || !tokenOutAddress) {
        throw new Error(`Unknown token: ${tokenIn} or ${tokenOut}`);
      }
      
      console.log('[WRAPPER] Token → Token swap', { tokenIn, tokenOut });
      const gasEstimate = await wrapperContract.estimateGas.swapTokensForTokens(
        tokenInAddress,
        tokenOutAddress,
        amountInWei,
        minAmountOut,
        deadlineTimestamp
      ).catch(() => null);
      const gasLimit = gasEstimate ? gasEstimate.mul(130).div(100) : 250000;
      txResponse = await wrapperContract.swapTokensForTokens(
        tokenInAddress,
        tokenOutAddress,
        amountInWei,
        minAmountOut,
        deadlineTimestamp,
        { gasLimit }
      );
    }
    
    console.log('[WRAPPER] Swap transaction sent:', { 
      hash: txResponse.hash,
      contractUsed: wrapperAddress
    });
    
    // Wait for confirmation
    const receipt = await txResponse.wait();
    
    console.log('[WRAPPER] Swap confirmed with fee collection:', {
      hash: txResponse.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed?.toString(),
      feeCollected: true // Wrapper automatically collected 0.1%
    });
    
    return {
      hash: txResponse.hash,
      receipt,
      feeCollected: true
    };
    
  } catch (error) {
    const data = error?.data || error?.error?.data;
    const decoded = decodeRevertReason(data);
    console.error('[WRAPPER] Error executing swap:', {
      code: error?.code,
      message: error?.message,
      reason: error?.reason,
      data: data ? String(data).slice(0, 100) : undefined,
      decodedReason: decoded,
      full: error
    });
    
    if (error.code === 4001) {
      throw new Error('Transaction rejected by user');
    }
    if (error.message?.includes('insufficient funds')) {
      throw new Error('Insufficient balance for swap + gas fees');
    }
    if (decoded) {
      throw new Error(`Swap failed: ${decoded}`);
    }
    if (error.reason) {
      throw new Error(`Contract error: ${error.reason}`);
    }
    
    throw error;
  }
}
import { ethers } from 'ethers';

/**
 * Ensures sufficient ERC20 allowance for PancakeSwap router
 * @param {ethers.Signer} signer - Connected wallet signer (ethers v5)
 * @param {string} tokenAddress - ERC20 token contract address
 * @param {string} owner - Wallet address (user)
 * @param {string} spender - Router address (PancakeSwap)
 * @param {BigNumber} amountWei - Amount needed in wei
 * @returns {Promise<boolean>} true if approved/sufficient, false if failed
 */
export const ensureTokenApproval = async (signer, tokenAddress, owner, spender, amountWei) => {
  try {
    console.log('🔍 Checking ERC20 allowance...', { tokenAddress, owner, spender, amount: amountWei.toString() });

    // Standard ERC20 ABI (allowance + approve)
    const erc20Abi = [
      'function allowance(address owner, address spender) view returns (uint256)',
      'function approve(address spender, uint256 amount) returns (bool)',
    ];

    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);

    // Check current allowance
    const currentAllowance = await tokenContract.allowance(owner, spender);
    console.log('📊 Current allowance:', ethers.utils.formatUnits(currentAllowance, 18));

    // If allowance is sufficient, no need to approve
    if (currentAllowance.gte(amountWei)) {
      console.log('✅ Allowance sufficient, no approval needed');
      return true;
    }

    // Request approval for MaxUint256 (unlimited) - ethers v5
    console.log('⚠️ Insufficient allowance, requesting approval...');
    const approveTx = await tokenContract.approve(spender, ethers.constants.MaxUint256);
    
    console.log('⏳ Waiting for approval transaction...', approveTx.hash);
    await approveTx.wait();
    
    console.log('✅ Approval confirmed!');
    return true;
  } catch (error) {
    console.error('❌ Approval failed:', error);
    return false;
  }
};


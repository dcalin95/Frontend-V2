import { ethers } from 'ethers';
import { PANCAKE_ROUTER_ADDRESS } from './swapConfig';

// Minimal ABI
const PANCAKE_ROUTER_ABI = [
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)',
];

export async function executeSwapPancake({
  signer,
  payToken,
  receiveToken,
  amountInWei,
  slippageBps = 50, // 0.5%
}) {
  const router = new ethers.Contract(
    PANCAKE_ROUTER_ADDRESS,
    PANCAKE_ROUTER_ABI,
    signer
  );

  const to = await signer.getAddress();
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  // Native BNB -> Token
  if (payToken.isNative) {
    const path = [payToken.address, receiveToken.address];
    return router.swapExactETHForTokens(
      0,
      path,
      to,
      deadline,
      { value: amountInWei }
    );
  }

  // Token -> Native BNB
  if (receiveToken.isNative) {
    const path = [payToken.address, receiveToken.address];
    return router.swapExactTokensForETH(
      amountInWei,
      0,
      path,
      to,
      deadline
    );
  }

  // Token -> Token
  const path = [payToken.address, receiveToken.address];
  return router.swapExactTokensForTokens(
    amountInWei,
    0,
    path,
    to,
    deadline
  );
}

import { ethers } from 'ethers';
import { ensureBscNetwork } from './networkGuard';
import { executeSwapPancake } from './swapPancake';
import { executeSwapOxium } from './swapOxium';
import { ensureTokenApproval } from './ensureTokenApproval';
import { PROTOCOL_FEE_BPS, ROUTE_MODE_DEFAULT, PANCAKE_ROUTER_ADDRESS } from './swapConfig';

export async function executeSwap({
  provider,
  mode = ROUTE_MODE_DEFAULT,
  payToken,
  receiveToken,
  amountInWei,
  slippageBps,
}) {
  await ensureBscNetwork();

  // 0.001% protocol fee (wrapper-ready) - ethers v5 BigNumber math
  const feeBps = Math.round(PROTOCOL_FEE_BPS * 10);
  const fee = amountInWei.mul(feeBps).div(100000);
  const amountToSwap = amountInWei.sub(fee);

  // ✅ AUTOMATIC ERC20 APPROVAL (REAL mode only, non-native tokens)
  if (!payToken.isNative) {
    const owner = await provider.getAddress();
    const approved = await ensureTokenApproval(
      provider,
      payToken.address,
      owner,
      PANCAKE_ROUTER_ADDRESS,
      amountToSwap
    );

    if (!approved) {
      throw new Error('❌ Token approval failed or was rejected');
    }
  }

  if (mode === 'OXIUM') {
    return executeSwapOxium();
  }

  // AUTO or PANCAKE
  return executeSwapPancake({
    signer: provider,
    payToken,
    receiveToken,
    amountInWei: amountToSwap,
    slippageBps,
  });
}

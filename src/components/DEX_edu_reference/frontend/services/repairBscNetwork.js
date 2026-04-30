/**
 * Repair BSC network (EIP-3085 / EIP-3326)
 * When MetaMask uses a bad custom BSC RPC that breaks eth_sendTransaction,
 * this flow: switch → if 4902 add chain with official RPCs → switch again.
 * @module repairBscNetwork
 */

const BSC_CHAIN_ID_HEX = '0x38';

const BSC_RPC_URLS = [
  'https://bsc-dataseed.bnbchain.org/',
  'https://bsc-dataseed1.bnbchain.org/',
  'https://bsc-dataseed2.bnbchain.org/'
];

const BSC_BLOCK_EXPLORER_URLS = ['https://bscscan.com/'];

/**
 * Repair BSC network in the wallet: switch to BSC, or add with official RPCs if unknown (4902), then switch.
 * Handles user rejection (4001) gracefully.
 * @param {EthereumProvider} ethereum - window.ethereum (or picked provider)
 * @returns {Promise<boolean>} true if repair succeeded (user on BSC with good RPC), false if user rejected or error
 */
export async function repairBscNetwork(ethereum) {
  if (!ethereum?.request) return false;

  // Always call wallet_addEthereumChain first to force-update the RPC URL.
  // If BSC is already added with a bad RPC (e.g. twnodes), wallet_switchEthereumChain
  // alone would return true without fixing the RPC. wallet_addEthereumChain prompts
  // the wallet to add/update BSC with the correct official RPC URLs.
  try {
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: BSC_CHAIN_ID_HEX,
        chainName: 'BNB Smart Chain',
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
        rpcUrls: BSC_RPC_URLS,
        blockExplorerUrls: BSC_BLOCK_EXPLORER_URLS
      }]
    });
  } catch (addError) {
    if (addError?.code === 4001) return false;
    // Some wallets reject wallet_addEthereumChain for existing chains – fall through to switch.
    console.warn('[repairBscNetwork] addChain failed, trying switch', addError?.message);
  }

  // Switch to BSC after add/update.
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BSC_CHAIN_ID_HEX }]
    });
    return true;
  } catch (switchError) {
    if (switchError?.code === 4001) return false;
    console.warn('[repairBscNetwork] switch failed', switchError?.message);
    return false;
  }
}

/** Recommended RPC URL for manual copy (e.g. MetaMask Settings → Networks → BSC → RPC URL) */
const BSC_RPC_RECOMMENDED = BSC_RPC_URLS[0];

export { BSC_CHAIN_ID_HEX, BSC_RPC_URLS, BSC_RPC_RECOMMENDED };

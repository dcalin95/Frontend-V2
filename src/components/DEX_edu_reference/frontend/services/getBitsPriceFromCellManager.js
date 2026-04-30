/**
 * Preț BITS din CellManager.sol (Presale) – ultima celulă Open.
 * Contract deployat pe BSC: getCurrentOpenCellId() → getCell(cellId) → standardPrice (millicents) / 1000 = USD.
 */
const CELL_MANAGER_ADDRESS = process.env.REACT_APP_CELL_MANAGER || '0x957B858cc0684c8a91ec3C7f8A9E3DA2Df9F3bC6';
const BSC_RPC = 'https://bsc-dataseed1.binance.org';
const CELL_MANAGER_ABI = [
  'function getCurrentOpenCellId() view returns (uint256)',
  'function getCell(uint256 cellId) view returns (tuple(bool defined, uint8 cellState, uint256 standardPrice, uint256 privilegedPrice, uint256 sold, uint256 supply))'
];

export default async function getBitsPriceFromCellManager() {
  try {
    const { ethers } = await import('ethers');
    const provider = new ethers.providers.JsonRpcProvider(BSC_RPC);
    const contract = new ethers.Contract(CELL_MANAGER_ADDRESS, CELL_MANAGER_ABI, provider);
    let cellId = await contract.getCurrentOpenCellId();
    cellId = cellId.toString();
    let cell = await contract.getCell(cellId);
    let defined = cell.defined;
    let standardPriceRaw = cell.standardPrice;
    if (!defined || (cell.supply.toString() === '0' && cell.sold.toString() === '0')) {
      const id = parseInt(cellId, 10);
      for (let i = id - 1; i >= 0; i--) {
        try {
          const prev = await contract.getCell(i);
          if (prev.defined && (prev.supply.toString() !== '0' || prev.sold.toString() !== '0')) {
            standardPriceRaw = prev.standardPrice;
            break;
          }
        } catch (_) {}
      }
    }
    const standardPrice = parseFloat((Number(standardPriceRaw.toString()) / 1000).toFixed(6));
    return standardPrice > 0 ? standardPrice : 0;
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[getBitsPriceFromCellManager]', e?.message || e);
    }
    return 0;
  }
}

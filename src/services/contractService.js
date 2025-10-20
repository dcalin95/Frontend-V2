// 🎯 CONTRACT SERVICE
// Serviciu pentru interacțiunea cu contractul CellManager

import { ethers } from 'ethers';

// ABI pentru funcțiile de citire din CellManager
const CELL_MANAGER_ABI = [
  "function getCurrentOpenCellPrice(address wallet) external view returns (uint256)",
  "function getCurrentOpenCellId() external view returns (uint256)",
  "function getCurrentBitsPriceUSD(address wallet) external view returns (uint256)",
  "function getCell(uint256 cellId) external view returns (bool defined, uint8 cellState, uint256 standardPrice, uint256 privilegedPrice, uint256 sold, uint256 supply)",
  "function getTotalSoldInCell(uint256 cellId) external view returns (uint256)",
  "function getRemainingSupply(uint256 cellId) external view returns (uint256)",
  "function getCellStatus(uint256 cellId) external view returns (uint8)"
];

class ContractService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.contractAddress = null;
    this.isInitialized = false;
  }

  // 🎯 Inițializează serviciul cu provider și adresa contractului
  async initialize(provider, contractAddress) {
    try {
      this.provider = provider;
      this.contractAddress = contractAddress;
      this.contract = new ethers.Contract(contractAddress, CELL_MANAGER_ABI, provider);
      this.isInitialized = true;
      
      console.log('✅ ContractService initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing ContractService:', error);
      return false;
    }
  }

  // 🎯 Verifică dacă serviciul este inițializat
  checkInitialized() {
    if (!this.isInitialized || !this.contract) {
      throw new Error('ContractService is not initialized. Call initialize() first.');
    }
  }

  // 🎯 Obține prețul curent pentru o adresă (în USD * 1000)
  async getCurrentPrice(walletAddress) {
    try {
      this.checkInitialized();
      
      const price = await this.contract.getCurrentBitsPriceUSD(walletAddress);
      return {
        price: price.toString(),
        priceUSD: this.convertToUSD(price.toString()),
        success: true
      };
    } catch (error) {
      console.error('❌ Error getting price:', error);
      return {
        price: '0',
        priceUSD: 0,
        success: false,
        error: error.message
      };
    }
  }

  // 🎯 Obține ID-ul celulei deschise
  async getCurrentCellId() {
    try {
      this.checkInitialized();
      
      const cellId = await this.contract.getCurrentOpenCellId();
      return {
        cellId: cellId.toString(),
        success: true
      };
    } catch (error) {
      console.error('❌ Error getting cell ID:', error);
      return {
        cellId: '0',
        success: false,
        error: error.message
      };
    }
  }

  // 🎯 Obține toate datele unei celule
  async getCellData(cellId) {
    try {
      this.checkInitialized();
      
      const cell = await this.contract.getCell(cellId);
      const sold = await this.contract.getTotalSoldInCell(cellId);
      const remaining = await this.contract.getRemainingSupply(cellId);
      
      return {
        cell: {
          defined: cell.defined,
          cellState: cell.cellState.toString(),
          standardPrice: cell.standardPrice.toString(),
          privilegedPrice: cell.privilegedPrice.toString(),
          sold: sold.toString(),
          supply: cell.supply.toString(),
          remaining: remaining.toString()
        },
        success: true
      };
    } catch (error) {
      console.error('❌ Error getting cell data:', error);
      return {
        cell: null,
        success: false,
        error: error.message
      };
    }
  }

  // 🎯 Obține datele complete ale celulei curente
  async getCurrentCellData(walletAddress) {
    try {
      const cellIdResult = await this.getCurrentCellId();
      if (!cellIdResult.success) {
        return cellIdResult;
      }

      const cellData = await this.getCellData(cellIdResult.cellId);
      if (!cellData.success) {
        return cellData;
      }

      const priceResult = await this.getCurrentPrice(walletAddress);
      
      return {
        cellId: cellIdResult.cellId,
        cell: cellData.cell,
        price: priceResult.price,
        priceUSD: priceResult.priceUSD,
        success: true
      };
    } catch (error) {
      console.error('❌ Error getting current cell data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 🎯 Convert price from USD * 1000 to normal USD
  convertToUSD(priceInMillicents) {
    try {
      const price = parseFloat(priceInMillicents);
      return price / 1000; // Convert from millicents to USD
    } catch (error) {
      console.error('❌ Error converting price:', error);
      return 0;
    }
  }

  // 🎯 Convert price from USD to USD * 1000 (for contract)
  convertToMillicents(priceUSD) {
    try {
      const price = parseFloat(priceUSD);
      return Math.floor(price * 1000); // Convert to millicents
    } catch (error) {
      console.error('❌ Error converting price:', error);
      return 0;
    }
  }

  // 🎯 Verifică dacă o adresă are acces privilegiat
  async checkPrivilegedAccess(walletAddress) {
    try {
      this.checkInitialized();
      
      // Get prices for comparison
      const standardPrice = await this.contract.getCurrentBitsPriceUSD("0x0000000000000000000000000000000000000000");
      const userPrice = await this.contract.getCurrentBitsPriceUSD(walletAddress);
      
      // If user price is different from standard price, they have privileged access
      return {
        isPrivileged: !standardPrice.eq(userPrice),
        standardPrice: standardPrice.toString(),
        userPrice: userPrice.toString(),
        success: true
      };
    } catch (error) {
      console.error('❌ Error checking privileged access:', error);
      return {
        isPrivileged: false,
        success: false,
        error: error.message
      };
    }
  }
}

// Exportăm o instanță singleton
const contractService = new ContractService();
export default contractService; 
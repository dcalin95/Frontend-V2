import { ethers } from "ethers";

// Rețele care suportă ENS
const ENS_SUPPORTED_NETWORKS = [
  1,   // Ethereum Mainnet
  3,   // Ropsten
  4,   // Rinkeby
  5,   // Goerli
  10,  // Optimism
  137, // Polygon
  42161, // Arbitrum
];

// Funcție pentru a crea un provider configurat corect
export const createConfiguredProvider = (ethereumProvider) => {
  const provider = new ethers.providers.Web3Provider(ethereumProvider);
  
  // Override getResolver pentru a evita erorile ENS pe rețelele care nu îl suportă
  const originalGetResolver = provider.getResolver.bind(provider);
  
  provider.getResolver = async (name) => {
    try {
      const network = await provider.getNetwork();
      
      // Dacă rețeaua nu suportă ENS, return null în loc să arunce eroare
      if (!ENS_SUPPORTED_NETWORKS.includes(network.chainId)) {
        console.log(`ENS not supported on network ${network.chainId} (${network.name})`);
        return null;
      }
      
      // Dacă rețeaua suportă ENS, folosește funcția originală
      return await originalGetResolver(name);
    } catch (error) {
      console.warn("Error getting ENS resolver:", error);
      return null;
    }
  };
  
  return provider;
};

// Funcție pentru a verifica dacă o rețea suportă ENS
export const isENSSupported = (chainId) => {
  return ENS_SUPPORTED_NETWORKS.includes(chainId);
}; 
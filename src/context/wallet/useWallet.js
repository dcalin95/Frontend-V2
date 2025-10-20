import { useState } from "react";
import { connectEVMWallet, useSolanaConnection } from "./WalletConnector";

export const useWallet = () => {
  const [wallet, setWallet] = useState(null); // Starea pentru wallet-ul conectat
  const [error, setError] = useState(null); // Starea pentru erori
  const { connectSolanaWallet, solanaWallet } = useSolanaConnection(); // Hook-ul Solana

  /**
   * Conectează wallet-ul în funcție de tip (EVM sau Solana).
   * @param {string} type - Tipul wallet-ului ("EVM" sau "Solana").
   */
  const connectWallet = async (type) => {
    setError(null); // Resetează eroarea la fiecare nouă încercare
    try {
      let walletData = null;

      if (type === "EVM") {
        // Conectare pentru EVM wallet-uri (MetaMask, Coinbase etc.)
        walletData = await connectEVMWallet();
      } else if (type === "Solana") {
        // Verifică dacă wallet-ul Solana este conectat
        if (!solanaWallet.connected) {
          throw new Error("Please connect your Solana wallet first!");
        }
        walletData = await connectSolanaWallet();
      } else {
        throw new Error(`Unsupported wallet type: ${type}`);
      }

      setWallet(walletData); // Actualizează starea cu datele wallet-ului
    } catch (err) {
      setError(err.message); // Setează mesajul de eroare
    }
  };

  /**
   * Deconectează wallet-ul curent și resetează starea.
   */
  const disconnectWallet = () => {
    setWallet(null);
    setError(null);
  };

  return { wallet, connectWallet, disconnectWallet, error };
};


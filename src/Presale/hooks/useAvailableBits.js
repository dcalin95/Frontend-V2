import { useEffect, useState } from "react";
import { getContractInstance } from "../../contract/getContract";

const useAvailableBits = () => {
  const [availableBits, setAvailableBits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableBits = async () => {
      setLoading(true);

      try {
        const selectedToken = localStorage.getItem('selectedToken'); // sau ia-l din context dacă ai
        if (selectedToken === "SOL") {
          console.log("🛠️ SOL payment detected. Setting availableBits to 1,000,000 fallback");
          setAvailableBits(1000000); // ➡️ Fallback la 1 milion BITS pentru SOL
          setLoading(false);
          return;
        }

        // 🛑 CRITICAL FIX: Use read-only mode (needsSigner = false)
        // This prevents Phantom/MetaMask from opening a popup on mount
        const contract = await getContractInstance("CELL_MANAGER", false);
        const cellId = await contract.getCurrentOpenCellId();
        const remaining = await contract.getRemainingSupply(cellId);

        const formatted = parseFloat(remaining.toString());
        setAvailableBits(formatted);

        console.log(
          `%c✅ CELL_MANAGER available BITS: ${formatted} (cellId: ${cellId})`,
          "color: limegreen; font-weight: bold;"
        );
      } catch (err) {
        console.error("❌ Failed to fetch available BITS from CELL_MANAGER:", err);
        setAvailableBits(0);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableBits();
    
    // 🛑 CRITICAL FIX: Only add listeners if window.ethereum is REAL MetaMask
    // This prevents Phantom from being triggered by listener attachment
    const isMetaMask = typeof window !== 'undefined' && window.ethereum?.isMetaMask && !window.ethereum?.isPhantom;
    
    if (isMetaMask) {
      window.ethereum?.on("chainChanged", fetchAvailableBits);
      window.ethereum?.on("accountsChanged", fetchAvailableBits);
    }

    return () => {
      if (isMetaMask) {
        window.ethereum?.removeListener("chainChanged", fetchAvailableBits);
        window.ethereum?.removeListener("accountsChanged", fetchAvailableBits);
      }
    };
  }, []);

  return { availableBits, loading };
};

export default useAvailableBits;

import { useEffect, useState } from "react";
import { ethers } from "ethers";
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

        const contract = await getContractInstance("CELL_MANAGER");
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

    window.ethereum?.on("chainChanged", fetchAvailableBits);
    window.ethereum?.on("accountsChanged", fetchAvailableBits);

    return () => {
      window.ethereum?.removeListener("chainChanged", fetchAvailableBits);
      window.ethereum?.removeListener("accountsChanged", fetchAvailableBits);
    };
  }, []);

  return { availableBits, loading };
};

export default useAvailableBits;

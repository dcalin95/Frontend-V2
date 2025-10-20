import { useEffect, useState } from "react";
import { getContractInstance } from "../../contract/getContract";

const useAvailableBits = () => {
  const [availableBits, setAvailableBits] = useState(1_000_000); // fallback default
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailable = async () => {
      try {
        const contract = await getContractInstance("NODE");
        const currentCellId = await contract.getCurrentOpenCellId();
        const remaining = await contract.getRemainingSupply(currentCellId);

        setAvailableBits(Number(remaining.toString()));
      } catch (error) {
        console.error("❌ Failed to fetch available BITS:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailable();
  }, []);

  return { availableBits, loading };
};

export default useAvailableBits;


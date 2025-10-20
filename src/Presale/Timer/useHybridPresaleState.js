import { useState, useEffect } from "react";
import { default as axios } from "axios";
import useCellManagerData from "../hooks/useCellManagerData";

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";

export const useHybridPresaleState = () => {
  const [databaseState, setDatabaseState] = useState({
    sold: 0,
    supply: 0,
    totalSupply: 0,
    progress: 0,
    totalBoosted: 0,
    endTime: null,
    startTime: null,
    roundActive: false
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Get CellManager data (price + round)
  const cellManagerData = useCellManagerData();

  // Fetch database data (sold + supply + progress)
  useEffect(() => {
    const fetchDatabaseData = async () => {
      try {
        console.log('🔄 [HYBRID] Fetching database data...');
        const data = await axios.get(`${API_URL}/api/presale/current`);
        console.log('📦 [HYBRID] Database Response:', data.data);

        if (data.data) {
          const dbData = data.data;
          const now = Date.now();
          const serverEndTime = dbData.endTime * 1000;
          const serverStartTime = dbData.startTime * 1000;

          setDatabaseState({
            sold: dbData.sold || 0,
            supply: (dbData.totalSupply || 0) - (dbData.sold || 0),
            totalSupply: dbData.totalSupply || 0,
            progress: dbData.progress || 0,
            totalBoosted: dbData.totalBoosted || 0,
            endTime: serverEndTime,
            startTime: serverStartTime,
            roundActive: true
          });
        }

        setIsLoaded(true);
        setError(null);
      } catch (err) {
        console.error('❌ [HYBRID] Error fetching database data:', err);
        if (err.response?.status === 404) {
          setDatabaseState(prev => ({ ...prev, roundActive: false }));
        } else {
          setError(err.message);
        }
        setIsLoaded(true);
      }
    };

    fetchDatabaseData();
    const interval = setInterval(fetchDatabaseData, 60000);

    return () => clearInterval(interval);
  }, []);

  // Combine CellManager + Database data
  const hybridState = {
    // 📊 FROM CELLMANAGER (Blockchain) - PRIORITY
    price: cellManagerData.currentPrice && !cellManagerData.loading && cellManagerData.currentPrice > 0 ? 
           Math.round(cellManagerData.currentPrice * 100) : 
           6, // Fallback to $0.06 if CellManager not configured
    roundNumber: cellManagerData.roundNumber && !cellManagerData.loading && cellManagerData.roundNumber > 0 ? 
                 cellManagerData.roundNumber : 
                 2, // 🎯 FIX: Use current CellManager round (Cell ID 1 = Round 2)
    
    // 💾 FROM DATABASE (Simulations)
    sold: databaseState.sold,
    supply: databaseState.supply,
    totalSupply: databaseState.totalSupply,
    progress: databaseState.progress,
    totalBoosted: databaseState.totalBoosted,
    endTime: databaseState.endTime,
    startTime: databaseState.startTime,
    
    // 🔧 COMPUTED VALUES
    roundActive: !cellManagerData.loading && (cellManagerData.roundNumber > 0 || databaseState.roundActive),
    totalRounds: 12,
    serverTimeOffset: 0,
    
    // 🎯 ADDITIONAL DATA
    cellManagerData: cellManagerData,
    databaseState: databaseState
  };

  console.log('🔄 [HYBRID] Combined State:', {
    cellManagerLoading: cellManagerData.loading,
    cellManagerPrice: cellManagerData.currentPrice,
    cellManagerRound: cellManagerData.roundNumber,
    databaseLoaded: isLoaded,
    finalPrice: hybridState.price,
    finalRoundNumber: hybridState.roundNumber,
    sold: hybridState.sold,
    supply: hybridState.supply,
    totalSupply: hybridState.totalSupply,
    roundActive: hybridState.roundActive
  });
  
  console.log('🚨 [HYBRID FIX] Round number source:', {
    fromCellManager: cellManagerData.roundNumber,
    cellManagerLoading: cellManagerData.loading,
    finalUsed: hybridState.roundNumber,
    shouldUseFromCellManager: cellManagerData.roundNumber && !cellManagerData.loading && cellManagerData.roundNumber > 0
  });

  return {
    ...hybridState,
    isLoaded: isLoaded && !cellManagerData.loading,
    error: error || cellManagerData.error
  };
};

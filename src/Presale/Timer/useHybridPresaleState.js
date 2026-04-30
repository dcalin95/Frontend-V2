import { useState, useEffect, useMemo } from "react";
import { default as axios } from "axios";
import { getPresaleCurrentUrl, parseLaunchPowerUsd } from "../presaleApi";
import { useCellManager } from "../../context/CellManagerContext"; // ✅ Use Context

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

  const cellManagerData = useCellManager();

  useEffect(() => {
    const fetchDatabaseData = async () => {
      try {
        console.log('🔄 [HYBRID] Fetching database data...');
        const data = await axios.get(await getPresaleCurrentUrl(), { timeout: 25000 });
        console.log('📦 [HYBRID] Database Response:', data.data);

        if (data.data) {
          const dbData = data.data;
          const serverEndTime = dbData.endTime * 1000;
          const serverStartTime = dbData.startTime * 1000;

          setDatabaseState({
            sold: dbData.sold || 0,
            supply: (dbData.totalSupply || 0) - (dbData.sold || 0),
            totalSupply: dbData.totalSupply || 0,
            progress: dbData.progress || 0,
            totalBoosted: Number.isFinite(parseLaunchPowerUsd(dbData)) ? parseLaunchPowerUsd(dbData) : 0,
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
          setError(null);
        } else {
          setError(err.message || "Presale API error");
        }
        setIsLoaded(true);
      }
    };

    fetchDatabaseData();
    const interval = setInterval(fetchDatabaseData, 60000);

    return () => clearInterval(interval);
  }, []);

  const hybridState = useMemo(() => {
    const boosted = Number(databaseState.totalBoosted || 0);

    return {
    // 📊 Preț / rundă pentru UX: încă din CellManager (contract); agregatele monetare = doar API mai sus
    price: cellManagerData.currentPrice && !cellManagerData.loading && cellManagerData.currentPrice > 0 ?
           Math.round(cellManagerData.currentPrice * 100) :
           6,
    roundNumber: cellManagerData.roundNumber && !cellManagerData.loading && cellManagerData.roundNumber > 0 ?
                 cellManagerData.roundNumber :
                 2,

    sold: databaseState.sold,
    supply: databaseState.supply,
    totalSupply: databaseState.totalSupply,
    progress: databaseState.progress,
    totalBoosted: boosted,
    endTime: databaseState.endTime,
    startTime: databaseState.startTime,

    roundActive: !cellManagerData.loading && (cellManagerData.roundNumber > 0 || databaseState.roundActive),
    totalRounds: 12,
    serverTimeOffset: 0,

    cellManagerData: cellManagerData,
    databaseState: databaseState
    };
  }, [cellManagerData, databaseState]);

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

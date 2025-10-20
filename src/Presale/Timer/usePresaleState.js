import { useState, useEffect } from "react";
import { default as axios } from "axios";
import contractService from "../../services/contractService";
import cachedFetch, { rateLimitConfig, requestLimiter } from "../../utils/requestCache.js";

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";

export const usePresaleState = () => {
  const [state, setState] = useState({
    endTime: null,
    startTime: null,
    sold: 0,
    supply: 0,
    totalSupply: 0,
    price: 1,
    progress: 0,
    totalBoosted: 0,
    roundActive: false,
    roundNumber: 1,
    totalRounds: 12,
    serverTimeOffset: 0, // ✅ offset default
    
    // 🎯 NOI CÂMPURI PENTRU CONTROLUL DURATEI
    roundDuration: {
      shouldEnd: false,
      endReason: null,
      daysElapsed: 0,
      daysRemaining: 14,
      salesEfficiency: 100,
      recommendations: []
    },
    
    // 🎯 ANALIZA VÂNZĂRILOR (PREȚ FIX DIN SMART CONTRACT)
    salesAnalysis: {
      currentPrice: 0,
      adjustmentFactor: 1,
      actualSalesRate: 0,
      targetSalesRate: 0,
      recommendation: null
    },

    // 🎯 DATE DIN CONTRACT
    contractData: null
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPresaleData = async () => {
      try {
        console.log('🔄 Fetching presale data...');
        const data = await cachedFetch.get(`${API_URL}/api/presale/current`, {
          cacheTTL: rateLimitConfig.presaleData
        });
        console.log('📦 Raw API Response:', data);

        if (data) {
          const now = Date.now();
          const serverEndTime = data.endTime * 1000;
          const serverStartTime = data.startTime * 1000;

          // ✅ Calculează offset între timpul serverului și client
          const serverTimeOffset = serverEndTime - (data.endTime * 1000); // poate fi 0, dar îl păstrăm pt flexibilitate

          const newState = {
            endTime: serverEndTime,
            startTime: serverStartTime,
            sold: data.sold || 0,
            supply: (data.totalSupply || 0) - (data.sold || 0),
            totalSupply: data.totalSupply || 0,
            price: data.price || 0.01,
            progress: data.progress || 0,
            totalBoosted: data.totalBoosted || 0,
            roundActive: true, // Always active - no round limit
            roundNumber: data.roundNumber || 1,
            totalRounds: 12,
            serverTimeOffset, // ✅ adăugat
            
            // 🎯 NOI CÂMPURI PENTRU CONTROLUL DURATEI
            roundDuration: data.roundDuration || {
              shouldEnd: false,
              endReason: null,
              daysElapsed: 0,
              daysRemaining: 14,
              salesEfficiency: 100,
              recommendations: []
            },
            
            // 🎯 ANALIZA VÂNZĂRILOR (PREȚ FIX DIN SMART CONTRACT)
            salesAnalysis: data.salesAnalysis || {
              currentPrice: 0,
              adjustmentFactor: 1,
              actualSalesRate: 0,
              targetSalesRate: 0,
              recommendation: null
            },

            // 🎯 DATE DIN CONTRACT
            contractData: data.contractData || null,
            
            // 🚨 TIMER STATUS
            timerExpired: data.timerExpired || false
          };

          console.log('📊 New State:', newState);
          setState(newState);
        }

        setIsLoaded(true);
        setError(null);
      } catch (err) {
        console.error('❌ Error fetching presale data:', err);
        if (err.response?.status === 404) {
          setState(prev => ({ ...prev, roundActive: false }));
        } else {
          setError(err.message);
        }
        setIsLoaded(true);
      }
    };

    fetchPresaleData();
    const interval = setInterval(fetchPresaleData, 60000); // ← Crescut de la 15s la 60s pentru a reduce flood-ul

    return () => clearInterval(interval);
  }, []);

  return {
    ...state,
    isLoaded,
    error
  };
};

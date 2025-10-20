import { useState, useCallback } from 'react';

export const useMindAI = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const analyzeText = useCallback(async (text) => {
    setAnalyzing(true);
    // Simulare analiză AI
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockResults = {
      sentiment: Math.random() > 0.5 ? 'positive' : 'neutral',
      keywords: text.split(' ').slice(0, 5),
      wordCount: text.split(' ').length
    };
    
    setResults(mockResults);
    setAnalyzing(false);
    return mockResults;
  }, []);

  return { analyzeText, analyzing, results };
};












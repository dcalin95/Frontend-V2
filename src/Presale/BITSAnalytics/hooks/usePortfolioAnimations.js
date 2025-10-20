import { useState, useEffect } from "react";

export const usePortfolioAnimations = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);

  useEffect(() => {
    // Trigger visibility animation
    setIsVisible(true);
    
    // Setup pulse animation
    const pulseTimer = setInterval(() => {
      setPulseEffect(prev => !prev);
    }, 3000);

    return () => clearInterval(pulseTimer);
  }, []);

  return {
    isVisible,
    pulseEffect
  };
};




import { useState, useEffect } from "react";

/**
 * Hook care calculează valoarea boostată în USD a BITS vânduți,
 * în funcție de timpul scurs de la startul presale-ului.
 *
 * @param {number} sold - Numărul total de BITS vânduți
 * @param {number} price - Prețul per BITS în centi (ex: 1 = 0.01 USD)
 * @param {number} saleStart - Timestamp UNIX (secunde) când a început presale-ul
 * @returns {[number]} - Valoarea boostată în USD
 */
export const useBoostedUSD = (sold, price, saleStart) => {
  const [boostedUSD, setBoostedUSD] = useState(0);

  useEffect(() => {
    const calculateBoost = () => {
      const now = Math.floor(Date.now() / 1000);
      if (!saleStart || saleStart >= now) return setBoostedUSD(0);

      const elapsedRealSeconds = now - saleStart;

      // Simulăm că 1 zi = 5 secunde reale
      const simulatedDays = elapsedRealSeconds / 5;

      let multiplier = 1;

      if (simulatedDays <= 98) {
        multiplier += simulatedDays * 0.1;
      } else if (simulatedDays <= 168) {
        multiplier += (98 * 0.1) + ((simulatedDays - 98) * 0.05);
      } else {
        multiplier += (98 * 0.1) + (70 * 0.05) + ((simulatedDays - 168) * 0.01);
      }

      const cappedMultiplier = Math.min(multiplier, 2.5); // limită de boost

      const value = sold * (price / 100) * cappedMultiplier;
      setBoostedUSD(value);
    };

    calculateBoost();
    const interval = setInterval(calculateBoost, 1000);

    return () => clearInterval(interval);
  }, [sold, price, saleStart]);

  return [boostedUSD];
};

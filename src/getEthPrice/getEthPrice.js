// utils/getEthPrice.js

/**
 * Fetches the current ETH price in USD.
 * @returns {Promise<number>} - The current ETH price in USD or a fallback value.
 */
export const getEthPrice = async () => {
  const fallbackPrice = 0; // Fallback value in case of error
  const coingeckoAPI = "https://api.coingecko.com/api/v3/simple/price";

  try {
    const controller = new AbortController(); // Pentru timeout
    const timeout = setTimeout(() => controller.abort(), 5000); // Timeout de 5 secunde

    const response = await fetch(`${coingeckoAPI}?ids=ethereum&vs_currencies=usd`, {
      signal: controller.signal,
    });

    clearTimeout(timeout); // Anulăm timeout-ul dacă răspunsul este primit la timp

    if (!response.ok) {
      console.error("Server responded with an error:", response.status, response.statusText);
      return fallbackPrice; // Returnăm fallback-ul în caz de eroare
    }

    const data = await response.json();

    // Verificăm dacă există datele necesare
    const ethPrice = data?.ethereum?.usd;
    if (typeof ethPrice === "number" && ethPrice > 0) {
      return ethPrice;
    } else {
      console.warn("Unexpected API response format or invalid price:", data);
      return fallbackPrice; // Returnăm fallback-ul dacă structura nu este corectă
    }
  } catch (error) {
    // Gestionarea erorilor
    if (error.name === "AbortError") {
      console.error("Request timed out");
    } else {
      console.error("Error fetching ETH price:", error.message);
    }

    console.warn("Returning fallback price due to an error.");
    return fallbackPrice; // Returnăm fallback-ul în caz de eroare
  }
};


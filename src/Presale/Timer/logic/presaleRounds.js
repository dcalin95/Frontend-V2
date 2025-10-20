// src/Presale/Timer/logic/presaleRounds.js

export async function fetchPresaleState() {
  const API_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
  try {
    const res = await fetch(`${API_URL}/api/presale/current`);
    if (!res.ok) throw new Error("Failed to fetch presale state");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("❌ Error fetching presale round:", err.message);
    return null;
  }
}

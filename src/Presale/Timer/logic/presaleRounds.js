// src/Presale/Timer/logic/presaleRounds.js
import { getPresaleCurrentUrl } from "../../presaleApi";

export async function fetchPresaleState() {
  try {
    const res = await fetch(await getPresaleCurrentUrl(), { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch presale state");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("❌ Error fetching presale round:", err.message);
    return null;
  }
}

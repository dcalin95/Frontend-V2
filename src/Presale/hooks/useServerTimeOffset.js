import { useState, useEffect } from "react";

export default function useServerTimeOffset() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const res = await fetch("/api/server-time");
        const data = await res.json();

        const clientNow = Date.now();
        const serverNow = data.serverTime;

        setOffset(serverNow - clientNow);
      } catch (err) {
        console.error("❌ Failed to fetch server time:", err.message);
      }
    };

    fetchServerTime();
  }, []);

  return offset;
}

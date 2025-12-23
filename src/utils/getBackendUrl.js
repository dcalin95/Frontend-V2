export function getBackendUrl() {
  // Prefer explicit env var
  const envUrl = (process.env.REACT_APP_BACKEND_URL || "").trim();
  if (envUrl) return envUrl;

  // Smart default: local dev should use local backend
  try {
    if (typeof window !== "undefined") {
      const host = window.location?.hostname || "";
      if (host === "localhost" || host === "127.0.0.1") {
        return "http://localhost:4000";
      }
    }
  } catch (_) {}

  // Fallback: production backend
  return "https://backend-server-f82y.onrender.com";
}



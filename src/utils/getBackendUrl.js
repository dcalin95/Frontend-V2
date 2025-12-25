export function getBackendUrl() {
  // Prefer explicit env var
  const envUrl = (process.env.REACT_APP_BACKEND_URL || "").trim();
  if (envUrl) return envUrl;

  // Default to production backend. If you want to use a local backend, set REACT_APP_BACKEND_URL=http://localhost:4000
  return "https://backend-server-f82y.onrender.com";
}



import { getBackendUrl } from "../config/apiEndpoints";

const FALLBACK_BACKEND_URL = "https://backend-server-eu.onrender.com";
const BROKEN_BACKEND_HOSTS = ["backend-server-f82y.onrender.com"];

function cleanBackendUrl(url) {
  const value = String(url || "").trim();
  if (!/^https?:\/\//.test(value)) return "";
  return value.replace(/\/$/, "");
}

function isKnownBrokenBackend(url) {
  return BROKEN_BACKEND_HOSTS.some((host) => String(url || "").includes(host));
}

export async function resolvePresaleBackendUrl() {
  try {
    const res = await fetch("/runtime-config.json", {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

    if (res.ok) {
      const config = await res.json().catch(() => null);
      const runtimeUrl = cleanBackendUrl(config?.BACKEND_URL);
      if (runtimeUrl && !isKnownBrokenBackend(runtimeUrl)) {
        return runtimeUrl;
      }
    }
  } catch (_) {
    // Runtime config is optional in development.
  }

  const configuredUrl = cleanBackendUrl(getBackendUrl());
  if (configuredUrl && !isKnownBrokenBackend(configuredUrl)) {
    return configuredUrl;
  }

  return FALLBACK_BACKEND_URL;
}

export function parseLaunchPowerUsd(data) {
  if (!data || typeof data !== "object") return NaN;

  const candidates = [
    data.totalBoosted,
    data.totalRaised,
    data.total_raised_usd,
    data.launchPowerRaised,
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value)) return value;
  }

  return NaN;
}

export async function getPresaleCurrentUrl() {
  const backendUrl = await resolvePresaleBackendUrl();
  return `${backendUrl}/api/presale/current`;
}

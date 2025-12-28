import React, { useCallback } from "react";
import { useLocation } from "react-router-dom";
import PresaleCopilot from "../Presale/components/PresaleCopilot";

const GlobalPresaleCopilot = () => {
  const location = useLocation();
  const path = String(location?.pathname || "");

  const openPresale = useCallback(() => {
    try {
      window.location.hash = "#/presale";
    } catch (_) {}
  }, []);

  // Avoid duplicate Copilot on Presale pages (they already render the full Copilot with layout spacing).
  if (path.startsWith("/presale")) return null;

  return (
    <PresaleCopilot
      selectedToken={null}
      selectedChain={null}
      onScrollToPayment={openPresale}
      enableBodyClasses={false}
      defaultOpen={false}
      variant="global"
    />
  );
};

export default GlobalPresaleCopilot;



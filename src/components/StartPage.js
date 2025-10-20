// 🚀 StartPage – afișează direct BitPulse Orbit Dashboard ca pagină de start
import React, { useEffect, useRef } from "react";

// Componenta principală a dashboard-ului
import LaserOrbit from "./Education/LaserOrbit";

const StartPage = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const tryClick = () => {
      const root = containerRef.current;
      if (!root) return false;
      const bitsEl = root.querySelector('.bits-comet');
      if (bitsEl && typeof window !== 'undefined') {
        const evt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
        bitsEl.dispatchEvent(evt);
        return true;
      }
      return false;
    };
    if (tryClick()) return;
    const t1 = setTimeout(tryClick, 350);
    const t2 = setTimeout(tryClick, 1000);
    const obs = new MutationObserver(() => tryClick());
    if (containerRef.current) obs.observe(containerRef.current, { childList: true, subtree: true });
    return () => { clearTimeout(t1); clearTimeout(t2); obs.disconnect(); };
  }, []);

  return (
    <div className="start-page-container" ref={containerRef}>
      <LaserOrbit variant="ecosystem" />
    </div>
  );
};

export default StartPage;



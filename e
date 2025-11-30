[1mdiff --git a/src/components/DEX/DEX.css b/src/components/DEX/DEX.css[m
[1mindex e50b1f4..df4399f 100644[m
[1m--- a/src/components/DEX/DEX.css[m
[1m+++ b/src/components/DEX/DEX.css[m
[36m@@ -18,28 +18,6 @@[m
 [m
 * { box-sizing: border-box; margin: 0; padding: 0; }[m
 [m
[31m-/* ═══════════════════════════════════════════════════════════════════[m
[31m-   ICON ALIGNMENT & CONSISTENCY - Perfect Pixel Alignment[m
[31m-   ═══════════════════════════════════════════════════════════════════ */[m
[31m-svg {[m
[31m-  display: block;[m
[31m-  vertical-align: middle;[m
[31m-  flex-shrink: 0;[m
[31m-}[m
[31m-[m
[31m-button svg,[m
[31m-a svg,[m
[31m-span svg,[m
[31m-div svg {[m
[31m-  pointer-events: none;[m
[31m-}[m
[31m-[m
[31m-img {[m
[31m-  display: block;[m
[31m-  max-width: 100%;[m
[31m-  height: auto;[m
[31m-}[m
[31m-[m
 body {[m
   background-color: var(--bg-dark);[m
   color: var(--text-color);[m
[36m@@ -57,12 +35,6 @@[m [mbody {[m
   overflow: hidden;[m
 }[m
 [m
[31m-/* Allow fullscreen chart to escape grid container */[m
[31m-body.chart-fullscreen-active .dex-page-container {[m
[31m-  position: static !important;[m
[31m-  overflow: visible !important;[m
[31m-}[m
[31m-[m
 /* ═══════════════════════════════════════════════════════════════════[m
    COSMIC REACTOR LOADER (AI REFACTORED)[m
    ═══════════════════════════════════════════════════════════════════ */[m
[36m@@ -788,25 +760,19 @@[m [mbody.chart-fullscreen-active .dex-page-container {[m
 }[m
 [m
 /* ═══════════════════════════════════════════════════════════════════[m
[31m-   TRADING AREA LAYOUT - FLEX PROPORTIONAL[m
[32m+[m[32m   TRADING AREA LAYOUT (VERTICAL FLEX FOR DYNAMIC HEIGHT)[m
    ═══════════════════════════════════════════════════════════════════ */[m
 .dex-trading-area {[m
   display: flex;[m
   flex-direction: column;[m
   height: 100%;[m
[31m-  flex: 1;[m
[31m-  min-height: 0;[m
[31m-  gap: 16px;[m
[32m+[m[32m  flex: 1; /* Ensure it takes available space */[m
[32m+[m[32m  min-height: 0; /* Critical for nested flex scrolling */[m
[32m+[m[32m  gap: 8px;[m
   width: 100%;[m
[31m-  overflow-y: auto;[m
[32m+[m[32m  overflow-y: auto; /* Allow vertical scroll */[m
   overflow-x: hidden;[m
[31m-  padding-bottom: 60px;[m
[31m-}[m
[31m-[m
[31m-/* Allow fullscreen chart to escape parent container */[m
[31m-.dex-trading-area:has(.dex-chart-fullscreen) {[m
[31m-  overflow: visible !important;[m
[31m-  z-index: 999999 !important;[m
[32m+[m[32m  padding-bottom: 60px; /* Ensure content isn't cut off at bottom */[m
 }[m
 [m
 /* Top Split: Panel (Left) & Chart (Right) */[m
[36m@@ -814,40 +780,31 @@[m [mbody.chart-fullscreen-active .dex-page-container {[m
   display: flex;[m
   gap: 20px; [m
   width: 100%;[m
[31m-  align-items: stretch;[m
[32m+[m[32m  flex: 1; /* Takes all available vertical space */[m
[32m+[m[32m  min-height: 0; /* Crucial for nested scrolling/fitting */[m
   position: relative;[m
[31m-  z-index: 2;[m
[31m-  flex-shrink: 0;[m
[31m-}[m
[31m-[m
[31m-/* Allow fullscreen chart to escape parent container */[m
[31m-.dex-top-split:has(.dex-chart-fullscreen) {[m
[31m-  position: static !important;[m
[31m-  z-index: 999999 !important;[m
[32m+[m[32m  z-index: 2; /* Above positions table */[m
 }[m
 [m
 .dex-layout-sidebar-slot { [m
[31m-  width: 380px;[m
[32m+[m[32m  width: 380px; /* Fixed width for swap panel on desktop */[m
   display: flex; [m
   flex-direction: column;[m
   flex-shrink: 0;[m
[31m-  height: auto;[m
[31m-  align-self: flex-start;[m
[32m+[m[32m  height: 100%; /* Force full height matching parent */[m
[32m+[m[32m  position: relative;[m
[32m+[m[32m  z-index: 2; /* Above positions table */[m
 }[m
[32m+[m[32m.dex-layout-sidebar-slot::-webkit-scrollbar { display: none; }[m
 [m
 .dex-chart-section { [m
[31m-  flex: 1;[m
[32m+[m[32m  flex: 1; /* Takes remaining width */[m
   display: flex; [m
   flex-direction: column; [m
[31m-  min-width: 0;[m
[31m-  min-height: 400px;[m
[32m+[m[32m  min-width: 0; /* Prevents flex overflow issues */[m
[32m+[m[32m  height: 100%; /* Force full height matching parent */[m
   position: relative;[m
[31m-}[m
[31m-[m
[31m-/* Allow fullscreen chart to escape parent container */[m
[31m-.dex-chart-section:has(.dex-chart-fullscreen) {[m
[31m-  position: static !important;[m
[31m-  z-index: 999999 !important;[m
[32m+[m[32m  z-index: 2; /* Above positions table */[m
 }[m
 [m
 /* ═══════════════════════════════════════════════════════════════════[m
[36m@@ -858,15 +815,16 @@[m [mbody.chart-fullscreen-active .dex-page-container {[m
   backdrop-filter: blur(12px);[m
   border: var(--glass-border);[m
   border-radius: 12px;[m
[31m-  padding: 10px;[m
[31m-  display: flex; [m
[31m-  flex-direction: column; [m
[31m-  gap: 4px;[m
[32m+[m[32m  padding: 10px; /* Optimized padding */[m
[32m+[m[32m  display: flex; flex-direction: column; gap: 4px;[m
   box-shadow: 0 4px 20px rgba(0,0,0,0.2);[m
[31m-  height: auto;[m
[31m-  overflow: visible;[m
[32m+[m[32m  height: fit-content; /* Allow natural height to show all content */[m
[32m+[m[32m  min-height: 100%; /* Match neighbor height when possible */[m
[32m+[m[32m  justify-content: flex-start; /* Start from top, don't stretch */[m
[32m+[m[32m  overflow: visible; /* Show all content including button */[m
[32m+[m[32m  position: relative;[m
[32m+[m[32m  z-index: 3; /* Above positions table */[m
 }[m
[31m-.dex-swap-card::-webkit-scrollbar { display: none; }[m
 [m
 .dex-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0; min-height: 24px; }[m
 [m
[36m@@ -954,12 +912,162 @@[m [mbody.chart-fullscreen-active .dex-page-container {[m
 .dex-action-btn:hover { filter: brightness(1.1); }[m
 [m
 /* ═══════════════════════════════════════════════════════════════════[m
[31m-   TRADING CHART - Stiluri mutate în TradingChart.css[m
[32m+[m[32m   TRADING CHART[m
    ═══════════════════════════════════════════════════════════════════ */[m
[32m+[m[32m.dex-chart-wrapper {[m
[32m+[m[32m  background: rgba(22, 26, 30, 0.6);[m
[32m+[m[32m  backdrop-filter: blur(12px);[m
[32m+[m[32m  border: var(--glass-border);[m
[32m+[m[32m  border-radius: 12px;[m
[32m+[m[32m  display: flex; flex-direction: column;[m
[32m+[m[32m  height: 100%; /* Fill the chart section */[m
[32m+[m[32m  min-height: 400px; /* Ensure minimum visibility */[m
[32m+[m[32m  overflow: hidden;[m
[32m+[m[32m  position: relative;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.dex-chart-fullscreen { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 9999; border-radius: 0; }[m
[32m+[m
[32m+[m[32m.dex-chart-header-modern {[m
[32m+[m[32m    display: flex; justify-content: space-between; align-items: center;[m
[32m+[m[32m    padding: 10px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); background: rgba(0, 0, 0, 0.2);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.dex-token-info { display: flex; align-items: baseline; gap: 12px; }[m
[32m+[m[32m.dex-pair-title { font-size: 1.2rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; }[m
[32m+[m[32m.dex-badge-perp { background: rgba(255, 255, 255, 0.1); font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; color: var(--text-muted); }[m
[32m+[m
[32m+[m[32m.dex-price-display { display: flex; align-items: baseline; gap: 10px; }[m
[32m+[m[32m.current-price { font-size: 1.4rem; font-weight: 700; font-family: 'Roboto Mono', monospace; }[m
[32m+[m[32m.text-up { color: var(--success-color); }[m
[32m+[m[32m.text-down { color: var(--danger-color); }[m
[32m+[m[32m.price-change { font-size: 0.9rem; font-weight: 500; color: #fff; }[m
[32m+[m
[32m+[m[32m.dex-stats-row { display: flex; gap: 20px; }[m
[32m+[m[32m.stat-box { display: flex; flex-direction: column; }[m
[32m+[m[32m.stat-box label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; }[m
[32m+[m[32m.stat-box span { font-size: 0.9rem; font-weight: 600; color: #fff; }[m
[32m+[m
[32m+[m[32m.dex-controls { display: flex; align-items: center; gap: 12px; }[m
[32m+[m[32m.timeframe-pills { display: flex; background: rgba(255, 255, 255, 0.05); padding: 2px; border-radius: 6px; }[m
[32m+[m[32m.tf-pill { background: none; border: none; color: var(--text-muted); padding: 4px 8px; font-size: 0.8rem; cursor: pointer; border-radius: 4px; transition: 0.2s; }[m
[32m+[m[32m.tf-pill:hover { color: #fff; }[m
[32m+[m[32m.tf-pill.active { background: rgba(255, 255, 255, 0.1); color: #fff; font-weight: 600; }[m
[32m+[m[32m.refresh-btn { background: rgba(255, 255, 255, 0.05); border: none; color: var(--text-muted); width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }[m
[32m+[m[32m.refresh-btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }[m
[32m+[m[32m.spin { animation: spin 1s linear infinite; }[m
[32m+[m
[32m+[m[32m.dex-chart-body { flex: 1; position: relative; width: 100%; overflow: hidden; }[m
[32m+[m[32m.chart-container-div { width: 100%; height: 100%; }[m
[32m+[m
[32m+[m[32m.dex-chart-tooltip {[m
[32m+[m[32m  position: absolute; top: 10px; left: 10px; z-index: 20;[m
[32m+[m[32m  background: rgba(22, 26, 30, 0.8); backdrop-filter: blur(4px);[m
[32m+[m[32m  border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px;[m
[32m+[m[32m  padding: 6px 10px; display: flex; gap: 12px; font-family: 'Roboto Mono', monospace; font-size: 0.8rem;[m
[32m+[m[32m}[m
[32m+[m[32m.tooltip-item { display: flex; gap: 4px; }[m
[32m+[m[32m.tooltip-label { color: var(--text-muted); }[m
[32m+[m[32m.tooltip-val { color: #fff; }[m
[32m+[m[32m.tooltip-val.up { color: var(--success-color); }[m
[32m+[m[32m.tooltip-val.down { color: var(--danger-color); }[m
[32m+[m
[32m+[m[32m.loading-overlay {[m
[32m+[m[32m  position: absolute; top: 0; left: 0; width: 100%; height: 100%;[m
[32m+[m[32m  background: rgba(0,0,0,0.4); backdrop-filter: blur(2px);[m
[32m+[m[32m  display: flex; flex-direction: column; align-items: center; justify-content: center;[m
[32m+[m[32m  color: var(--primary-color); z-index: 10; font-size: 0.9rem; letter-spacing: 1px; gap: 10px;[m
[32m+[m[32m}[m
[32m+[m[32m.pulse-icon { animation: pulse 1.5s infinite; }[m
[32m+[m
[32m+[m[32m.watermark {[m
[32m+[m[32m    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);[m
[32m+[m[32m    opacity: 0.03; pointer-events: none; color: #fff;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.dex-chart-footer {[m
[32m+[m[32m  padding: 8px 16px; background: rgba(0, 0, 0, 0.2); border-top: 1px solid rgba(255, 255, 255, 0.05);[m
[32m+[m[32m  display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-muted);[m
[32m+[m[32m}[m
[32m+[m[32m.text-highlight { color: var(--primary-color); font-weight: 700; }[m
[32m+[m[32m.status-dot-container { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.5px; }[m
[32m+[m[32m.status-dot { width: 6px; height: 6px; border-radius: 50%; }[m
[32m+[m[32m.status-dot.green { background: var(--success-color); box-shadow: 0 0 6px var(--success-color); }[m
[32m+[m[32m.status-dot.yellow { background: #FCD535; }[m
 [m
 /* ═══════════════════════════════════════════════════════════════════[m
[31m-   POSITIONS TABLE - Stiluri mutate în PositionsTable.css[m
[32m+[m[32m   POSITIONS TABLE (XTB STYLE)[m
    ═══════════════════════════════════════════════════════════════════ */[m
[32m+[m[32m.dex-positions-container,[m
[32m+[m[32m.dex-positions-section { /* Support both names for compatibility */[m
[32m+[m[32m  display: flex; flex-direction: column;[m
[32m+[m[32m  background: rgba(22, 26, 30, 0.6); backdrop-filter: blur(12px);[m
[32m+[m[32m  border: var(--glass-border); border-radius: 16px;[m
[32m+[m[32m  overflow: hidden;[m
[32m+[m[32m  height: 200px; /* Reduced height to give more room to Chart */[m
[32m+[m[32m  flex-shrink: 0; /* Prevent shrinking */[m
[32m+[m[32m  position: relative;[m
[32m+[m[32m  z-index: 0; /* Below swap and chart */[m
[32m+[m[32m  margin-top: 16px; /* Ensure gap from top split */[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.dex-positions-tabs { display: flex; gap: 1px; background: rgba(0,0,0,0.3); border-bottom: 1px solid var(--border-color); }[m
[32m+[m[32m.dex-tab {[m
[32m+[m[32m  padding: 12px 20px; background: transparent; border: none; color: var(--text-muted); font-size: 0.9rem; font-weight: 600;[m
[32m+[m[32m  cursor: pointer; position: relative;[m
[32m+[m[32m}[m
[32m+[m[32m.dex-tab.active { color: #fff; background: rgba(255,255,255,0.05); }[m
[32m+[m[32m.dex-tab.active::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: var(--primary-color); }[m
[32m+[m
[32m+[m[32m.dex-table-wrapper,[m
[32m+[m[32m.dex-table-container { /* Support both names */[m
[32m+[m[32m  flex: 1;[m[41m [m
[32m+[m[32m  overflow-y: auto;[m[41m [m
[32m+[m[32m  overflow-x: hidden;[m
[32m+[m[32m  position: relative;[m
[32m+[m[32m  max-height: calc(200px - 60px); /* Total height minus tabs and footer */[m
[32m+[m[32m}[m
[32m+[m[32m.dex-table {[m[41m [m
[32m+[m[32m  width: 100%;[m[41m [m
[32m+[m[32m  border-collapse: collapse;[m[41m [m
[32m+[m[32m  font-size: 1rem;[m
[32m+[m[32m  table-layout: fixed; /* Prevent cell overflow */[m
[32m+[m[32m}[m
[32m+[m[32m.dex-table th {[m
[32m+[m[32m  text-align: left; padding: 12px 20px; color: var(--text-muted); font-size: 0.9rem; font-weight: 500;[m
[32m+[m[32m  background: rgba(0,0,0,0.2); position: sticky; top: 0; z-index: 10;[m
[32m+[m[32m}[m
[32m+[m[32m.dex-table td {[m[41m [m
[32m+[m[32m  padding: 14px 20px;[m[41m [m
[32m+[m[32m  border-bottom: 1px solid rgba(255,255,255,0.02);[m[41m [m
[32m+[m[32m  color: #EAECEF;[m
[32m+[m[32m  white-space: nowrap;[m
[32m+[m[32m  overflow: hidden;[m
[32m+[m[32m  text-overflow: ellipsis;[m
[32m+[m[32m}[m
[32m+[m[32m.dex-table tbody {[m
[32m+[m[32m  display: table-row-group;[m
[32m+[m[32m  position: relative;[m
[32m+[m[32m}[m
[32m+[m[32m.dex-table tr {[m[41m [m
[32m+[m[32m  display: table-row;[m
[32m+[m[32m  position: relative;[m
[32m+[m[32m}[m
[32m+[m[32m.dex-table tr:hover { background: rgba(255,255,255,0.02); }[m
[32m+[m
[32m+[m[32m.dex-pos-type { padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 700; }[m
[32m+[m[32m.dex-pos-type.buy { color: var(--success-color); background: rgba(48, 195, 113, 0.15); }[m
[32m+[m[32m.dex-pos-type.sell { color: var(--danger-color); background: rgba(230, 68, 77, 0.15); }[m
[32m+[m
[32m+[m[32m.dex-pnl-val { font-weight: 700; }[m
[32m+[m[32m.dex-pnl-val.pos { color: var(--success-color); }[m
[32m+[m[32m.dex-pnl-val.neg { color: var(--danger-color); }[m
[32m+[m
[32m+[m[32m.dex-positions-footer {[m
[32m+[m[32m  padding: 12px 20px; border-top: 1px solid var(--border-color);[m
[32m+[m[32m  display: flex; gap: 24px; font-size: 0.95rem; color: var(--text-muted); background: rgba(0,0,0,0.2);[m
[32m+[m[32m}[m
[32m+[m[32m.dex-footer-stat span { color: #fff; font-weight: 600; margin-left: 6px; }[m
 [m
 /* ═══════════════════════════════════════════════════════════════════[m
    ROUTE VISUALIZER (Smart Route)[m
[36m@@ -1080,7 +1188,54 @@[m [mbody.chart-fullscreen-active .dex-page-container {[m
   display: none; /* Hidden on desktop */[m
 }[m
 [m
[31m-/* DEX Buttons & Table Actions - Stiluri mutate în PositionsTable.css */[m
[32m+[m[32m/* DEX Buttons for Close/Take Profit */[m
[32m+[m[32m.dex-close-pos-btn {[m
[32m+[m[32m  border: none;[m
[32m+[m[32m  outline: none;[m
[32m+[m[32m  padding: 6px 12px;[m
[32m+[m[32m  border-radius: 4px;[m
[32m+[m[32m  font-size: 0.75rem;[m
[32m+[m[32m  font-weight: 700;[m
[32m+[m[32m  cursor: pointer;[m
[32m+[m[32m  text-transform: uppercase;[m
[32m+[m[32m  transition: all 0.2s ease;[m
[32m+[m[32m  min-width: 80px;[m
[32m+[m[32m  letter-spacing: 0.5px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.dex-close-pos-btn.take-profit {[m
[32m+[m[32m  background: rgba(48, 195, 113, 0.15);[m
[32m+[m[32m  color: #30C371; /* XTB Green */[m
[32m+[m[32m  border: 1px solid rgba(48, 195, 113, 0.3);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.dex-close-pos-btn.take-profit:hover {[m
[32m+[m[32m  background: #30C371;[m
[32m+[m[32m  color: #fff;[m
[32m+[m[32m  box-shadow: 0 0 10px rgba(48, 195, 113, 0.4);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.dex-close-pos-btn.stop-loss {[m
[32m+[m[32m  background: rgba(230, 68, 77, 0.15);[m
[32m+[m[32m  color: #E6444D; /* XTB Red */[m
[32m+[m[32m  border: 1px solid rgba(230, 68, 77, 0.3);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.dex-close-pos-btn.stop-loss:hover {[m
[32m+[m[32m  background: #E6444D;[m
[32m+[m[32m  color: #fff;[m
[32m+[m[32m  box-shadow: 0 0 10px rgba(230, 68, 77, 0.4);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/* Update Table Header for Action Column */[m
[32m+[m[32m.dex-table th:last-child {[m
[32m+[m[32m  text-align: right;[m
[32m+[m[32m  padding-right: 16px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.dex-table td:last-child {[m
[32m+[m[32m  padding-right: 8px;[m
[32m+[m[32m}[m
 [m
 [m
 @media (max-width: 768px) {[m

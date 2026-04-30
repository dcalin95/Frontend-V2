/**
 * Sidebar – doar linkuri ≥50% utile pentru TRADING.
 * Strategies, Performance, Execution eliminate din meniu (nu execuție directă).
 * @module Sidebar
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Target, 
  TrendingUp, 
  ChevronLeft,
  ChevronRight,
  Waves,
  Landmark,
  FileText,
  Shield
} from 'lucide-react';
import solanaSvg from '../frontend/assets/icons/solana.svg';
import stacksSvg from '../frontend/assets/icons/stacks.svg';
import OTALogo from '../frontend/components/ai-trading/OTALogo';
import '../../../styles/DEX/sidebar.css';

const Sidebar = ({ isMobileOpen = false, onClose = null }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const sidebarRef = useRef(null);

  /* Pe mobil când se deschide overlay-ul, sidebar-ul e mereu expandat */
  useEffect(() => {
    if (isMobileOpen) setIsCollapsed(false);
  }, [isMobileOpen]);

  /* La deschiderea meniului pe mobil, resetează scroll-ul ca Dashboard/OTA AI să fie vizibile (după layout + override scroll-into-view) */
  useEffect(() => {
    if (!isMobileOpen) return;
    const el = sidebarRef.current;
    if (!el) return;
    const forceScrollTop = () => {
      el.scrollTop = 0;
    };
    forceScrollTop();
    requestAnimationFrame(() => {
      forceScrollTop();
      setTimeout(forceScrollTop, 50);
      setTimeout(forceScrollTop, 150);
    });
  }, [isMobileOpen]);

  // Doar pagini ≥50% utile pentru TRADING. Profile și auth sunt în Header.
  const menuItems = [
    { id: 'dashboard', path: '/dex-edu/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'account', path: '/dex-edu/account', label: 'Personal Account', icon: Landmark },
    { id: 'ota', path: '/dex-edu/ota', label: 'OTA AI', icon: Target },
    { id: 'ota-sei', path: '/dex-edu/ota/sei', label: 'OTA SEI', icon: Waves },
    { id: 'ota-stx', path: '/dex-edu/ota/stx', label: 'OTA STX', iconSrc: stacksSvg },
    { id: 'ota-logs', path: '/dex-edu/ota/logs', label: 'Render logs', icon: FileText },
    { id: 'ota-short-ops', path: '/dex-edu/ota/short-ops', label: 'Futures Ops', icon: Shield },
    { id: 'swap', path: '/dex-edu/swap', label: 'Swap', icon: ArrowLeftRight },
    { id: 'trade', path: '/dex-edu/trade', label: 'EVM Trade', icon: BarChart3 },
    { id: 'sei-trade', path: '/dex-edu/sei', label: 'SEI Trade', icon: Waves },
    { id: 'clob-sei', path: '/dex-edu/clob-sei', label: 'CLOB SEI', icon: BarChart3 },
    { id: 'stx-trade', path: '/dex-edu/stx', label: 'STX Trade', iconSrc: stacksSvg },
    { id: 'sol-trade', path: '/dex-edu/sol', label: 'SOL Trade', iconSrc: solanaSvg },
    { id: 'leverage', path: '/dex-edu/leverage', label: 'Leverage', icon: TrendingUp },
  ];

  const isActive = (path) => {
    const normalize = (p) => String(p || '').split('#')[0].split('?')[0];
    const currentPath = normalize(location.pathname);
    const targetPath = normalize(path);
    if (currentPath === targetPath) return true;
    if (currentPath.startsWith(targetPath + '/')) return true;
    if (targetPath === '/dex-edu/sei' && (currentPath === '/dex-edu/sei' || currentPath.startsWith('/dex-edu/sei/'))) return true;
    if (targetPath === '/dex-edu/ota/sei' && currentPath === '/dex-edu/ota/sei') return true;
    if (targetPath === '/dex-edu/ota/stx' && currentPath === '/dex-edu/ota/stx') return true;
    if (targetPath === '/dex-edu/stx' && (currentPath === '/dex-edu/stx' || currentPath.startsWith('/dex-edu/stx/'))) return true;
    if (targetPath === '/dex-edu/sol' && (currentPath === '/dex-edu/sol' || currentPath.startsWith('/dex-edu/sol/'))) return true;
    return currentPath === '/dex-edu' && targetPath === '/dex-edu/dashboard';
  };

  return (
    <aside 
      ref={sidebarRef}
      className={`ai-trading-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`} 
      aria-label="Main navigation"
    >
      {/* Collapse Toggle – pe mobil acționează ca închidere overlay */}
      <button
        className="ai-trading-sidebar-toggle"
        onClick={isMobileOpen ? () => onClose?.() : () => setIsCollapsed(!isCollapsed)}
        aria-label={isMobileOpen ? 'Close menu' : (isCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
        title={isMobileOpen ? 'Close' : (isCollapsed ? 'Expand' : 'Collapse')}
      >
        {isCollapsed && !isMobileOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <nav className="ai-trading-nav" aria-label="DEX Navigation">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const isOTA = item.id === 'ota';
          
          const renderIcon = () => {
            if (isOTA) return (
              <span className="ai-trading-nav-ota-logo-wrap" aria-hidden="true">
                <OTALogo size="xs" className="ai-trading-nav-ota-logo" />
              </span>
            );
            if (item.iconSrc) return (
              <span className="ai-trading-nav-chain-icon-wrap" aria-hidden="true">
                <img src={item.iconSrc} alt="" width={40} height={40} className="ai-trading-nav-chain-icon" />
              </span>
            );
            return Icon ? <Icon size={20} aria-hidden="true" /> : null;
          };
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`ai-trading-nav-item ${active ? 'active' : ''}`}
              aria-current={active ? 'page' : undefined}
              aria-label={`Navigate to ${item.label}`}
              title={isCollapsed ? item.label : undefined}
              onClick={() => isMobileOpen && onClose?.()}
            >
              {renderIcon()}
              {(!isCollapsed || isMobileOpen) && <span className="ai-trading-nav-label">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;


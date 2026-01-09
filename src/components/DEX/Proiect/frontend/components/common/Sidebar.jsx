/**
 * 📊 Sidebar Component - Navigation Sidebar
 * 
 * Sidebar component pentru navigation:
 * - Dashboard
 * - Strategies
 * - Signals
 * - Performance
 * - Execution
 * 
 * @module Sidebar
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target, 
  Radio, 
  TrendingUp, 
  Play
} from 'lucide-react';
import '../../styles/sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'strategies', path: '/strategies', label: 'Strategies', icon: Target },
    { id: 'signals', path: '/signals', label: 'Signals', icon: Radio },
    { id: 'performance', path: '/performance', label: 'Performance', icon: TrendingUp },
    { id: 'execution', path: '/execution', label: 'Execution', icon: Play }
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside className="ai-trading-sidebar">
      <nav className="ai-trading-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`ai-trading-nav-item ${active ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span className="ai-trading-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;


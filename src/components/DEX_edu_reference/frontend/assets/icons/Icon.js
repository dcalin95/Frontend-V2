import React from 'react';
import * as Icons from './IconRegistry';
import './Icon.css';

/**
 * Icon Component - Reutilizabil pentru toate iconițele SVG
 * 
 * Props:
 * - name: string (numele iconitei din ICON_MAP)
 * - size: number | 'small' | 'medium' | 'large' | 'xlarge' (default: 'medium')
 * - className: string (clase CSS custom)
 * - animate: 'pulse' | 'spin' | 'glow' | 'float' | null (default: null)
 * - onClick: function (event handler)
 * - style: object (inline styles custom)
 * 
 * Exemple:
 * <Icon name="wallet-connect" size="large" animate="pulse" />
 * <Icon name="bitcoin" size={48} onClick={handleClick} />
 * <Icon name="success" size="medium" animate="glow" className="custom-class" />
 */

const Icon = ({ 
  name, 
  size = 'medium', 
  className = '', 
  animate = null,
  onClick = null,
  style = {},
  ...props 
}) => {
  // Convertim numele în ComponentName din ICON_MAP
  const iconComponentName = Icons.ICON_MAP[name];
  
  if (!iconComponentName) {
    console.warn(`Icon "${name}" not found in IconRegistry`);
    return null;
  }

  // Obținem componentul SVG
  const IconComponent = Icons[iconComponentName];
  
  if (!IconComponent) {
    console.warn(`Icon component "${iconComponentName}" not found`);
    return null;
  }

  // Size mapping
  const sizeMap = {
    small: 24,
    medium: 32,
    large: 48,
    xlarge: 64
  };

  const iconSize = typeof size === 'number' ? size : sizeMap[size] || sizeMap.medium;

  // Class building
  const classes = [
    'solana-icon',
    animate ? `solana-icon--animate-${animate}` : '',
    onClick ? 'solana-icon--clickable' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={classes}
      onClick={onClick}
      style={{
        width: iconSize,
        height: iconSize,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
      {...props}
    >
      <IconComponent 
        width={iconSize}
        height={iconSize}
      />
    </div>
  );
};

export default Icon;


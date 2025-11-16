import React from 'react';
import logo from '../assets/logo.png';
import './BrandLogo.css';

const SIZE_MAP = {
  xs: 20,
  sm: 28,
  md: 40,
  lg: 56,
};

const BrandLogo = ({
  text = 'BitSwapDEX AI',
  showText = true,
  size = 'md',
  className = '',
  textClassName = '',
  imageClassName = '',
}) => {
  const dimension = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <span className={`brand-logo brand-logo--${size} ${className || ''}`.trim()}>
      <img
        src={logo}
        width={dimension}
        height={dimension}
        className={`brand-logo__image ${imageClassName || ''}`.trim()}
        alt={`${text} logo`}
        loading="lazy"
      />
      {showText && (
        <span className={`brand-logo__text ${textClassName || ''}`.trim()}>
          {text}
        </span>
      )}
    </span>
  );
};

export default BrandLogo;


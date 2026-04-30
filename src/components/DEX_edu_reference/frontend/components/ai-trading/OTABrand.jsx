/**
 * OTABrand – logo OTA + text în același bloc (legat în DOM).
 * Un singur wrapper, un singur context de aliniere.
 */
import React from 'react';
import OTALogo from './OTALogo';
import '../../styles/components/ota-brand.css';

const OTABrand = ({ size = 'md', text = 'OTA', className = '' }) => (
  <span className={`ota-brand ${className}`.trim()} aria-label={text}>
    <OTALogo size={size} aria-hidden />
    <span className="ota-brand-text">{text}</span>
  </span>
);

export default OTABrand;

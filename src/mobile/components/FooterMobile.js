import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../../components/BrandLogo';
import Icon from '../../assets/icons/Icon';
import '../Mobile.css';

const FooterMobile = () => {
  return (
    <footer className="mobile-footer">
      <div className="mobile-footer-logo">
        <BrandLogo size="xs" showText={false} />
      </div>

      <div className="mobile-footer-text">
        © 2025-2026 ®BitSwapDEX AI & $BITS
      </div>

      <div className="mobile-footer-links">
        <Link to="/terms" className="mobile-footer-link">
          <Icon name="document" size="small" />
          <span>Terms</span>
        </Link>
        <Link to="/privacy-policy" className="mobile-footer-link">
          <Icon name="shield" size="small" />
          <span>Privacy</span>
        </Link>
        <Link to="/contact" className="mobile-footer-link">
          <Icon name="email" size="small" />
          <span>Contact</span>
        </Link>
        <Link to="/" className="mobile-footer-link">
          <Icon name="home" size="small" />
          <span>Home</span>
        </Link>
      </div>

      <div className="mobile-footer-disclaimer">
        Powered by AI and Blockchain Technology
      </div>
    </footer>
  );
};

export default FooterMobile;


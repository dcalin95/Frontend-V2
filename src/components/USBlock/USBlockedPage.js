import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGeoLocation } from '../../context/GeoLocationContext';
import { trackBlockedPageView } from '../../utils/blockedUsersAnalytics';
import './USBlockedPage.css';

/**
 * 🚫 US BLOCKED PAGE
 * 
 * Page displayed to US users when attempting to access the platform.
 * Includes legal disclaimer and clear explanations about restrictions.
 * Tracks time spent on page for analytics.
 */
const USBlockedPage = () => {
  const navigate = useNavigate();
  const { countryCode, country, isLoading } = useGeoLocation();
  const [startTime] = useState(Date.now());

  useEffect(() => {
    // If user is NOT from USA, redirect back to home
    if (!isLoading && countryCode !== 'US') {
      console.log('✅ [USBlockedPage] Non-US user detected, redirecting to home...');
      sessionStorage.removeItem('bits_us_blocked');
      navigate('/', { replace: true });
    }
  }, [countryCode, isLoading, navigate]);

  useEffect(() => {
    // Track page view when component mounts
    if (!isLoading && countryCode === 'US') {
      trackBlockedPageView(countryCode, country, 0);
    }

    // Track time spent when component unmounts
    return () => {
      if (countryCode === 'US') {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        trackBlockedPageView(countryCode, country, timeSpent);
      }
    };
  }, [countryCode, country, isLoading, startTime]);

  if (isLoading) {
    return (
      <div className="us-blocked-loading">
        <div className="us-blocked-spinner"></div>
        <p>Verifying your location...</p>
      </div>
    );
  }

  return (
    <div className="us-blocked-container">
      <div className="us-blocked-card">
        {/* Header */}
        <div className="us-blocked-header">
          <div className="us-blocked-icon">🚫</div>
          <h1>Service Not Available in Your Region</h1>
          <p className="us-blocked-subtitle">Access Restricted for US Persons</p>
        </div>

        {/* Main Content */}
        <div className="us-blocked-content">
          <div className="us-blocked-section">
            <h2>⚠️ Important Notice</h2>
            <p>
              Our services are <strong>not available to persons or entities located in, 
              incorporated in, or residents of the United States of America</strong>.
            </p>
          </div>

          <div className="us-blocked-section">
            <h2>📜 Legal Compliance</h2>
            <p>
              This restriction is in place to comply with US federal securities laws, 
              including but not limited to:
            </p>
            <ul>
              <li><strong>Securities Act of 1933</strong></li>
              <li><strong>Securities Exchange Act of 1934</strong></li>
              <li><strong>Investment Company Act of 1940</strong></li>
              <li><strong>SEC Regulations</strong> (Reg D, Reg S)</li>
            </ul>
          </div>

          <div className="us-blocked-section">
            <h2>🌍 Who Is Affected?</h2>
            <p>This restriction applies to:</p>
            <ul>
              <li>US citizens and residents (regardless of location)</li>
              <li>Persons located in the United States</li>
              <li>Entities incorporated or organized in the United States</li>
              <li>US permanent residents (Green Card holders)</li>
            </ul>
          </div>

          <div className="us-blocked-section">
            <h2>🔒 Why This Restriction?</h2>
            <p>
              The BITS token presale constitutes a securities offering under US law. 
              To offer such securities to US persons, we would need to:
            </p>
            <ul>
              <li>Register with the SEC (extremely costly and time-consuming)</li>
              <li>Obtain state licenses in all 50 states</li>
              <li>Implement full KYC/AML compliance for US persons</li>
              <li>Maintain ongoing SEC reporting obligations</li>
            </ul>
            <p>
              At this stage, we have chosen <strong>not to pursue US registration</strong> 
              and instead focus on international markets where we can operate legally 
              and efficiently.
            </p>
          </div>

          <div className="us-blocked-section">
            <h2>✅ Available Regions</h2>
            <p>
              Our services are available in <strong>150+ countries</strong> including 
              Europe, Asia, Africa, and Latin America. We comply with local regulations 
              in each jurisdiction where we operate.
            </p>
          </div>

          <div className="us-blocked-disclaimer">
            <h3>⚖️ Disclaimer</h3>
            <p>
              By accessing this website, you represent and warrant that you are not a 
              US person as defined above. Any attempt to circumvent these restrictions 
              through VPN, proxy, or other means is strictly prohibited and may result 
              in legal action.
            </p>
            <p className="us-blocked-disclaimer-small">
              Nothing on this website constitutes investment advice, financial advice, 
              trading advice, or any other sort of advice. You should not treat any of 
              the website's content as such. BitSwapDEX AI does not recommend purchasing, 
              selling, or holding any cryptocurrency. Always conduct your own due diligence 
              and consult with a financial advisor before making investment decisions.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="us-blocked-footer">
          <p>
            If you believe you've reached this page in error, please contact us at:{' '}
            <a href="mailto:legal@bits-ai.io">legal@bits-ai.io</a>
          </p>
          <p className="us-blocked-footer-small">
            © 2025 BitSwapDEX AI. All rights reserved. 
            Registered in Seychelles (Company No. [PENDING]).
          </p>
        </div>
      </div>
    </div>
  );
};

export default USBlockedPage;


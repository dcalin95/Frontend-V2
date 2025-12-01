import React, { useState, useEffect } from 'react';
import './UserDeviceInfo.css';
import './UserDeviceInfo.mobile.css'; // 🚨 CSS Mobile separat
import { trackVisitor } from '../services/trackingService';

// 🦊 Import Wallet Icons
import metamaskLogo from '../assets/icons/metamask-logo.png';
import phantomLogo from '../assets/icons/phantom-logo.png';
import coinbaseLogo from '../assets/exchanges/coinbase-clearbit.png';

const UserDeviceInfo = ({ className = '' }) => {
  const [info, setInfo] = useState({
    ip: 'Loading...',
    location: 'Detecting...',
    os: '...',
    browser: '...',
    wallets: [],
    battery: null,
    charging: false,
    connection: '...',
    screen: '...',
    pixelRatio: 1,
    platform: '...',
    memory: null,
    cores: null,
    gpu: null,
    touch: '...',
    isp: '...',
    language: '...', // 🌐 Language
    devicePrice: 'Estimating...', // 🚨 Preț estimat device
    deviceName: 'Detecting...' // 🚨 Nume device
  });

  const [isVisible, setIsVisible] = useState(false);

  // 📍 GPS Location Request
  const requestPreciseLocation = () => {
    if ("geolocation" in navigator) {
      setInfo(prev => ({ ...prev, location: 'Locating...' }));
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(2);
          const long = position.coords.longitude.toFixed(2);
          setInfo(prev => ({ ...prev, location: `${lat},${long} 🎯` }));
        },
        (error) => {
          console.warn("GPS Denied/Error", error);
          setInfo(prev => ({ ...prev, location: 'GPS Denied 🔒' }));
        }
      );
    } else {
      setInfo(prev => ({ ...prev, location: 'GPS Not Supported' }));
    }
  };

  // Helper functions
  const getGPU = () => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'Not Available';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
  };

  const getOS = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  };

  const getBrowser = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  // 🖥️ Detectare nume device
  const getDeviceName = () => {
    const ua = navigator.userAgent.toLowerCase();
    
    // iPhone models
    if (ua.includes('iphone')) {
      if (ua.includes('iphone15') || ua.includes('iphone 15')) return 'iPhone 15';
      if (ua.includes('iphone14') || ua.includes('iphone 14')) return 'iPhone 14';
      if (ua.includes('iphone13') || ua.includes('iphone 13')) return 'iPhone 13';
      if (ua.includes('iphone12') || ua.includes('iphone 12')) return 'iPhone 12';
      if (ua.includes('iphonese')) return 'iPhone SE';
      return 'iPhone';
    }
    
    // iPad models
    if (ua.includes('ipad')) {
      if (ua.includes('pro')) return 'iPad Pro';
      if (ua.includes('air')) return 'iPad Air';
      if (ua.includes('mini')) return 'iPad Mini';
      return 'iPad';
    }
    
    // Mac models
    if (ua.includes('mac')) {
      if (ua.includes('macbook pro')) return 'MacBook Pro';
      if (ua.includes('macbook air')) return 'MacBook Air';
      if (ua.includes('imac')) return 'iMac';
      if (ua.includes('mac mini')) return 'Mac Mini';
      return 'Mac';
    }
    
    // Samsung models
    if (ua.includes('samsung')) {
      if (ua.includes('sm-s24')) return 'Galaxy S24';
      if (ua.includes('sm-s23')) return 'Galaxy S23';
      if (ua.includes('sm-s22')) return 'Galaxy S22';
      if (ua.includes('sm-z')) return 'Galaxy Z Fold/Flip';
      if (ua.includes('galaxy')) {
        const match = ua.match(/galaxy\s?([a-z0-9\s]+)/i);
        return match ? `Galaxy ${match[1].trim().toUpperCase()}` : 'Samsung Galaxy';
      }
      return 'Samsung';
    }
    
    // Other Android brands
    if (ua.includes('pixel')) return 'Google Pixel';
    if (ua.includes('oneplus')) return 'OnePlus';
    if (ua.includes('xiaomi') || ua.includes('redmi')) return 'Xiaomi';
    if (ua.includes('huawei')) return 'Huawei';
    if (ua.includes('oppo')) return 'Oppo';
    if (ua.includes('vivo')) return 'Vivo';
    
    // Desktop/Laptop generic
    if (ua.includes('windows')) {
      const cores = navigator.hardwareConcurrency || 0;
      const ram = navigator.deviceMemory || 0;
      if (cores >= 8 || ram >= 16) return 'Windows Workstation';
      return 'Windows PC';
    }
    
    if (ua.includes('linux')) return 'Linux PC';
    if (ua.includes('android')) return 'Android Device';
    
    return 'Unknown Device';
  };

  // 💰 Estimare preț device (inspirat din TikTok)
  const estimateDevicePrice = () => {
    const ua = navigator.userAgent.toLowerCase();
    
    // iPhone Detection (specific models)
    if (ua.includes('iphone')) {
      if (ua.includes('iphone15') || ua.includes('iphone 15')) return '$799 - $1,199';
      if (ua.includes('iphone14') || ua.includes('iphone 14')) return '$699 - $999';
      if (ua.includes('iphone13') || ua.includes('iphone 13')) return '$599 - $899';
      if (ua.includes('iphone12') || ua.includes('iphone 12')) return '$499 - $799';
      if (ua.includes('iphonese')) return '$429';
      return '$600 - $1,000'; // iPhone generic
    }
    
    // iPad Detection
    if (ua.includes('ipad')) {
      if (ua.includes('pro')) return '$799 - $1,599';
      return '$329 - $799';
    }
    
    // Mac Detection
    if (ua.includes('mac')) {
      if (ua.includes('macbook pro')) return '$1,299 - $3,499';
      if (ua.includes('macbook air')) return '$999 - $1,499';
      if (ua.includes('imac')) return '$1,299 - $2,299';
      return '$1,000 - $2,500'; // Mac generic
    }
    
    // Samsung Galaxy Detection
    if (ua.includes('samsung')) {
      if (ua.includes('s24') || ua.includes('s23')) return '$799 - $1,199';
      if (ua.includes('s22') || ua.includes('s21')) return '$599 - $899';
      if (ua.includes('fold') || ua.includes('flip')) return '$999 - $1,799';
      if (ua.includes('galaxy a')) return '$299 - $599';
      return '$400 - $1,000'; // Samsung generic
    }
    
    // Android High-End (based on specs)
    if (ua.includes('android')) {
      const ram = navigator.deviceMemory || 4;
      const width = window.screen.width;
      const pixelRatio = window.devicePixelRatio || 1;
      
      if (ram >= 8 && pixelRatio >= 3) return '$700 - $1,200'; // Flagship
      if (ram >= 6 && pixelRatio >= 2.5) return '$500 - $900'; // Upper mid-range
      if (ram >= 4) return '$300 - $600'; // Mid-range
      return '$150 - $400'; // Budget
    }
    
    // Windows Desktop/Laptop
    if (ua.includes('windows')) {
      const ram = navigator.deviceMemory || 8;
      const cores = navigator.hardwareConcurrency || 4;
      
      if (ram >= 16 && cores >= 8) return '$1,200 - $3,000'; // High-end workstation
      if (ram >= 8 && cores >= 4) return '$600 - $1,500'; // Standard laptop/desktop
      return '$300 - $800'; // Budget PC
    }
    
    // Linux
    if (ua.includes('linux')) return '$400 - $1,200';
    
    return 'Unknown';
  };

  const getNetworkInfo = () => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return 'Unknown';
    return conn.effectiveType || 'Unknown';
  };

  const detectWallets = () => {
    const wallets = [];
    if (window.ethereum?.isMetaMask) wallets.push('MetaMask');
    if (window.solana?.isPhantom) wallets.push('Phantom');
    if (window.BinanceChain) wallets.push('Binance');
    if (window.coinbaseWalletExtension) wallets.push('Coinbase');
    if (window.okxwallet) wallets.push('OKX');
    return wallets;
  };

  useEffect(() => {
    const fetchDeviceInfo = async () => {
      try {
        // Battery API
        if ('getBattery' in navigator) {
          const battery = await navigator.getBattery();
          setInfo(prev => ({
            ...prev,
            battery: Math.round(battery.level * 100),
            charging: battery.charging
          }));
        }

        // Basic device info
        const deviceInfo = {
          screen: `${window.innerWidth}x${window.innerHeight}`,
          pixelRatio: window.devicePixelRatio || 1,
          platform: navigator.platform,
          memory: navigator.deviceMemory || null,
          cores: navigator.hardwareConcurrency || null,
          gpu: getGPU(),
          os: getOS(),
          browser: getBrowser(),
          connection: getNetworkInfo(),
          touch: navigator.maxTouchPoints > 0 ? 'Touch' : 'No Touch',
          wallets: detectWallets(),
          devicePrice: estimateDevicePrice(), // 🚨 Preț estimat
          deviceName: getDeviceName() // 🚨 Nume device
        };

        setInfo(prev => ({ ...prev, ...deviceInfo }));

        // IP & Location API (with fallback)
        let ipData = null;
        
        try {
          // Try ipapi.co first
          const response = await fetch('https://ipapi.co/json/');
          ipData = await response.json();
        } catch (err) {
          console.warn('ipapi.co failed, trying fallback...', err);
          try {
            // Fallback to ipify + ip-api
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipJson = await ipResponse.json();
            const locResponse = await fetch(`http://ip-api.com/json/${ipJson.ip}`);
            const locJson = await locResponse.json();
            ipData = {
              ip: ipJson.ip,
              city: locJson.city,
              country_name: locJson.country,
              org: locJson.isp
            };
          } catch (err2) {
            console.error('All IP APIs failed', err2);
            ipData = { ip: 'API Error', city: 'Unknown', country_name: '', org: 'Unknown' };
          }
        }
        
        setInfo(prev => ({
          ...prev,
          ip: ipData.ip || 'Fetching...',
          location: ipData.city && ipData.country_name ? `${ipData.city}, ${ipData.country_name}` : 'Unknown',
          isp: ipData.org || 'Unknown'
        }));

        // Send to Firebase
        const finalData = {
          ...deviceInfo,
          ip: ipData.ip,
          location: ipData.city && ipData.country_name ? `${ipData.city}, ${ipData.country_name}` : 'Unknown',
          isp: ipData.org
        };
        
        await trackVisitor(finalData);

      } catch (error) {
        console.error('Error fetching device info:', error);
      }
    };

    fetchDeviceInfo();
  }, []);

  const togglePanel = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className={`user-device-info ${className} ${isVisible ? 'visible' : ''}`}>
      <button className="device-info-btn" onClick={togglePanel}>
        <i className="fas fa-mobile-alt"></i> Device Info - {info.deviceName || 'Detecting...'}
      </button>

      {isVisible && (
      <div className="device-info-content">
          <button className="device-info-close" onClick={togglePanel}>
            <i className="fas fa-times"></i>
          </button>
          <h3>📱 Device Information</h3>
          
          <div className="info-grid">
            <div className="info-item">
              <i className="fas fa-tv"></i>
              <span className="info-label">Screen</span>
              <span className="info-value">{info.screen}</span>
            </div>

            <div className="info-item">
              <i className="fas fa-bolt"></i>
              <span className="info-label">Battery</span>
              <span className="info-value">
                {info.battery !== null ? `${info.battery}%` : 'N/A'}
                {info.charging && ' ⚡'}
          </span>
            </div>

            <div className="info-item">
              <i className="fas fa-dollar-sign"></i>
              <span className="info-label">Device Price</span>
              <span className="info-value">{info.devicePrice}</span>
            </div>

            <div className="info-item">
              <i className="fas fa-wifi"></i>
              <span className="info-label">Connection</span>
              <span className="info-value">{info.connection}</span>
            </div>

            <div className="info-item">
              <i className="fas fa-microchip"></i>
              <span className="info-label">OS</span>
              <span className="info-value">{info.os}</span>
            </div>

            <div className="info-item">
              <i className="fas fa-rocket"></i>
              <span className="info-label">Browser</span>
              <span className="info-value">{info.browser}</span>
            </div>

            <div className="info-item">
              <i className="fas fa-language"></i>
              <span className="info-label">Language</span>
              <span className="info-value">{info.language}</span>
            </div>

            <div className="info-item">
              <i className="fas fa-map-marker-alt"></i>
              <span className="info-label">Location (GPS)</span>
              <span 
                className="info-value" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (!info.location.includes('🎯') && !info.location.includes('Locating')) {
                    requestPreciseLocation();
                  }
                }}
                style={{
                  cursor: info.location.includes('🎯') || info.location.includes('Locating') ? 'default' : 'pointer', 
                  textDecoration: info.location.includes('🎯') || info.location.includes('Locating') ? 'none' : 'underline',
                  color: info.location.includes('🎯') ? '#00FFA3' : (info.location.includes('Denied') ? '#ff4444' : '#FFD700'),
                  fontWeight: info.location.includes('Denied') ? '700' : '600'
                }}
                title={info.location.includes('🎯') ? 'GPS Activated' : 'Click to get precise GPS location (Google will ask permission)'}
              >
                {info.location === 'Detecting...' ? '📍 Click for GPS' : info.location}
              </span>
            </div>

            <div className="info-item">
              <i className="fas fa-fingerprint"></i>
              <span className="info-label">IP</span>
              <span className="info-value">{info.ip}</span>
            </div>

            <div className="info-item">
              <i className="fas fa-wallet"></i>
              <span className="info-label">Wallets</span>
              <span className="info-value">
                {info.wallets.length > 0 ? (
                  <div style={{display: 'flex', gap: '4px', alignItems: 'center'}}>
                    {info.wallets.map(w => {
                      if (w === 'MetaMask') return <img key={w} src={metamaskLogo} alt="MM" style={{width: '16px', height: '16px'}} />;
                      if (w === 'Phantom') return <img key={w} src={phantomLogo} alt="PH" style={{width: '16px', height: '16px'}} />;
                      if (w === 'Coinbase') return <img key={w} src={coinbaseLogo} alt="CB" style={{width: '16px', height: '16px'}} />;
                      return <span key={w} style={{fontSize: '10px'}}>{w}</span>;
                    })}
                  </div>
                ) : 'None'}
        </span>
      </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDeviceInfo;

import React, { useState, useEffect } from 'react';
import './UserDeviceInfo.css';

const UserDeviceInfo = () => {
  const [info, setInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const getInfo = async () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      let batteryLevel = null;
      
      if (navigator.getBattery) {
        try {
          const battery = await navigator.getBattery();
          batteryLevel = Math.round(battery.level * 100);
        } catch (e) {
          console.log("Battery API not available");
        }
      }

      setInfo({
        connection: connection ? connection.effectiveType : 'unknown',
        battery: batteryLevel,
        screen: `${window.innerWidth}x${window.innerHeight}`,
        platform: navigator.platform
      });
    };

    getInfo();

    // Auto-hide after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!info) return null;

  return (
    <div className={`user-device-info ${isVisible ? 'visible' : 'hidden'}`} onClick={() => setIsVisible(!isVisible)}>
      <div className="device-info-content">
        {info.connection !== 'unknown' && (
          <span className="info-item">
            <span className="icon">📡</span> {info.connection.toUpperCase()}
          </span>
        )}
        {info.battery !== null && (
          <span className="info-item">
            <span className="icon">{info.battery > 20 ? '🔋' : '🪫'}</span> {info.battery}%
          </span>
        )}
        <span className="info-item">
          <span className="icon">📱</span> {info.screen}
        </span>
      </div>
      {!isVisible && (
        <div className="info-toggle">
          ℹ️ Device Info
        </div>
      )}
    </div>
  );
};

export default UserDeviceInfo;


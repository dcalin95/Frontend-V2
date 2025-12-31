import React, { createContext, useContext, useState, useEffect } from 'react';

const GeoLocationContext = createContext();

export const useGeoLocation = () => useContext(GeoLocationContext);

export const GeoLocationProvider = ({ children }) => {
  const [locationData, setLocationData] = useState({
    country: '',
    countryCode: '',
    city: '',
    currency: 'USD',
    ip: '',
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchGeoLocation = async () => {
      // 1. Verificăm dacă avem deja datele în sesiune (Cache)
      const cachedData = sessionStorage.getItem('bits_user_geo');
      if (cachedData) {
        try {
          setLocationData(JSON.parse(cachedData));
          console.log("🌍 [GeoSystem] Loaded from cache:", JSON.parse(cachedData).country);
          return;
        } catch (e) {
          console.error("Geo cache parse error", e);
        }
      }

      try {
        // 2. Simple IP detection (no CORS issues) - ipify is CORS-friendly
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        
        // 3. Use simple fallback without geolocation API (avoid CORS)
        const geoInfo = {
          country: 'Global',
          countryCode: 'GL',
          city: '',
          currency: 'USD',
          ip: ipData.ip || 'Unknown',
          isLoading: false,
          error: null
        };

        // 4. Save to State and Cache
        setLocationData(geoInfo);
        sessionStorage.setItem('bits_user_geo', JSON.stringify(geoInfo));
        console.log("🌍 [GeoSystem] IP detected:", geoInfo.ip);

      } catch (error) {
        console.log("🌍 [GeoSystem] Skipping geo detection (optional feature)");
        // Fallback safe state - don't show error, it's optional
        setLocationData({
          country: 'Global',
          countryCode: 'GL',
          city: '',
          currency: 'USD',
          ip: '',
          isLoading: false,
          error: null // Silent fail - geo is optional
        });
      }
    };

    fetchGeoLocation();
  }, []);

  return (
    <GeoLocationContext.Provider value={locationData}>
      {children}
    </GeoLocationContext.Provider>
  );
};

export default GeoLocationContext;


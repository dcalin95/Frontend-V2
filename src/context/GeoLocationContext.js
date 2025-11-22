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
        // 2. Interogăm API-ul de geolocație (Folosim ipapi.co - reliable & free tier)
        const response = await fetch('https://ipapi.co/json/');
        
        if (!response.ok) {
            throw new Error('Geo API failed');
        }

        const data = await response.json();

        // Structurăm datele utile
        const geoInfo = {
          country: data.country_name || 'Global',
          countryCode: data.country_code || 'GL',
          city: data.city || '',
          currency: data.currency || 'USD',
          ip: data.ip,
          isLoading: false,
          error: null
        };

        // 3. Salvăm în State și Cache
        setLocationData(geoInfo);
        sessionStorage.setItem('bits_user_geo', JSON.stringify(geoInfo));
        console.log("🌍 [GeoSystem] Detected Location:", geoInfo.country);

      } catch (error) {
        console.error("🌍 [GeoSystem] Error detecting location:", error);
        // Fallback safe state
        setLocationData(prev => ({
          ...prev,
          country: 'Global',
          currency: 'USD',
          isLoading: false,
          error: error.message
        }));
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


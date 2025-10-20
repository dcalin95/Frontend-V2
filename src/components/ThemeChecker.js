import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

const ThemeChecker = () => {
  const { isLoaded } = useTheme();
  const [showMessage, setShowMessage] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      // Hide the message after 2 seconds when theme is loaded
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  // Don't render anything if theme is loaded and message should be hidden
  if (isLoaded && !showMessage) {
    return null;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: '100px', 
      left: '20px', 
      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
      color: 'white', 
      padding: '10px 20px', 
      borderRadius: '5px', 
      zIndex: 1000,
      fontSize: '14px'
    }}>
      {isLoaded ? "🎉 Theme loaded!" : "⌛ Loading theme..."}
    </div>
  );
};

export default ThemeChecker;

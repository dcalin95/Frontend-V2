import React, { createContext, useContext, useState, useEffect } from 'react';

// 🎨 Theme Context for UI/UX Improvements
const ThemeContext = createContext();

// 🎯 Theme Configuration
const themes = {
  light: {
    name: 'light',
    colors: {
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#f093fb',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1a202c',
      textSecondary: '#4a5568',
      border: '#e2e8f0',
      success: '#48bb78',
      warning: '#ed8936',
      error: '#f56565',
      info: '#4299e1',
    },
    shadows: {
      small: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      medium: '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
      large: '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.10)',
      xlarge: '0 15px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.05)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      accent: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      xxl: '3rem',
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '1rem',
      xl: '1.5rem',
      full: '9999px',
    },
    typography: {
      fontFamily: {
        primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        secondary: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        mono: '"Fira Code", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        md: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
      },
    },
    transitions: {
      fast: '0.15s ease-in-out',
      normal: '0.3s ease-in-out',
      slow: '0.5s ease-in-out',
    },
  },
  dark: {
    name: 'dark',
    colors: {
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#f093fb',
      background: '#0f1419',
      surface: '#1a202c',
      text: '#f7fafc',
      textSecondary: '#a0aec0',
      border: '#2d3748',
      success: '#68d391',
      warning: '#f6ad55',
      error: '#fc8181',
      info: '#63b3ed',
    },
    shadows: {
      small: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4)',
      medium: '0 3px 6px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
      large: '0 10px 20px rgba(0, 0, 0, 0.4), 0 3px 6px rgba(0, 0, 0, 0.3)',
      xlarge: '0 15px 25px rgba(0, 0, 0, 0.4), 0 5px 10px rgba(0, 0, 0, 0.3)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      accent: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      background: 'linear-gradient(135deg, #0f1419 0%, #1a202c 100%)',
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      xxl: '3rem',
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '1rem',
      xl: '1.5rem',
      full: '9999px',
    },
    typography: {
      fontFamily: {
        primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        secondary: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        mono: '"Fira Code", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        md: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
      },
    },
    transitions: {
      fast: '0.15s ease-in-out',
      normal: '0.3s ease-in-out',
      slow: '0.5s ease-in-out',
    },
  },
};

// 🎯 Accessibility Settings
const accessibilitySettings = {
  fontSize: {
    small: 0.875,
    normal: 1,
    large: 1.125,
    xlarge: 1.25,
  },
  spacing: {
    compact: 0.75,
    normal: 1,
    relaxed: 1.25,
    loose: 1.5,
  },
  contrast: {
    normal: 1,
    high: 1.2,
    veryHigh: 1.4,
  },
  reducedMotion: false,
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('light');
  const [accessibility, setAccessibility] = useState(accessibilitySettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // 🎯 Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedAccessibility = localStorage.getItem('accessibility');
    
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setCurrentTheme(prefersDark ? 'dark' : 'light');
    }

    if (savedAccessibility) {
      setAccessibility(JSON.parse(savedAccessibility));
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setAccessibility(prev => ({ ...prev, reducedMotion: prefersReducedMotion }));

    setIsLoaded(true);
  }, []);

  // 🎯 Apply theme to document
  useEffect(() => {
    if (!isLoaded) return;

    const theme = themes[currentTheme];
    const root = document.documentElement;

    // Apply CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });

    Object.entries(theme.gradients).forEach(([key, value]) => {
      root.style.setProperty(`--gradient-${key}`, value);
    });

    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });

    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });

    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      root.style.setProperty(`--font-weight-${key}`, value);
    });

    Object.entries(theme.transitions).forEach(([key, value]) => {
      root.style.setProperty(`--transition-${key}`, value);
    });

    // Apply accessibility settings
    root.style.setProperty('--font-size-multiplier', accessibility.fontSize.normal);
    root.style.setProperty('--spacing-multiplier', accessibility.spacing.normal);
    root.style.setProperty('--contrast-multiplier', accessibility.contrast.normal);

    // Apply reduced motion
    if (accessibility.reducedMotion) {
      root.style.setProperty('--transition-fast', '0s');
      root.style.setProperty('--transition-normal', '0s');
      root.style.setProperty('--transition-slow', '0s');
    }

    // Update document class
    document.documentElement.className = `theme-${currentTheme}`;
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Save to localStorage
    localStorage.setItem('theme', currentTheme);
    localStorage.setItem('accessibility', JSON.stringify(accessibility));

  }, [currentTheme, accessibility, isLoaded]);

  // 🎯 Toggle theme
  const toggleTheme = () => {
    setCurrentTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // 🎯 Set specific theme
  const setTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  // 🎯 Update accessibility settings
  const updateAccessibility = (settings) => {
    setAccessibility(prev => ({ ...prev, ...settings }));
  };

  // 🎯 Get current theme object
  const getTheme = () => themes[currentTheme];

  // 🎯 Get CSS variable value
  const getCSSVariable = (variable) => {
    return getComputedStyle(document.documentElement).getPropertyValue(variable);
  };

  const value = {
    currentTheme,
    theme: getTheme(),
    themes,
    accessibility,
    isLoaded,
    toggleTheme,
    setTheme,
    updateAccessibility,
    getCSSVariable,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// 🎯 Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext; 
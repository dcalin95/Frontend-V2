import React, { createContext, useContext, useEffect, useState } from 'react';
import './ThemeProvider.css';

// 🎨 Theme Context
const ThemeContext = createContext();

// 🎨 Theme Configuration
const THEMES = {
  dark: {
    name: 'dark',
    colors: {
      primary: '#00f0ff',
      secondary: '#ff6b35',
      accent: '#2ed573',
      background: '#0d0d1f',
      surface: '#1a1a2e',
      surfaceLight: '#16213e',
      text: '#ffffff',
      textSecondary: '#cccccc',
      textMuted: '#888888',
      border: 'rgba(0, 240, 255, 0.3)',
      borderLight: 'rgba(255, 255, 255, 0.1)',
      shadow: 'rgba(0, 240, 255, 0.1)',
      error: '#ff4757',
      warning: '#ffa502',
      success: '#2ed573',
      info: '#1e90ff'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #00f0ff 0%, #0099cc 100%)',
      secondary: 'linear-gradient(135deg, #ff6b35 0%, #ff4757 100%)',
      background: 'linear-gradient(135deg, #0d0d1f 0%, #1a1a2e 50%, #16213e 100%)',
      surface: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      glass: 'rgba(26, 26, 46, 0.9)'
    }
  },
  light: {
    name: 'light',
    colors: {
      primary: '#0099cc',
      secondary: '#ff6b35',
      accent: '#2ed573',
      background: '#ffffff',
      surface: '#f8f9fa',
      surfaceLight: '#e9ecef',
      text: '#212529',
      textSecondary: '#6c757d',
      textMuted: '#adb5bd',
      border: 'rgba(0, 153, 204, 0.3)',
      borderLight: 'rgba(0, 0, 0, 0.1)',
      shadow: 'rgba(0, 153, 204, 0.1)',
      error: '#dc3545',
      warning: '#ffc107',
      success: '#28a745',
      info: '#17a2b8'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #0099cc 0%, #006699 100%)',
      secondary: 'linear-gradient(135deg, #ff6b35 0%, #ff4757 100%)',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #e9ecef 100%)',
      surface: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      glass: 'rgba(248, 249, 250, 0.9)'
    }
  }
};

// 🎨 Animation Presets
const ANIMATIONS = {
  fadeIn: {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    duration: 300
  },
  slideIn: {
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(0)' },
    duration: 400
  },
  scaleIn: {
    from: { transform: 'scale(0.8)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
    duration: 300
  },
  bounce: {
    from: { transform: 'scale(1)' },
    to: { transform: 'scale(1.05)' },
    duration: 150
  }
};

// 🎨 Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [spacing, setSpacing] = useState('normal');

  // 🎨 Initialize theme from localStorage and system preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    setCurrentTheme(savedTheme === 'auto' ? (prefersDark ? 'dark' : 'light') : savedTheme);
    setReducedMotion(prefersReducedMotion);
    setHighContrast(prefersHighContrast);
  }, []);

  // 🎨 Apply theme to document
  useEffect(() => {
    const theme = THEMES[currentTheme];
    const root = document.documentElement;

    // Apply CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    Object.entries(theme.gradients).forEach(([key, value]) => {
      root.style.setProperty(`--gradient-${key}`, value);
    });

    // Apply theme class
    root.className = `theme-${currentTheme}`;
    if (reducedMotion) root.classList.add('reduced-motion');
    if (highContrast) root.classList.add('high-contrast');
    if (fontSize !== 'medium') root.classList.add(`font-size-${fontSize}`);
    if (spacing !== 'normal') root.classList.add(`spacing-${spacing}`);

    // Save to localStorage
    localStorage.setItem('theme', currentTheme);
  }, [currentTheme, reducedMotion, highContrast, fontSize, spacing]);

  // 🎨 Theme toggle function
  const toggleTheme = () => {
    setCurrentTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // 🎨 Set specific theme
  const setTheme = (themeName) => {
    if (THEMES[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  // 🎨 Toggle animations
  const toggleAnimations = () => {
    setAnimationsEnabled(prev => !prev);
  };

  // 🎨 Get current theme object
  const getCurrentTheme = () => THEMES[currentTheme];

  // 🎨 Get animation configuration
  const getAnimation = (name) => {
    if (!animationsEnabled || reducedMotion) {
      return { duration: 0 };
    }
    return ANIMATIONS[name] || ANIMATIONS.fadeIn;
  };

  // 🎨 Theme context value
  const themeValue = {
    currentTheme,
    theme: getCurrentTheme(),
    animationsEnabled,
    reducedMotion,
    highContrast,
    fontSize,
    spacing,
    toggleTheme,
    setTheme,
    toggleAnimations,
    setReducedMotion,
    setHighContrast,
    setFontSize,
    setSpacing,
    getAnimation,
    themes: THEMES
  };

  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// 🎨 Theme Hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};



// 🎨 Accessibility Controls Component
export const AccessibilityControls = ({ className = '' }) => {
  const { 
    animationsEnabled, 
    toggleAnimations, 
    fontSize, 
    setFontSize, 
    spacing, 
    setSpacing 
  } = useTheme();

  return (
    <div className={`accessibility-controls ${className}`}>
      <div className="control-group">
        <label>Font Size:</label>
        <select 
          value={fontSize} 
          onChange={(e) => setFontSize(e.target.value)}
          aria-label="Font size"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="xlarge">Extra Large</option>
        </select>
      </div>

      <div className="control-group">
        <label>Spacing:</label>
        <select 
          value={spacing} 
          onChange={(e) => setSpacing(e.target.value)}
          aria-label="Spacing"
        >
          <option value="compact">Compact</option>
          <option value="normal">Normal</option>
          <option value="relaxed">Relaxed</option>
        </select>
      </div>

      <div className="control-group">
        <label>
          <input
            type="checkbox"
            checked={animationsEnabled}
            onChange={toggleAnimations}
            aria-label="Enable animations"
          />
          Animations
        </label>
      </div>
    </div>
  );
};

// 🎨 Animated Component Wrapper
export const Animated = ({ 
  children, 
  animation = 'fadeIn', 
  delay = 0, 
  className = '',
  ...props 
}) => {
  const { getAnimation } = useTheme();
  const animConfig = getAnimation(animation);

  const style = {
    animationDelay: `${delay}ms`,
    animationDuration: `${animConfig.duration}ms`,
    ...props.style
  };

  return (
    <div 
      className={`animated animated-${animation} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

export default ThemeProvider; 
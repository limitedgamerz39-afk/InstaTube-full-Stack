import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// Available themes
const THEMES = {
  light: 'light',
  dark: 'dark',
  auto: 'auto'
};

// Theme configurations
const THEME_CONFIGS = {
  light: {
    name: 'Light',
    class: 'light',
    icon: '☀️'
  },
  dark: {
    name: 'Dark',
    class: 'dark',
    icon: '🌙'
  },
  auto: {
    name: 'Auto',
    class: 'auto',
    icon: '🔄'
  }
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && Object.keys(THEMES).includes(savedTheme)) {
      return savedTheme;
    }
    // Default to auto
    return 'auto';
  });

  const [systemTheme, setSystemTheme] = useState(() => {
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let appliedTheme = theme;
    if (theme === 'auto') {
      appliedTheme = systemTheme;
    }

    root.classList.add(appliedTheme);
    localStorage.setItem('theme', theme);
  }, [theme, systemTheme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      if (prevTheme === 'light') return 'dark';
      if (prevTheme === 'dark') return 'auto';
      return 'light';
    });
  };

  const setThemeMode = (newTheme) => {
    if (Object.keys(THEMES).includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  // Get current applied theme (resolved theme, not the setting)
  const getCurrentTheme = () => {
    if (theme === 'auto') {
      return systemTheme;
    }
    return theme;
  };

  // Get theme configuration
  const getThemeConfig = (themeName) => {
    return THEME_CONFIGS[themeName] || THEME_CONFIGS.light;
  };

  const value = {
    theme,
    systemTheme,
    toggleTheme,
    setTheme: setThemeMode,
    isDark: getCurrentTheme() === 'dark',
    isAuto: theme === 'auto',
    getCurrentTheme,
    getThemeConfig,
    themes: THEMES,
    themeConfigs: THEME_CONFIGS
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
import { useTheme } from '../context/ThemeContext';
import { useState, useRef, useEffect } from 'react';

const ThemeSwitcher = ({ className = '', showText = false }) => {
  const { theme, setTheme, themes, themeConfigs } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleThemeChange = (selectedTheme) => {
    setTheme(selectedTheme);
    setIsOpen(false);
  };

  const currentThemeConfig = themeConfigs[theme] || themeConfigs.light;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle theme"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="text-lg">{currentThemeConfig.icon}</span>
        {showText && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentThemeConfig.name}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-fadeIn">
          <div className="py-1">
            {Object.entries(themes).map(([themeKey, themeValue]) => {
              const config = themeConfigs[themeValue];
              return (
                <button
                  key={themeKey}
                  onClick={() => handleThemeChange(themeValue)}
                  className={`w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors ${
                    theme === themeValue
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-sm font-medium">{config.name}</span>
                  {theme === themeValue && (
                    <span className="ml-auto text-primary-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
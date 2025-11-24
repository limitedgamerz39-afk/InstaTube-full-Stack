import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiVolume2, FiSun, FiMoon, FiType, FiNavigation } from 'react-icons/fi';

const AccessibilitySettings = () => {
  const [accessibilityPrefs, setAccessibilityPrefs] = useState({
    highContrast: false,
    largerText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNav: true,
    dyslexiaFont: false,
    colorBlindMode: false,
    audioDescriptions: false,
  });

  // Load preferences from localStorage on component mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem('accessibilityPreferences');
    if (savedPrefs) {
      setAccessibilityPrefs(JSON.parse(savedPrefs));
    }
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('accessibilityPreferences', JSON.stringify(accessibilityPrefs));
    
    // Apply accessibility settings to the document
    applyAccessibilitySettings();
  }, [accessibilityPrefs]);

  const applyAccessibilitySettings = () => {
    // Apply high contrast mode
    if (accessibilityPrefs.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Apply larger text
    if (accessibilityPrefs.largerText) {
      document.documentElement.classList.add('larger-text');
    } else {
      document.documentElement.classList.remove('larger-text');
    }

    // Apply reduced motion
    if (accessibilityPrefs.reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }

    // Apply dyslexia font
    if (accessibilityPrefs.dyslexiaFont) {
      document.documentElement.classList.add('dyslexia-font');
    } else {
      document.documentElement.classList.remove('dyslexia-font');
    }

    // Apply color blind mode
    if (accessibilityPrefs.colorBlindMode) {
      document.documentElement.classList.add('color-blind');
    } else {
      document.documentElement.classList.remove('color-blind');
    }
  };

  const togglePreference = (pref) => {
    setAccessibilityPrefs(prev => ({
      ...prev,
      [pref]: !prev[pref]
    }));
  };

  const resetToDefaults = () => {
    setAccessibilityPrefs({
      highContrast: false,
      largerText: false,
      reducedMotion: false,
      screenReader: false,
      keyboardNav: true,
      dyslexiaFont: false,
      colorBlindMode: false,
      audioDescriptions: false,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Accessibility Settings</h2>
        <button 
          onClick={resetToDefaults}
          className="text-sm text-primary hover:text-primary-dark"
        >
          Reset to Defaults
        </button>
      </div>

      <div className="space-y-4">
        {/* High Contrast Mode */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FiSun className="text-purple-600 dark:text-purple-400 w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">High Contrast</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Increased contrast for better visibility</p>
            </div>
          </div>
          <button
            onClick={() => togglePreference('highContrast')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              accessibilityPrefs.highContrast ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                accessibilityPrefs.highContrast ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Larger Text */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FiType className="text-blue-600 dark:text-blue-400 w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Larger Text</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Increase font size for better readability</p>
            </div>
          </div>
          <button
            onClick={() => togglePreference('largerText')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              accessibilityPrefs.largerText ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                accessibilityPrefs.largerText ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Reduced Motion */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FiNavigation className="text-green-600 dark:text-green-400 w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Reduced Motion</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Minimize animations and transitions</p>
            </div>
          </div>
          <button
            onClick={() => togglePreference('reducedMotion')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              accessibilityPrefs.reducedMotion ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                accessibilityPrefs.reducedMotion ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Dyslexia Font */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <FiType className="text-yellow-600 dark:text-yellow-400 w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Dyslexia Font</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Special font for dyslexia-friendly reading</p>
            </div>
          </div>
          <button
            onClick={() => togglePreference('dyslexiaFont')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              accessibilityPrefs.dyslexiaFont ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                accessibilityPrefs.dyslexiaFont ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Color Blind Mode */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <FiSun className="text-red-600 dark:text-red-400 w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Color Blind Mode</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Adjust colors for color vision deficiency</p>
            </div>
          </div>
          <button
            onClick={() => togglePreference('colorBlindMode')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              accessibilityPrefs.colorBlindMode ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                accessibilityPrefs.colorBlindMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Keyboard Navigation */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <FiNavigation className="text-indigo-600 dark:text-indigo-400 w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Keyboard Navigation</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enable full keyboard navigation support</p>
            </div>
          </div>
          <button
            onClick={() => togglePreference('keyboardNav')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              accessibilityPrefs.keyboardNav ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                accessibilityPrefs.keyboardNav ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Audio Descriptions */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
              <FiVolume2 className="text-pink-600 dark:text-pink-400 w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Audio Descriptions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enable audio descriptions for videos</p>
            </div>
          </div>
          <button
            onClick={() => togglePreference('audioDescriptions')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              accessibilityPrefs.audioDescriptions ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                accessibilityPrefs.audioDescriptions ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Accessibility Tips</h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Use Tab key to navigate between interactive elements</li>
          <li>• Press Enter to activate buttons and links</li>
          <li>• Use arrow keys to navigate within menus and sliders</li>
          <li>• Press Esc to close modals and dropdowns</li>
        </ul>
      </div>
    </div>
  );
};

export default AccessibilitySettings;